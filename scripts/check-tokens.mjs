// check-tokens.mjs — the gate. It runs on styles.css and tailwind.css, the
// artifacts a consumer actually receives, not on the sources they were built
// from. That distinction has already mattered once upstream: an entry point
// made of @import lines passed every source-level check for years while no
// bundler on earth could resolve a single token from it.
//
// Every defect below is silent by nature. An undefined custom property paints
// nothing and reports nothing. A gold that fails contrast in the light theme
// looks FINE. A token this package declares in :root can quietly outrank the
// substrate's .light value and break only the light theme, only sometimes. None
// of these can fail loudly on their own, so they fail here.
//
// Run via `pnpm test` (part of `build`).
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const substrate = dirname(require.resolve('@hanzo/design/styles.css'))
const read = (p) => readFileSync(p, 'utf8')
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '')

let failures = 0
const fail = (m) => { console.error(`  FAIL  ${m}`); failures++ }
const pass = (m) => console.log(`  ok    ${m}`)

const sheet = read(join(root, 'styles.css'))
const bare = strip(sheet)
const brandSrc = strip(read(join(root, 'tokens', 'brand.css')))

/** Merge every block matching `re`, in source order — last wins, as the cascade does. */
const merge = (css, re) => {
  const o = {}
  for (const m of css.matchAll(re))
    for (const [, n, v] of m[1].matchAll(/--([A-Za-z0-9-]+)\s*:\s*([^;]+);/g)) o[n] = v.trim()
  return o
}
const ROOT = /:root\s*\{([^{}]*)\}/g
const LIGHT = /\.light\s*\{([^{}]*)\}/g

// ── 1. the sheet is Lux ──────────────────────────────────────────────────
// The substrate ships --hanzo-black/--hanzo-white and six hanzo-* keyframes.
// A custom property is VOCABULARY: a Lux surface must not show --hanzo-black in
// its DevTools, and a Lux keyframe must not be called hanzo-glow. gen-tokens
// renames them wholesale; this proves the rename actually ran and stayed total.
// Depending on @hanzo/design is the model and is fine — wearing its name is not.
{
  const hits = [...bare.matchAll(/hanzo/gi)]
  hits.length
    ? fail(`styles.css contains ${hits.length} "hanzo" occurrence(s) outside comments — e.g. …${bare.slice(Math.max(0, hits[0].index - 40), hits[0].index + 25).replace(/\s+/g, ' ')}…`)
    : pass('styles.css speaks Lux — no Hanzo identifier survives the inherit')
}

// ── 2. the sheet is resolvable ───────────────────────────────────────────
// An @import here is unresolvable from a consumer's directory and is dropped
// outright when it does not come first. A url() is a promise to ship a file
// this package deliberately does not ship: Geist belongs to @hanzo/design,
// which self-hosts it, and a rule pointing at a woff2 that is not here fails
// every consumer's build on a missing module.
{
  bare.includes('@import')
    ? fail('styles.css contains an @import — a consumer cannot resolve it')
    : pass('styles.css has no @import to resolve')

  const urls = [...bare.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].map((m) => m[1])
  urls.length
    ? fail(`styles.css references ${urls.length} url() — ${urls.join(', ')} — but ships no assets; Geist is owned by @hanzo/design`)
    : pass('styles.css has no url() — it ships no assets and promises none')
}

// ── 3. the sheets PARSE ──────────────────────────────────────────────────
// RENDERING IS NOT PARSING. A browser recovers from a stray `*/` by skipping to
// the next thing that looks like a rule, so the page still screenshots
// correctly; PostCSS throws, and the version is unbuildable for every Vite /
// Next / Tailwind consumer. Upstream shipped exactly that twice. A visual check
// cannot see it, because the browser's error recovery is what hides it.
for (const f of ['styles.css', 'tailwind.css']) {
  const s = read(join(root, f))
  let i = 0, opened = 0, strays = [], unterminated = null
  while (i < s.length - 1) {
    if (s[i] === '/' && s[i + 1] === '*') {
      opened++
      const j = s.indexOf('*/', i + 2)
      if (j < 0) { unterminated = s.slice(0, i).split('\n').length; break }
      i = j + 2; continue
    }
    if (s[i] === '*' && s[i + 1] === '/') { strays.push(s.slice(0, i).split('\n').length); i += 2; continue }
    i++
  }
  const braces = [...s].reduce((n, c) => n + (c === '{') - (c === '}'), 0)
  if (unterminated !== null) fail(`${f}: unterminated /* at line ${unterminated}`)
  else if (strays.length) fail(`${f}: stray */ at line ${strays.join(', ')} — a consumer's PostCSS build throws here`)
  else if (braces !== 0) fail(`${f}: ${Math.abs(braces)} unbalanced ${braces > 0 ? '{' : '}'}`)
  else pass(`${f} is lexically sound — ${opened} comments closed, braces balanced`)
}

