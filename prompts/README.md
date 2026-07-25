# prompts — make an AI build it Lux

Guidance an agent reads *before* generating a Lux surface. Two layers, no
overlap:

| Layer | Lives | Answers |
|-------|-------|---------|
| **System** (this folder) | `prompts/` | "How does anything Lux look and behave?" |
| **Component** (co-located) | `components/**/*.prompt.md` | "How do I use *this* Button / Dialog / Card?" |

Read the system layer first, then pull the per-component prompt for each part you
place.

| File | Use |
|------|-----|
| [`system.md`](system.md) | Paste as the system prompt. The whole brand, compressed to one screen. |
| [`rules.md`](rules.md) | The do / don't checklist. Grep it before you ship. |
| [`pages.md`](pages.md) | Ready prompts for full sections — hero, feature grid, pricing, CTA. |

Everything here assumes one import gives you the tokens:

```css
@import "@luxfi/design/styles.css";
```

So every rule below can be obeyed with a CSS variable, never a hardcoded hex.
