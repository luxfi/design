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
import { readFileSync, readdirSync } from 'node:fs'
import { inflateSync } from 'node:zlib'
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

/** Drop every conditional at-rule body, brace-matched.
 *  A `:root` inside `@media (min-width:48rem)` is a RESPONSIVE OVERRIDE, not a
 *  base declaration, and merging it as one is wrong in both directions: it made
 *  the sheet look like it declared --section-y:4rem when the authored default
 *  is 2.5rem. What the tokens mean at their base is what everything below
 *  measures, so the conditional layers come off first. */
const stripAt = (css) => {
  let out = '', i = 0
  for (;;) {
    const m = /@(?:media|supports|container)[^{]*\{/.exec(css.slice(i))
    if (!m) return out + css.slice(i)
    const open = i + m.index + m[0].length
    out += css.slice(i, i + m.index)
    let j = open, depth = 1
    while (j < css.length && depth) {
      if (css[j] === '{') depth++
      else if (css[j] === '}') depth--
      j++
    }
    i = j
  }
}

/** Merge every block matching `re`, in source order — last wins, as the cascade does. */
const merge = (css, re) => {
  const o = {}
  for (const m of stripAt(css).matchAll(re))
    for (const [, n, v] of m[1].matchAll(/--([A-Za-z0-9-]+)\s*:\s*([^;]+);/g)) o[n] = v.trim()
  return o
}
const ROOT = /:root(?::root)?\s*\{([^{}]*)\}/g
const LIGHT = /\.light(?:\.light)?\s*\{([^{}]*)\}/g

// ── colour arithmetic, shared by the contrast and the achromatic checks ──
/** Follow a `var(--x)` alias chain through a resolved scope to its literal. */
const deref = (v, s, d = 0) => {
  const m = d < 10 && v && String(v).match(/^var\(\s*--([A-Za-z0-9-]+)\s*\)$/)
  return m ? deref(s[m[1]], s, d + 1) : v
}
/** `#rgb`, `#rrggbb` or `rgb()/rgba()` -> [r,g,b,a]; null for anything else. */
const rgb = (v) => {
  if (!v) return null
  let m = String(v).trim().match(/^#([0-9a-f]{3})$/i)
  if (m) { const [r, g, b] = [...m[1]].map((c) => parseInt(c + c, 16)); return [r, g, b, 1] }
  m = String(v).trim().match(/^#([0-9a-f]{6})$/i)
  if (m) { const n = parseInt(m[1], 16); return [n >> 16 & 255, n >> 8 & 255, n & 255, 1] }
  m = String(v).trim().match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[/,]\s*([\d.]+))?\s*\)$/i)
  return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null
}
/** How far a colour is from grey, in 0–255 levels. Zero means R === G === B. */
const chroma = ([r, g, b]) => Math.max(r, g, b) - Math.min(r, g, b)
/** Hue in degrees, 0–360. Meaningless when chroma is 0. */
const hue = ([r, g, b]) => {
  const max = Math.max(r, g, b), c = chroma([r, g, b])
  if (!c) return 0
  const h = max === r ? ((g - b) / c) % 6 : max === g ? (b - r) / c + 2 : (r - g) / c + 4
  return (h * 60 + 360) % 360
}
const over = (f, b) => [0, 1, 2].map((i) => f[i] * f[3] + b[i] * (1 - f[3]))
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
/** WCAG contrast of two tokens resolved in one theme, compositing alpha on the page. */
const ratio = (fg, bg, s, light) => {
  const f = rgb(deref(fg, s)), b = rgb(deref(bg, s))
  if (!f || !b) return null
  const base = light ? [255, 255, 255, 1] : [0, 0, 0, 1]
  const bo = b[3] < 1 ? over(b, base) : b.slice(0, 3)
  const fo = f[3] < 1 ? over(f, bo) : f.slice(0, 3)
  const [A, B] = [lum(fo), lum(bo)].sort((x, y) => y - x)
  return (A + 0.05) / (B + 0.05)
}

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

  const CANVASES = ['background', 'card', 'popover', 'muted', 'secondary', 'surface-card', 'surface-overlay']
  // The gate follows the DUTY. --ring is the focus indicator — transient,
  // keyboard-only, and the whole of how someone knows where they are: WCAG
  // 2.4.11's 3:1 against every surface it can land on. --brand is Lux's accent
  // and it is spent on TEXT (the eyebrow pill's label, a live/active state), so
  // it owes 4.5:1. Boundaries that are merely affordances owe nothing and are
  // free to be as quiet as they look.
  //
  // A monochrome accent clears both by a mile — that is not a reason to drop
  // the check. It is the reason to keep it: the ratios are what will notice if
  // someone reaches for a hue again, and they are exactly what the accent had
  // no room for when it was one (1.96:1 on the light page, at 0.1.0).
  const GATED = { ring: 3, brand: 4.5 }
  for (const [theme, scope] of Object.entries(themes)) {
    const isLight = theme === 'light'
    for (const [tok, min] of Object.entries(GATED)) {
      let worst = Infinity, where = ''
      for (const c of CANVASES) {
        const r = ratio(scope[tok], scope[c], scope, isLight)
        if (r !== null && r < worst) { worst = r; where = `--${c}` }
      }
      if (!isFinite(worst)) { fail(`--${tok} (${theme}) could not be measured`); continue }
      worst < min
        ? fail(`--${tok} (${theme}) is ${worst.toFixed(2)}:1 on ${where} — needs ${min}:1`)
        : pass(`--${tok} (${theme}) ${worst.toFixed(2)}:1 worst case (${where})`)
    }
    // A fill and the ink laid on it are one decision, and the pairing has to
    // FLIP with the theme — if it ever stops flipping, that is unreadable text
    // on a button rather than anything that looks broken.
    const r = ratio(scope['brand-foreground'], scope['brand'], scope, isLight)
    r === null ? fail(`--brand-foreground on --brand (${theme}) could not be measured`)
      : r < 4.5 ? fail(`--brand-foreground on --brand (${theme}) is ${r.toFixed(2)}:1 — needs 4.5:1`)
      : pass(`--brand-foreground on --brand (${theme}) ${r.toFixed(2)}:1`)
  }
}