// ── 4. every var() in the shipped sheet resolves ─────────────────────────
// The headline check. An undefined custom property does not throw, does not
// warn, and does not paint — `border-color: var(--gone)` falls back to
// currentColor and draws a stark white hairline on black, which reads as a
// design choice rather than a missing declaration.
{
  const declared = new Set([...bare.matchAll(/--([A-Za-z0-9-]+)\s*:/g)].map((m) => m[1]))
  const ghosts = new Map()
  // A var() with a fallback — var(--x, #fff) — still paints, so only bare
  // references are load-bearing here.
  for (const m of bare.matchAll(/var\(\s*--([A-Za-z0-9-]+)\s*\)/g)) if (!declared.has(m[1])) ghosts.set(m[1], true)
  ghosts.size
    ? [...ghosts.keys()].forEach((n) => fail(`styles.css uses var(--${n}), which nothing in the sheet declares — it resolves to nothing`))
    : pass(`all ${declared.size} declared tokens resolve every bare var() in the sheet`)
}

// ── 5. the Tailwind bridge is complete and self-contained ────────────────
{
  const tw = strip(read(join(root, 'tailwind.css')))
  tw.includes('@import')
    ? fail('tailwind.css contains an @import — invalid after `@import "tailwindcss"`, so the tokens are dropped')
    : pass('tailwind.css has no @import to invalidate')

  const slots = ['background', 'foreground', 'card', 'popover', 'primary', 'secondary', 'muted',
                 'muted-foreground', 'accent', 'destructive', 'border', 'input', 'ring', 'brand', 'brand-foreground']
  const unmapped = slots.filter((s) => !tw.includes(`--color-${s}:`))
  unmapped.length
    ? fail(`tailwind.css does not map: ${unmapped.join(', ')}`)
    : pass(`tailwind.css maps all ${slots.length} colour slots, brand included`)

  tw.includes('--brand:')
    ? pass('tailwind.css carries the token values inline')
    : fail('tailwind.css maps slots but carries no tokens — every utility resolves to nothing')
}

