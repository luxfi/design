<div align="center">

# Lux Design System

**Monochrome. Dark by default. One hue rendered through an opacity ladder — plus the gold.**

The single source of truth for how every Lux surface looks — tokens, components, brand assets, and the guidelines that hold them together.

`@luxfi/design`

</div>

## Use it

```css
@import "@luxfi/design/styles.css";
```

Tailwind v4 apps import the bridge instead and get the utilities wired up — `bg-background`, `text-muted-foreground`, `border-border`, `bg-brand` — with nothing to configure:

```css
@import "tailwindcss";
@import "@luxfi/design/tailwind.css";
```

The same tokens are available to code, generated from the CSS so the two cannot drift:

```ts
import { colors, brand, cssVar } from "@luxfi/design"

cssVar("--brand")      // "var(--brand, var(--lux-gold))"
brand["lux-gold"]      // "#B8960C"
```

## It is a layer, not a fork

Lux and Hanzo run the **same greyscale**. That is not a coincidence to be tidied up later — it is the estate's white-label model: `@hanzo/design` is the shared substrate, `@luxfi/design` is the brand layer on top of it. Lux differs by **accent and mark**, not by a different neutral system.

So this package **depends on** `@hanzo/design` and inherits its neutral ladder, opacity rungs, surface recipes, type scale, spacing, radius, elevation and motion at build time. There is exactly one hand-authored token file here:

```
tokens/brand.css     the gold, and the constants the press kit pins
```

Everything else is written out beneath it by `scripts/gen-tokens.mjs`. Bump the substrate, run `pnpm build`, and Lux picks up the fix — nothing to sync by hand, so nothing to drift. The previous cut of this package forked the substrate instead, and by the time anyone looked the copy had a 1.66:1 focus ring, a solid border that vanished on lifted surfaces, and a "destructive" colour indistinguishable from a disabled control. Upstream had already fixed all three.

## The gold

`--lux-gold: #B8960C`

Lux's brand atom is *"strict monochrome with a subtle warm bias"* (`DESIGN.md` §1.2). The warm bias is not a tint across the greys — those stay neutral — it is this one hue, spent rarely.

The value is **recovered, not chosen**. `lux.financial` still draws its brand badge with `linear-gradient(135deg, <brand> 0%, #B8960C 100%)`, next to a constant reading `BRAND_COLOR = "#FFFFFF"; // Gold accent`. The comment outlived the value: the accent slot survived every rebrand, the hue in it was flattened to white.

It lands in `--brand` and nowhere else. Not `--accent` — that is a *surface* in this vocabulary, the grey a menu row turns under the cursor, and painting it gold makes every dropdown row gold. Not `--primary` — the primary button is the monochrome atom. A surface that wants a gold CTA asks for `bg-brand` and gets it deliberately.

The gold does not survive inversion (`#B8960C` is 6.98:1 on the dark page and 2.65:1 on the light one), so the light theme restates it at the same hue and saturation, stepped down until it clears 4.5:1 against every canvas it can land on: `#786108`.

## Typeface

**Geist Sans + Geist Mono, owned by `@hanzo/design`, which self-hosts both faces.**

This sheet ships no `@font-face` and no `url()`. A brand layer duplicating a font binary is how an estate ends up with four copies of one file; the substrate holds the one copy and is already installed here as a dependency. `--font-sans` keeps its full literal fallback stack, so a surface that loads only this sheet renders in the system UI face rather than in nothing. To get Geist itself, add the substrate's sheet alongside:

```css
@import "@hanzo/design/styles.css";   /* the faces */
@import "@luxfi/design/styles.css";   /* the Lux token layer */
```

## What's inside

| Path | What |
|------|------|
| `styles.css` | The one entry point. Generated, flattened — no `@import` to resolve, no `url()` to rebase. |
| `tailwind.css` | The Tailwind v4 bridge. Same tokens, plus the `@theme` mapping. Generated. |
| `tokens/brand.css` | The only hand-authored token file: the gold and the mark constants. |
| `scripts/` | `gen-tokens.mjs` (the inherit) and `check-tokens.mjs` (the gate). |
| `src/` | The typed layer. `tokens.gen.ts` is generated from the CSS. |
| `components/` | `core` (Button, Card, Badge, Icon, LuxLogo…), `forms`, `overlays`, `navigation` — each as `.jsx` + `.d.ts` + a `.prompt.md` usage guide. |
| `prompts/` | System-level generation guidance — the "make it look Lux" system prompt. |
| `content/` | The words — brand voice and taglines. |
| `guidelines/` | Specimen cards — colour, type, spacing, brand, iconography. |
| `assets/` | The mark, wordmark, favicon, provider and partner logos. |
| `ui_kits/` | Composed surfaces assembled from the components. |

## The gate

`pnpm test` runs `scripts/check-tokens.mjs`. Every check in it exists because that defect is **silent** — an undefined custom property paints nothing and reports nothing, and a gold that fails contrast in the light theme looks fine.

- Every bare `var()` in the shipped sheet resolves to a declared token.
- No `@import` and no `url()` survive into the artifact.
- Both sheets are lexically sound — a stray `*/` throws in a consumer's PostCSS while rendering perfectly in a browser, so screenshots cannot catch it.
- `--ring` clears 3:1 and `--brand` clears 4.5:1 against **every** canvas, in **both** themes, with `--brand-foreground` checked against the fill it sits on.
- Every semantic token the brand layer declares is restated in `.light`. `:root` and `.light` have identical specificity, so a token declared only in `:root` here silently outranks the substrate's light value.
- No Hanzo identifier survives the inherit. Depending on `@hanzo/design` is the model; wearing its name is not.

## Principles

- **Monochrome by construction** — one neutral ladder and an opacity ladder are the palette. The gold is the one warm exception, and it is rare.
- **Dark is the default** — surfaces mount dark-first; `.light` is the override.
- **Inherit, don't copy** — if a token is a design-system fact rather than a Lux fact, it belongs upstream where every brand gets it.

## License

BSD-3-Clause. Brand marks (the Lux logo, partner and provider logos) are the property of their respective owners and are provided for identification.