// ── 8. the brand layer survives the light theme ──────────────────────────
// THE LAYERING TRAP. This layer's selectors are doubled — `:root:root` is
// (0,2,0) — which is what lets it beat the substrate no matter the import
// order. The cost of winning that fight is that it also beats the substrate's
// own `.light` block, which is only (0,1,0). So a token this package declares
// in `:root:root` and nowhere else keeps its DARK value in the light theme,
// silently, forever. Restating in `.light.light` is the fix; this proves it
// was not forgotten. The failure is invisible by construction — nothing
// errors, the light theme just quietly wears one dark value.
//
// EXCEPT when the declared value is a bare `var(--x)` onto something that
// already inverts. `--muted:var(--card)` needs no restatement: --card is
// restated below, so --muted follows it into the light theme on its own. That
// is not a loophole, it is the DRY way to say "these two surfaces are the same
// surface", and a gate that forbade it would push the author into copying the
// value twice — which is the exact duplication this package exists to remove.
//
// This replaces a cruder rule that exempted anything named `--lux-*` as a
// "palette constant". That exemption existed for one token, --lux-gold, which
// 0.1.1 deleted; leaving it in place would have meant a future `--lux-anything`
// silently opting out of the only check that catches this. A value-shaped
// exemption is checkable. A name-shaped one is a promise.
{
  const mine = merge(brandSrc, ROOT)
  const myLight = new Set(Object.keys(merge(brandSrc, LIGHT)))
  const substrateLight = new Set(Object.keys(merge(strip(read(join(substrate, 'styles.css'))), LIGHT)))

  /** Does this token reach a light value — restated here, or via an alias chain
   *  onto something that is? */
  const inverts = (k, d = 0) => {
    if (myLight.has(k)) return true
    if (d > 10) return false
    const m = String(mine[k] ?? '').match(/^var\(\s*--([A-Za-z0-9-]+)\s*\)$/)
    return m ? (substrateLight.has(m[1]) || inverts(m[1], d + 1)) : false
  }

  const declared = Object.keys(mine)
  // A brand layer that declares nothing has nothing to restate, and would sail
  // through every check below it. That is not a pass, it is a parse failure
  // upstream of one — most likely a comment that swallowed the block.
  if (!declared.length) fail('the Lux layer declares no token in :root — tokens/brand.css did not parse')
  else {
    const stranded = declared.filter((k) => !inverts(k))
    const aliased = declared.filter((k) => !myLight.has(k) && inverts(k))
    stranded.length
      ? stranded.forEach((k) => fail(`--${k} is declared in the Lux layer's :root with no .light value and no inverting alias — it keeps its dark value in the light theme`))
      : pass(`all ${declared.length} tokens the Lux layer declares reach the light theme (${declared.length - aliased.length} restated, ${aliased.length} via an inverting alias)`)
  }

  const shadowed = declared.filter((k) => substrateLight.has(k) && !inverts(k))
  shadowed.length
    ? shadowed.forEach((k) => fail(`--${k} outranks the substrate's .light value for it — the light theme silently loses that override`))
    : pass('no Lux token shadows an inherited .light value')
}

