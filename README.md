<div align="center">

# Lux Design System

**Monochrome. True black. Dark by default. No hue at all, except three signals.**

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

cssVar("--brand")      // "var(--brand, var(--pure-white))"
brand["brand"]         // "var(--pure-white)"
```

## It is a layer, not a fork

`@hanzo/design` is the shared substrate; `@luxfi/design` is the brand layer on top of it. That is the estate's white-label model, and it is why this package **depends on** `@hanzo/design` and inherits its neutral ladder, opacity rungs, surface recipes, type scale, spacing, radius, elevation and motion at build time. There is exactly one hand-authored token file here:

```
tokens/brand.css     the accent, the ground, the lift, the hairline, the mark
```

Everything else is written out beneath it by `scripts/gen-tokens.mjs`. Bump the substrate, run `pnpm build`, and Lux picks up the fix — nothing to sync by hand, so nothing to drift. The previous cut of this package forked the substrate instead, and by the time anyone looked the copy had a 1.66:1 focus ring, a solid border that vanished on lifted surfaces, and a "destructive" colour indistinguishable from a disabled control. Upstream had already fixed all three.

## No gold. Monochrome, and more severe than hanzo.ai

Lux is the minimal end of the estate's design family. Hanzo is monochrome; Lux is monochrome taken further, in four measured steps:

| | Lux | Hanzo | where the value comes from |
|---|---|---|---|
| ground | `#000000` | `#0a0a0a` | `@luxfi/brand` `surface1`, both product configs |
| accent | `#ffffff` | `#e4e4e7` | `@luxfi/brand` `accent1` |
| lift | **one** raised surface, `#0a0a0a` | two, `#0f0f0f` + `#171717` | `lux.financial` paints 73 cards at `#0a0a0a` |
| hairline | `.08` | `.10`, and `#262626` opaque in practice | 286 of 331 painted edges on `lux.financial` |

Nothing there is invented. Every value is either a rung of the inherited ladder or a literal `@luxfi/brand@1.0.5` declares, and the site numbers come from a headless render of the live surfaces at 1440px.

**Why a pure-white accent is an accent at all**, on a page whose text is also white-ish: because nothing else on the page is *pure*. The ink ramp tops out at `#fafafa` — `#ffffff` on `#000000` is 21:1, the maximum contrast pair that exists, and at paragraph size it halates. So the ink stays a shade under, and the one thing painted at the actual extreme reads as the accent. The polarity is the brand. Hanzo's accent sits *below* its ink and carries a faint blue cast (`#e4e4e7` is 3 levels of chroma); Lux's sits above it and has none.

Only the **decorative** boundary was quieted. `--border-control`, `--border-focus`, `--border-selected` and `--ring` are untouched — they are how a keyboard user knows where they are, and `--ring` still owes WCAG 2.4.11's 3:1 on every canvas. Lux quiets what merely separates; it does not quiet what tells you where you are.

### The `#D4AF37` gold was reversed. Do not restore it.

`0.1.0` of this package shipped a gold accent. `0.1.1` removed it, on the CTO's instruction:

> no gold in lux, only monochrome white and black, more severe and minimal than hanzo.ai

The archaeology behind the gold was real — `lux.network`'s `globals.css` once declared it under a *"Gold accent: #D4AF37"* comment, the founder's commit named it, and the Lux Exchange carried `gold: '#D4AF37'` as a Tailwind literal. All true, all **historical**. Every live Lux surface has since flattened that slot to white, and the rebrand that did it also added an end-to-end test on `lux.network` asserting the page paints zero pixels in hue band 20–60. **That test is correct and must stay.**

There is no `--lux-gold` token left to re-enable, deliberately: an unused brand-colour token is exactly what gets re-wired by accident.

**The trap, named.** `lux.network` *as deployed today* still paints the gold — 18,198 saturated pixels, 100% of them in hue bucket 40–49, from `--accent: oklch(0.75 0.14 85)`. The deployed site and the test in its own repo contradict each other. Anyone who probes that site for "what Lux looks like" will find gold and conclude it belongs. It does not. The two surfaces carrying the current brand are `lux.financial` (zero saturated pixels above the fold) and `@luxfi/brand@1.0.5`.

### The three hues that remain

`--state-error`, `--state-online`, `--state-success` — signals, not decoration. An error must not look like a disabled control. Red sits at 0° and the greens at 142°, nowhere near the fenced band.

Hanzo permits a fourth: the macOS window-chrome dot trio. Lux does not, and this one is not taste — `--chrome-dot-yellow` is `rgb(234 179 8 / .6)`, hue **45.6°**, squarely inside the band `lux.network`'s test asserts is empty. A Lux surface rendering a window mock would have failed that test having never gone near the gold.

## Typeface

