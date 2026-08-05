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
brand["lux-gold"]      // "#D4AF37"
```

## It is a layer, not a fork

Lux and Hanzo run the **same greyscale**. That is not a coincidence to be tidied up later — it is the estate's white-label model: `@hanzo/design` is the shared substrate, `@luxfi/design` is the brand layer on top of it. Lux differs by **accent and mark**, not by a different neutral system.

So this package **depends on** `@hanzo/design` and inherits its neutral ladder, opacity rungs, surface recipes, type scale, spacing, radius, elevation and motion at build time. There is exactly one hand-authored token file here:

```
tokens/brand.css     the gold, and the constants the press kit pins
```

Everything else is written out beneath it by `scripts/gen-tokens.mjs`. Bump the substrate, run `pnpm build`, and Lux picks up the fix — nothing to sync by hand, so nothing to drift. The previous cut of this package forked the substrate instead, and by the time anyone looked the copy had a 1.66:1 focus ring, a solid border that vanished on lifted surfaces, and a "destructive" colour indistinguishable from a disabled control. Upstream had already fixed all three.

## The gold

`--lux-gold: #D4AF37`

Lux's brand atom is *"strict monochrome with a subtle warm bias"* (`DESIGN.md` §1.2). The warm bias is not a tint across the greys — those stay neutral — it is this one hue, spent rarely.

The value is **recovered, not chosen**, from four independent places:

1. `lux.network`'s own `globals.css` declares the accent under a comment reading *"Gold accent: #D4AF37"*, in a block headed *"Core semantic tokens - Dark mode (Lux brand: black + gold accent)"*.
2. The commit that added it says so outright — *"Add gold accent color (#D4AF37) to match bank site"* — and it is the founder's.
3. Two months earlier it already existed as a named literal, `gold: '#D4AF37'`, in the Lux Exchange's Tailwind config, consumed by components rather than merely declared.
4. It fills exactly the slot `lux.financial` later whitened. That surface still draws its eyebrow pill as `${BRAND_COLOR}20` on `1px solid ${BRAND_COLOR}40`; the Exchange draws the same pill as `bg-gold/20 border-gold/40`. One kept the hue. The other left behind `const BRAND_COLOR = "#FFFFFF"; // Gold accent` — the comment outliving the value.

It was not merely dropped, either. The rebrand on the site serving `lux.network` today added the line *"Lux brand accent: monochrome white (no gold)"* **and an end-to-end test asserting the page paints zero pixels in hue band 20–60**. The gold was fenced out.

*(Caveat, stated plainly: that stylesheet ships the accent as `oklch(0.75 0.14 85)`, which renders nearer `#DDAB2C`. `#D4AF37` is the declared brand hex — what the comment says, what the commit says, and what the Exchange writes as a literal. This package carries the declared value.)*

It lands in `--brand` and nowhere else. Not `--accent` — that is a *surface* in this vocabulary, the grey a menu row turns under the cursor, and painting it gold makes every dropdown row gold. Not `--primary` — the primary button is the monochrome atom. A surface that wants a gold CTA asks for `bg-brand` and gets it deliberately.

The gold does not survive inversion — `#D4AF37` is 9.42:1 on the dark page and **1.96:1** on the light one — so the light theme restates it, stepped down until it clears 4.5:1 against every canvas it can land on.

Not straight down, though. Holding hue and dropping value gives `#735F1E`, and `#735F1E` is **olive** — army drab on a headline, unmistakably. That is not an arithmetic error, it is a fact about yellow: sRGB's yellow is only chromatic near the top of its value range, so anything at hue 46° below about L\*45 reads green-brown. Gold does not behave that way in the world, because gold is a *metal* — as it darkens it warms, through amber into bronze. So the light value follows the metal and shifts ~7° toward red on the way down: **`#7E5A16`**, hue 39°, 4.91:1 worst case.

Said plainly: this is the one place the two themes are not the same colour by construction. Dark is where Lux lives and where the gold is gold; light is the rarer surface, and there the accent is honestly a bronze.

## Typeface

**Geist Sans + Geist Mono, owned by `@hanzo/design`, which self-hosts both faces.**

This sheet ships no `@font-face` and no `url()`. A brand layer duplicating a font binary is how an estate ends up with four copies of one file; the substrate holds the one copy and is already installed here as a dependency. `--font-sans` keeps its full literal fallback stack, so a surface that loads only this sheet renders in the system UI face rather than in nothing. To get Geist itself, add the substrate's sheet alongside:

```css
@import "@hanzo/design/styles.css";   /* the faces */
@import "@luxfi/design/styles.css";   /* the Lux token layer */
```

Order does not matter. Both sheets declare `--brand`, and at equal specificity the later one would win — so importing the substrate second used to revert the brand to its near-white default, silently and only partly (`--brand-hover` and `--brand-bg` survived, leaving a grey brand beside a gold hover). The Lux layer's selectors are doubled — `:root:root`, `.light.light` — which puts it at (0,2,0) and retires the question. A consumer deliberately retuning these tokens should double their own selector to match.

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
- Every semantic token the brand layer declares is restated in `.light`. A token declared only in `:root` here would silently outrank the substrate's light value.
- The typed layer and the stylesheet agree on every token. Generating `tokens.gen.ts` does not by itself guarantee that — it only moves the mistake into the generator, where it is harder to see.
- Every `var()` in all 78 shipped components, kits, specimen cards and prompts resolves. The sheet being internally consistent says nothing about the files a consumer actually renders.
- No Hanzo identifier survives the inherit. Depending on `@hanzo/design` is the model; wearing its name is not.

## Principles

- **Monochrome by construction** — one neutral ladder and an opacity ladder are the palette. The gold is the one warm exception, and it is rare.
- **Dark is the default** — surfaces mount dark-first; `.light` is the override.
- **Inherit, don't copy** — if a token is a design-system fact rather than a Lux fact, it belongs upstream where every brand gets it.

## License

BSD-3-Clause. Brand marks (the Lux logo, partner and provider logos) are the property of their respective owners and are provided for identification.