// ── 9. the typed layer agrees with the stylesheet ────────────────────────
// The whole reason src/tokens.gen.ts is generated rather than written is so
// that code and CSS cannot disagree. Generating it does not actually guarantee
// that — it only moves the mistake into the generator, where it is harder to
// see. A first cut read every declaration regardless of which block it sat in,
// so --brand-foreground, which the Lux layer declares only in `.light`, was
// reported to code as #ffffff while the sheet correctly painted #09090b. The
// build was green, the stylesheet was right, and every TS consumer got the
// light value as the default. Only installing the tarball surfaced it, which is
// exactly the kind of thing that should never need a human to notice.
{
  const gen = read(join(root, 'src', 'tokens.gen.ts'))
  const m = gen.match(/export const cssVars = \{([\s\S]*?)\n\} as const/)
  if (!m) fail('src/tokens.gen.ts declares no cssVars map')
  else {
    const typed = Object.fromEntries([...m[1].matchAll(/'(--[^']+)':\s*'((?:[^'\\]|\\.)*)'/g)].map(([, n, v]) => [n, v.replace(/\\'/g, "'").replace(/\\\\/g, '\\')]))
    const authored = merge(bare, ROOT)   // the sheet's dark defaults, as the cascade resolves them
    const drift = Object.entries(typed).filter(([n, v]) => n.slice(2) in authored && authored[n.slice(2)] !== v)
    drift.length
      ? drift.slice(0, 8).forEach(([n, v]) => fail(`${n} is '${v}' to code but '${authored[n.slice(2)]}' in the sheet — the typed layer and the stylesheet disagree`))
      : pass(`the typed layer matches the sheet on all ${Object.keys(typed).length} tokens`)
  }
}

// ── 10. everything this package SHIPS resolves against the sheet ─────────
// Check 4 proves the stylesheet is internally consistent. It says nothing about
// the components, kits, specimen cards and prompts shipped alongside it, and
// those are the files a consumer actually renders.
//
// Swapping the forked token layer for the inherited one silently orphaned two
// names. The fork declared --border-hairline (a solid #262626) and
// --border-card; the substrate draws every one of those boundaries with a
// single alpha --border, and explains at length why alpha beats a solid hex
// there. Nineteen shipped files still asked for the old names. An undefined
// custom property in `border:1px solid var(--gone)` does not fail — the
// declaration is invalid at computed-value time, border-color falls back to
// currentColor, and every card, avatar, table and dialog draws its edge in the
// INK colour: a stark near-white hairline on black that reads as a bold design
// choice rather than as nineteen broken files.
//
// Two names for one thing is also just the duplication this package exists to
// remove, so they were not re-declared as aliases — the components now speak the
// substrate's vocabulary, and this keeps it that way.
{
  const files = []
  const walk = (d) => {
    for (const e of readdirSync(join(root, d), { withFileTypes: true })) {
      const p = `${d}/${e.name}`
      if (e.isDirectory()) walk(p)
      else if (/\.(jsx|tsx|html|css|md)$/.test(e.name)) files.push(p)
    }
  }
  for (const d of ['components', 'ui_kits', 'guidelines', 'prompts', 'docs', 'content']) {
    try { walk(d) } catch { /* an optional directory */ }
  }
  const declared = new Set([...bare.matchAll(/--([A-Za-z0-9-]+)\s*:/g)].map((m) => m[1]))
  const orphans = new Map()
  for (const f of files)
    for (const m of read(join(root, f)).matchAll(/var\(\s*--([A-Za-z0-9-]+)\s*\)/g))
      if (!declared.has(m[1])) (orphans.get(m[1]) ?? orphans.set(m[1], []).get(m[1])).push(f)
  orphans.size
    ? [...orphans].forEach(([n, fs]) => fail(`--${n} is used by ${fs.length} shipped file(s) (${fs.slice(0, 3).join(', ')}) but nothing declares it — those rules fall back to currentColor`))
    : pass(`every var() in all ${files.length} shipped components, kits, cards and prompts resolves`)
}

// ── 11. nothing Lux paints has a hue ─────────────────────────────────────
// The CTO's instruction for 0.1.1, verbatim: "no gold in lux, only monochrome
// white and black, more severe and minimal than hanzo.ai". This is that
// sentence made executable, and it is the check 0.1.0 did not have — which is
// why 0.1.0 could ship #D4AF37 with a green build.
//
// It runs on the RESOLVED cascade, both themes, not on the sources: a token
// the Lux layer overrides is judged by the value that actually wins, and the
// substrate's earlier declaration of it is correctly ignored. That matters
// immediately — the inherited --brand-foreground is #09090b, which is not grey
// (blue runs two levels above red and green), and the layer replaces it.
//
// Three hues survive, and they are SIGNALS, not decoration: an error must not
// look like a disabled control, and a live dot must be readable as live. They
// are named here rather than pattern-matched so that adding a fourth is an
// edit somebody has to justify in a diff.
//
// The second tooth is the one that ties this package to the rest of the
// estate. lux.network's repo carries an end-to-end test asserting the page
// paints zero pixels in hue band 20–60 — the gold band. That test is correct
// and must stay. So every hue this file permits is checked against the same
// fence: red sits at 0deg and the greens at 142deg, comfortably outside, and
// if anyone ever adds an amber "warning" state it fails here first, at build
// time, instead of in another repo's browser.
{
  const SIGNAL = new Set(['state-error', 'state-error-text', 'state-error-bg', 'state-online', 'state-success', 'destructive-hover'])
  const FENCE = [20, 60]
  const dark = merge(bare, ROOT)
  const themes = { dark, light: { ...dark, ...merge(bare, LIGHT) } }
  // Colour syntaxes this check cannot read. Unknown must fail, not pass — a
  // gate that silently skips what it does not understand is worse than none,
  // and oklch() is exactly how the gold is written on lux.network today.
  const OPAQUE_SYNTAX = /\b(oklch|oklab|lab|lch|hsl|hwb|color)\(/i
  const LITERAL = /#[0-9a-f]{6}\b|#[0-9a-f]{3}\b|rgba?\([^)]*\)/gi

  for (const [theme, scope] of Object.entries(themes)) {
    const tinted = [], unreadable = [], fenced = []
    for (const [tok, val] of Object.entries(scope)) {
      if (OPAQUE_SYNTAX.test(val)) { unreadable.push(`--${tok}: ${val}`); continue }
      for (const lit of String(val).match(LITERAL) ?? []) {
        const c = rgb(lit)
        if (!c) continue
        const ch = chroma(c)
        if (!ch) continue
        const h = hue(c)
        if (!SIGNAL.has(tok)) tinted.push(`--${tok} is ${lit} — chroma ${ch}/255 at hue ${h.toFixed(0)}deg`)
        else if (h >= FENCE[0] && h <= FENCE[1]) fenced.push(`--${tok} is ${lit} — hue ${h.toFixed(0)}deg`)
      }
    }
    unreadable.forEach((u) => fail(`${theme}: ${u} — this check cannot read that colour syntax, so it cannot prove it is achromatic`))
    tinted.length
      ? tinted.forEach((t) => fail(`${theme}: ${t}. Lux is monochrome; only ${[...SIGNAL].map((s) => `--${s}`).join(', ')} may carry a hue`))
      : pass(`${theme}: every token resolves achromatic (R=G=B) except the ${SIGNAL.size} named signals`)
    fenced.length
      ? fenced.forEach((f) => fail(`${theme}: ${f} — inside hue band ${FENCE[0]}-${FENCE[1]}, which lux.network's e2e asserts is empty`))
      : pass(`${theme}: no permitted hue falls in the fenced band ${FENCE[0]}-${FENCE[1]} (the gold)`)
  }
}

// ── 12. the specimen cards tell the truth ────────────────────────────────
// guidelines/*.card.html are the documentation a consumer LOOKS at, and each
// swatch prints the token's value beside its name. That printed value is a
// second copy of a fact the stylesheet already owns, and second copies rot:
// this package shipped `--border = #1f1f1f`, `--border = white/10` and
// `--ring = #333 · focus` on three chips that all correctly PAINTED the
// current token. The swatch was right, the caption was a fossil of the fork,
// and nothing could tell — the card renders perfectly either way.
//
// So the caption is checked against the sheet whenever it is a colour literal.
// Prose captions ("white/8 · the hairline", "n-800 / 50%") are skipped on
// purpose: a rung description is not a claim about an exact value, and forcing
// every caption into a hex would make the cards less readable, not more true.
{
  const dark = merge(bare, ROOT)
  const PAIR = /<div class="n">--([A-Za-z0-9-]+)<\/div><div class="v">([^<]*)<\/div>/g
  const norm = (c) => { const p = rgb(c); return p ? `${p[0]},${p[1]},${p[2]},${p[3]}` : null }
  let checked = 0
  const wrong = []
  for (const f of readdirSync(join(root, 'guidelines'))) {
    if (!f.endsWith('.card.html')) continue
    for (const [, tok, label] of read(join(root, 'guidelines', f)).matchAll(PAIR)) {
      const claimed = norm(label.trim())
      if (claimed === null) continue            // a prose caption, not a claim
      checked++
      const actual = norm(deref(dark[tok], dark))
      if (actual === null) wrong.push(`${f}: --${tok} is captioned ${label.trim()} but the sheet's value (${dark[tok] ?? 'undeclared'}) is not a plain colour`)
      else if (actual !== claimed) wrong.push(`${f}: --${tok} is captioned ${label.trim()} but the sheet says ${deref(dark[tok], dark)}`)
    }
  }
  wrong.length
    ? wrong.forEach((w) => fail(w))
    : pass(`all ${checked} colour-literal caption(s) in the specimen cards match the sheet`)
}

// ── 13. the brand imagery is achromatic too ──────────────────────────────
// Tokens are not the only thing that paints. This package shipped
// assets/brand/hero-visualization.png — two faces over a full-spectrum rainbow
// circle, 39% of its pixels saturated and 8.6% of them inside the 20–60 gold
// band — inside a specimen card captioned "cool-toned, low-key, no warm
// gradients, no illustration style". Every rule this package publishes forbade
// it (prompts/rules.md lists "colour a gradient or hero for decoration" in the
// DON'T column), and it shipped anyway, because nothing looked. 0.1.1 deleted
// it; this is what stops the next one.
//
// Only Lux's OWN imagery is held to this. assets/logos/ and assets/providers/
// are third-party marks, which prompts/system.md has always permitted in their
// own hex — a partner's logo is their fact, not ours.
//
// The PNG reader below is about forty lines on node:zlib rather than a
// dependency. A design-token package earning an image-decoding dependency to
// check four files would be a bad trade, and the format needed here is the
// narrow one: 8-bit, non-interlaced, colour type 2/3/6. Anything else FAILS
// rather than passes — a check that cannot read its input must never call that
// a pass.
{
  const decode = (buf) => {
    if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG')
    const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20)
    const depth = buf[24], ctype = buf[25], interlace = buf[28]
    if (depth !== 8 || interlace !== 0 || ![2, 3, 6].includes(ctype)) throw new Error(`unsupported PNG: depth ${depth}, colour type ${ctype}, interlace ${interlace}`)
    let plte = null
    const idat = []
    for (let p = 8; p < buf.length;) {
      const len = buf.readUInt32BE(p), tag = buf.toString('ascii', p + 4, p + 8)
      if (tag === 'PLTE') plte = buf.subarray(p + 8, p + 8 + len)
      else if (tag === 'IDAT') idat.push(buf.subarray(p + 8, p + 8 + len))
      else if (tag === 'IEND') break
      p += 12 + len
    }
    const raw = inflateSync(Buffer.concat(idat))
    const bpp = ctype === 6 ? 4 : ctype === 2 ? 3 : 1
    const stride = w * bpp
    const out = Buffer.alloc(h * stride)
    // Undo the per-scanline filters (PNG spec 9.2). Each row is prefixed by
    // its filter byte and is predicted from the row above and the pixel left.
    for (let y = 0; y < h; y++) {
      const f = raw[y * (stride + 1)]
      const src = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride)
      const cur = out.subarray(y * stride, (y + 1) * stride)
      const prev = y ? out.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride)
      for (let i = 0; i < stride; i++) {
        const a = i >= bpp ? cur[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0
        let v = src[i]
        if (f === 1) v += a
        else if (f === 2) v += b
        else if (f === 3) v += (a + b) >> 1
        else if (f === 4) { const p0 = a + b - c, pa = Math.abs(p0 - a), pb = Math.abs(p0 - b), pc = Math.abs(p0 - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c }
        else if (f !== 0) throw new Error(`unknown row filter ${f}`)
        cur[i] = v & 255
      }
    }
    const px = (i) => ctype === 3 ? [plte[out[i] * 3], plte[out[i] * 3 + 1], plte[out[i] * 3 + 2]] : [out[i * bpp], out[i * bpp + 1], out[i * bpp + 2]]
    return { w, h, n: w * h, px }
  }

  let files = []
  try { files = readdirSync(join(root, 'assets', 'brand')).filter((f) => /\.png$/i.test(f)) } catch { /* no imagery */ }
  const bad = []
  for (const f of files) {
    try {
      const { n, px } = decode(readFileSync(join(root, 'assets', 'brand', f)))
      let tinted = 0, worst = 0
      for (let i = 0; i < n; i++) { const c = chroma(px(i)); if (c > 2) tinted++; if (c > worst) worst = c }
      // A tolerance of 2/255 rather than 0: these are lossy-authored raster
      // assets, and a stray ±1 from an encoder is not a design decision. 0.1%
      // of pixels is likewise noise, not a gradient.
      if (tinted / n > 0.001) bad.push(`assets/brand/${f} — ${(100 * tinted / n).toFixed(1)}% of pixels carry colour (peak chroma ${worst}/255). Lux imagery is achromatic.`)
    } catch (e) { bad.push(`assets/brand/${f} — cannot be read (${e.message}), so it cannot be proven achromatic`) }
  }
  bad.length
    ? bad.forEach((b) => fail(b))
    : pass(`all ${files.length} brand image(s) are achromatic`)
}

console.log(failures ? `\n${failures} check(s) failed` : '\nall token checks passed')
process.exit(failures ? 1 : 0)