**Geist Sans + Geist Mono, owned by `@hanzo/design`, which self-hosts both faces.**

This sheet ships no `@font-face` and no `url()`. A brand layer duplicating a font binary is how an estate ends up with four copies of one file; the substrate holds the one copy and is already installed here as a dependency. `--font-sans` keeps its full literal fallback stack, so a surface that loads only this sheet renders in the system UI face rather than in nothing. To get Geist itself, add the substrate's sheet alongside:

```css
@import "@hanzo/design/styles.css";   /* the faces */
@import "@luxfi/design/styles.css";   /* the Lux token layer */
```

Order does not matter. Both sheets declare `--brand`, and at equal specificity the later one would win — so importing the substrate second used to revert the brand to its near-white default, silently and only partly (`--brand-hover` and `--brand-bg` survived, so the brand and its own hover disagreed). The Lux layer's selectors are doubled — `:root:root`, `.light.light` — which puts it at (0,2,0) and retires the question. A consumer deliberately retuning these tokens should double their own selector to match.

## What's inside

| Path | What |
|------|------|
| `styles.css` | The one entry point. Generated, flattened — no `@import` to resolve, no `url()` to rebase. |
| `tailwind.css` | The Tailwind v4 bridge. Same tokens, plus the `@theme` mapping. Generated. |
| `tokens/brand.css` | The only hand-authored token file: the accent, the ground, the lift, the hairline, the mark. |
| `scripts/` | `gen-tokens.mjs` (the inherit) and `check-tokens.mjs` (the gate). |
| `src/` | The typed layer. `tokens.gen.ts` is generated from the CSS. |
| `components/` | `core` (Button, Card, Badge, Icon, LuxLogo…), `forms`, `overlays`, `navigation` — each as `.jsx` + `.d.ts` + a `.prompt.md` usage guide. |
| `prompts/` | System-level generation guidance — the "make it look Lux" system prompt. |
| `content/` | The words — brand voice and taglines. |
| `guidelines/` | Specimen cards — colour, type, spacing, brand, iconography. |
| `assets/` | The mark, wordmark, favicon, provider and partner logos. |
| `ui_kits/` | Composed surfaces assembled from the components. |

## The gate

`pnpm test` runs `scripts/check-tokens.mjs`. Every check in it exists because that defect is **silent** — an undefined custom property paints nothing and reports nothing, a caption that has drifted from its token still renders, and a rainbow image in `assets/brand/` looks like a decision somebody made.

- Every bare `var()` in the shipped sheet resolves to a declared token.
- No `@import` and no `url()` survive into the artifact.
- Both sheets are lexically sound — a stray `*/` throws in a consumer's PostCSS while rendering perfectly in a browser, so screenshots cannot catch it.
- `--ring` clears 3:1 and `--brand` clears 4.5:1 against **every** canvas, in **both** themes, with `--brand-foreground` checked against the fill it sits on.
- Every token the brand layer declares reaches the light theme — restated, or aliased onto something that inverts. This layer's `:root:root` is (0,2,0) and so outranks the substrate's own `.light`, which is (0,1,0); a token declared only here would silently wear its dark value forever.
- **Every token resolves achromatic, `R = G = B`, in both themes** — except three named signals, and each of those is checked to sit outside hue band 20–60, the band `lux.network`'s e2e asserts is empty. This is the check `0.1.0` did not have, which is why `0.1.0` could ship `#D4AF37` with a green build.
- Every colour-literal caption in the specimen cards matches the sheet. The cards shipped `--border = #1f1f1f` beside a swatch correctly painting the current token — the swatch was right and the caption was a fossil.
- Every image in `assets/brand/` is achromatic, decoded from the PNG in about forty lines on `node:zlib` rather than a dependency.
- The typed layer and the stylesheet agree on every token. Generating `tokens.gen.ts` does not by itself guarantee that — it only moves the mistake into the generator, where it is harder to see.
- Every `var()` in all 78 shipped components, kits, specimen cards and prompts resolves. The sheet being internally consistent says nothing about the files a consumer actually renders.
- No Hanzo identifier survives the inherit. Depending on `@hanzo/design` is the model; wearing its name is not.

## Principles

- **Monochrome by construction** — one neutral ladder and an opacity ladder are the whole palette, and the gate proves it rather than asking you to believe it. The three state signals are the only hues, and they are signals.
- **Dark is the default** — surfaces mount dark-first; `.light` is the override.
- **Inherit, don't copy** — if a token is a design-system fact rather than a Lux fact, it belongs upstream where every brand gets it.
- **Measure, don't feel** — every value here traces to `@luxfi/brand` or to a headless render of a live Lux surface. "More severe" is four numbers, not an adjective.

## License

BSD-3-Clause. Brand marks (the Lux logo, partner and provider logos) are the property of their respective owners and are provided for identification.
