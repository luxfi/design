<div align="center">

# Lux Design System

**Monochrome. Dark by default. One hue rendered through an opacity ladder.**

The single source of truth for how every Lux surface looks — tokens, components, brand assets, and the guidelines that hold them together.

`@luxfi/design`

</div>

## Use it

One import pulls in the whole token layer (fonts, color, type, spacing, radius, elevation, motion):

```css
@import "@luxfi/design/styles.css";
```

Everything below is expressed as CSS custom properties, so code copies over 1:1 — the semantic names match `lux.network`'s variables exactly.

```jsx
import { Button } from "@luxfi/design/components/core/Button.jsx";
import { LuxLogo } from "@luxfi/design/components/core/LuxLogo.jsx";

<Button pill>Try Lux</Button>
```

## What's inside

| Path | What |
|------|------|
| `styles.css` | The one entry point — imports every token file below. |
| `tokens/` | The palette. `colors` (monochrome opacity ladder, dark-default), `typography`, `spacing`, `radius`, `elevation`, `motion`, `z`, `fonts`, `base`. |
| `components/` | `core` (Button, Card, Badge, Icon, LuxLogo, Avatar, ChromeText…), `forms`, `overlays`, `navigation` — each as `.jsx` + `.d.ts` + a `.prompt.md` usage guide. |
| `prompts/` | System-level generation guidance — the "make it look Lux" system prompt, do/don't rules, page prompts. |
| `content/` | The words — brand voice and taglines. |
| `docs/` | How to use the system — integrate the tokens, theme, extend. |
| `guidelines/` | Specimen cards — color, type, spacing, brand, iconography — the visual reference. |
| `assets/` | The mark, wordmark, favicon, provider + partner logos, brand imagery. |
| `ui_kits/` | Composed surfaces (e.g. `SiteChrome`) assembled from the components. |

## Principles

- **Monochrome by construction** — one neutral ladder plus an opacity ladder is the entire palette. Color appears only as genuine semantics (live/error/warning).
- **Dark is the default theme** — surfaces mount dark-first; light is the override.
- **Self-contained components** — inline styles, no CSS-framework coupling, so a component drops into any host (Next, Vite, Tamagui, none) and renders identically.
- **Every component ships its own `.prompt.md`** — a one-screen usage guide for humans and AI alike.

## Source of truth

Tokens track `lux.network` (`app/globals.css`, `tailwind.config.ts`, `DESIGN.md`) and the press kit. When the brand moves, it moves here first.

## License

BSD-3-Clause. Brand marks (the Lux logo, partner and provider logos) are the property of their respective owners and are provided for identification.