// ── 6. element defaults must LOSE to an app's utilities ──────────────────
// A rule outside a cascade layer beats a rule inside one regardless of
// specificity, so an unlayered `a{color:…}` silently outranks every Tailwind
// text utility on every anchor. Inherited from the substrate — checked here
// because the inherit could drop it and nothing would say so.
{
  const layered = /@layer\s+base\s*\{/.test(bare)
  layered ? pass('inherited element defaults are inside @layer base') : fail('the sheet has no @layer base — element rules outrank every utility an app writes')
}

// ── 7. contrast, in both themes ──────────────────────────────────────────
{
  const dark = merge(bare, ROOT)
  const light = { ...dark, ...merge(bare, LIGHT) }
  const themes = { dark, light }

  const deref = (v, s, d = 0) => { const m = d < 10 && v && String(v).match(/^var\(\s*--([A-Za-z0-9-]+)\s*\)$/); return m ? deref(s[m[1]], s, d + 1) : v }
  const rgb = (v) => {
    if (!v) return null
    let m = String(v).trim().match(/^#([0-9a-f]{6})$/i)
    if (m) { const n = parseInt(m[1], 16); return [n >> 16 & 255, n >> 8 & 255, n & 255, 1] }
    m = String(v).trim().match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[/,]\s*([\d.]+))?\s*\)$/i)
    return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null
  }
  const over = (f, b) => [0, 1, 2].map((i) => f[i] * f[3] + b[i] * (1 - f[3]))
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
  const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  const ratio = (fg, bg, s) => {
    const f = rgb(deref(fg, s)), b = rgb(deref(bg, s))
    if (!f || !b) return null
    const base = s === themes.light ? [255, 255, 255, 1] : [0, 0, 0, 1]
    const bo = b[3] < 1 ? over(b, base) : b.slice(0, 3)
    const fo = f[3] < 1 ? over(f, bo) : f.slice(0, 3)
    const [A, B] = [lum(fo), lum(bo)].sort((x, y) => y - x)
    return (A + 0.05) / (B + 0.05)
  }

  const CANVASES = ['background', 'card', 'popover', 'muted', 'secondary', 'surface-card', 'surface-overlay']
  // The gate follows the DUTY. --ring is the focus indicator — transient,
  // keyboard-only, and the whole of how someone knows where they are: WCAG
  // 2.4.11's 3:1 against every surface it can land on. --brand is Lux's accent
  // and it is spent on TEXT (the gold headline, the eyebrow pill's label), so it
  // owes 4.5:1. Boundaries that are merely affordances owe nothing and are free
  // to be as quiet as they look.
  const GATED = { ring: 3, brand: 4.5 }
  for (const [theme, scope] of Object.entries(themes)) {
    for (const [tok, min] of Object.entries(GATED)) {
      let worst = Infinity, where = ''
      for (const c of CANVASES) {
        const r = ratio(scope[tok], scope[c], scope)
        if (r !== null && r < worst) { worst = r; where = `--${c}` }
      }
      if (!isFinite(worst)) { fail(`--${tok} (${theme}) could not be measured`); continue }
      worst < min
        ? fail(`--${tok} (${theme}) is ${worst.toFixed(2)}:1 on ${where} — needs ${min}:1`)
        : pass(`--${tok} (${theme}) ${worst.toFixed(2)}:1 worst case (${where})`)
    }
    // A fill and the ink laid on it are one decision. Near-black reads 6.98:1 on
    // the dark gold and only 3.93:1 on the light one, so the pairing has to flip
    // with the theme — and if it ever stops flipping, that is unreadable text on
    // a button rather than anything that looks broken.
    const r = ratio(scope['brand-foreground'], scope['brand'], scope)
    r === null ? fail(`--brand-foreground on --brand (${theme}) could not be measured`)
      : r < 4.5 ? fail(`--brand-foreground on --brand (${theme}) is ${r.toFixed(2)}:1 — needs 4.5:1`)
      : pass(`--brand-foreground on --brand (${theme}) ${r.toFixed(2)}:1`)
  }
}

// ── 8. the brand layer survives the light theme ──────────────────────────
// Two ways a layered brand token dies in `.light`, both silent:
//
// (a) The gold does not invert. #B8960C is 6.98:1 on the page in dark and
//     2.65:1 in light — the same failure mode as building a border out of
//     white-alpha, which is the bug upstream wrote its own rule for.
//
// (b) THE LAYERING TRAP. `:root` and `.light` have identical specificity, so
//     source order alone decides. This package's tokens are written AFTER the
//     substrate's, which is what lets the brand layer win — and it means a
//     token declared only in this package's `:root` also outranks the
//     substrate's `.light` value for that same token. Light mode would then
//     silently keep a dark-theme value. Restating in `.light` is the fix; this
//     proves it was not forgotten.
{
  const mine = merge(brandSrc, ROOT)
  const myLight = new Set(Object.keys(merge(brandSrc, LIGHT)))
  const substrateLight = new Set(Object.keys(merge(strip(read(join(substrate, 'styles.css'))), LIGHT)))
  // --lux-* are press-kit constants — a palette, not a semantic token. Light
  // themes restate the tokens BUILT from a palette, never the palette itself.
  const PALETTE = /^lux-/

  const stranded = Object.keys(mine).filter((k) => !PALETTE.test(k) && !myLight.has(k))
  stranded.length
    ? stranded.forEach((k) => fail(`--${k} is declared in the Lux layer's :root with no .light value — it keeps its dark value in the light theme`))
    : pass(`every semantic token the Lux layer declares is restated in .light (${Object.keys(mine).length - 1} of ${Object.keys(mine).length}, --lux-gold exempt as palette)`)

  const shadowed = Object.keys(mine).filter((k) => substrateLight.has(k) && !myLight.has(k))
  shadowed.length
    ? shadowed.forEach((k) => fail(`--${k} is declared later than the substrate's .light value for it — the light theme silently loses that override`))
    : pass('no Lux token shadows an inherited .light value')
}

console.log(failures ? `\n${failures} check(s) failed` : '\nall token checks passed')
process.exit(failures ? 1 : 0)
