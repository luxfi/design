// @luxfi/design — the ONE programmatic control plane for Lux's look & feel.
//
// Lux is the shared neutral system with the warm bias put back. The neutral
// system is @hanzo/design and is inherited, not copied; the Lux brand facts —
// the gold, the mark constants — are authored in tokens/brand.css. Both arrive
// here as one generated module, so code and CSS cannot disagree.
//
//   import '@luxfi/design/styles.css'                          // the CSS layer
//   import { colors, brand, cssVar } from '@luxfi/design'      // the code layer
//
export * from './tokens.gen.js'
import { cssVars, type CssVarName } from './tokens.gen.js'

/** A token name with the leading `--` omitted: `'brand'` for `'--brand'`. */
export type TokenName = CssVarName extends `--${infer N}` ? N : never

/**
 * A `var(--name, <authored literal>)` reference to a token — the ONE way code
 * should reach a token, so it resolves through the live CSS cascade (honoring
 * the viewer's light/dark theme) rather than baking a value that cannot change.
 *
 *   background: cssVar('--background')   // → "var(--background, #0a0a0a)"
 *   color:      cssVar('brand')          // → "var(--brand, var(--lux-gold))"
 *
 * The name is checked AGAINST THE STYLESHEET at compile time. Upstream once
 * opted out of that check with `| (string & {})`, and `cssVar('surface-1')`
 * shipped against a token that did not exist: var() resolved to nothing, a menu
 * painted transparent, and nothing anywhere reported an error. An undefined
 * custom property fails SILENTLY, so the type is the only place to catch it.
 *
 * With no explicit fallback the token's own authored literal is used, so the
 * reference still paints on a host that never loaded the CSS layer.
 */
export function cssVar(name: CssVarName | TokenName, fallback?: string): string {
  const n = (name.startsWith('--') ? name : `--${name}`) as CssVarName
  const lit = fallback ?? (cssVars as Record<string, string>)[n]
  return lit ? `var(${n}, ${lit})` : `var(${n})`
}

/** The raw authored value of a token (the literal from the CSS), or `undefined`. */
export function tokenValue(name: CssVarName): string | undefined {
  return (cssVars as Record<string, string>)[name]
}

/**
 * Inject the stylesheet from code (idempotent) for surfaces that cannot use a
 * bundler CSS import — a runtime-mounted island, say. Prefer the static
 * `import '@luxfi/design/styles.css'` wherever a bundler exists. No-op outside
 * the browser.
 *
 * `href` is REQUIRED. Upstream defaulted it to a public CDN, which quietly made
 * a third party the origin of the entire token layer for anyone who called it
 * bare. Pass a URL you serve.
 */
export function injectDesignCss(href: string): void {
  if (typeof document === 'undefined') return
  if (document.querySelector('link[data-lux-design]')) return
  const l = document.createElement('link')
  l.rel = 'stylesheet'
  l.href = href
  l.setAttribute('data-lux-design', '')
  document.head.appendChild(l)
}
