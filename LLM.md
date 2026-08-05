# @luxfi/design — for the next agent

Read this before touching `tokens/brand.css`. It exists so you do not repeat
archaeology that has already been done and already been overruled.

## 1. Lux is monochrome. The gold was reversed. Do not restore it.

`0.1.0` shipped a gold accent, `#D4AF37`, in `--brand`. `0.1.1` removed it on
the CTO's instruction, quoted verbatim:

> no gold in lux, only monochrome white and black, more severe and minimal than
> hanzo.ai

**There is no `--lux-gold` token left**, and that is deliberate — an unused
brand-colour token is precisely what gets re-wired by accident. The hue is gone
from the package rather than parked in it.

### Why you will be tempted to put it back

Because the evidence for it is real, findable, and **historical**:

- `lux.network`'s `globals.css` once declared the accent under a comment
  reading *"Gold accent: #D4AF37"*.
- The commit that added it — the founder's — says *"Add gold accent color
  (#D4AF37) to match bank site"*.
- The Lux Exchange's Tailwind config carried `gold: '#D4AF37'` as a literal,
  consumed by components.

All true. All superseded. Every live Lux surface has since flattened that slot
to white.

### The trap that actually produced 0.1.0

**`lux.network` as deployed today still paints the gold.** Rendered headless at
1440px it puts 18,198 saturated pixels on the page, 100% of them in hue bucket
40–49 — 0.66% of the first screen — from `--accent: oklch(0.75 0.14 85)`
(≈ `#d6a62e`). The deployed site contradicts the test in its own repo.

So: **do not probe `lux.network` to learn what Lux looks like.** The two
surfaces that carry the current brand are:

- **`@luxfi/brand@1.0.5`** — `brand.json` (Lux Exchange) and `financial.json`
  (Lux Pay) declare the *same* theme to the digit:
  `dark { accent1:#FFFFFF, surface1:#000000, surface2:#1A1A1A }`,
  `light { accent1:#000000, surface1:#FFFFFF, surface2:#F9F9F9 }`,
  `primaryColor:#000000`.
- **`lux.financial`** — 0 saturated pixels above the fold; the only colour
  anywhere on it is a single photograph at y≈2737.

Bringing the `lux.network` deployment in line is that repo's job, not this
package's.

### The e2e test on lux.network is CORRECT and must stay

`lux.network` carries an end-to-end test asserting the page paints **zero
pixels in hue band 20–60**. Do not weaken, skip, or delete it. It is the fence
the estate put up when it removed the gold the first time, and `0.1.0` climbed
it. `check-tokens.mjs` now enforces the same invariant at build time, at the
token level, so the two agree.

## 2. What Lux is, in four numbers

Lux is the minimal end of the family. Hanzo is monochrome; Lux is monochrome
taken further:

| | Lux | Hanzo | source |
|---|---|---|---|
| ground | `#000000` | `#0a0a0a` | `@luxfi/brand` `surface1` |
| accent | `#ffffff` | `#e4e4e7` | `@luxfi/brand` `accent1` |
| lift | **one**, `#0a0a0a` | two, `#0f0f0f` + `#171717` | 73 cards measured on `lux.financial` |
| hairline | `.08` | `.10` (and `#262626` opaque in practice) | 286 of 331 painted edges on `lux.financial` |

Consequences worth knowing before you "fix" them:

- **`--card`, `--muted` and `--popover` are the same value on purpose.**
  `--surface-1` and `--surface-2` therefore resolve identically. The ladder has
  three rungs, not four. If you need a second lift, you are building something
  Lux does not have.
- **`--brand` (`#ffffff`) and `--primary` (`#fafafa`) differ by 5 levels** and
  are indistinguishable as button fills. That is fine and intended: the accent
  earns its keep as *text, dot and hairline* — the eyebrow pill, the featured
  tile's edge — not as a fill. `prompts/rules.md` already forbids two competing
  primary buttons.
- **Only the decorative boundary was quieted.** `--border-control`,
  `--border-focus`, `--border-selected` and `--ring` are untouched: they tell a
  keyboard user where they are, and `--ring` still owes WCAG 2.4.11's 3:1.
- **The light hairline stays at the substrate's `.10`.** `.08` is a value
  measured off `lux.financial`, which is a dark surface. There is no measured
  Lux light hairline; inventing one would be taste. Leave it until somebody has
  a light Lux surface to measure.

## 3. Hues: three, not four

`--state-error` (0°), `--state-online` and `--state-success` (142°) survive —
they are **signals**. An error must not look like a disabled control.

Hanzo permits a fourth, the macOS window-chrome dot trio. **Lux does not**, and
this is not taste: `--chrome-dot-yellow` is `rgb(234 179 8 / .6)`, hue
**45.6°**, squarely inside the fenced band. A Lux surface rendering a window
mock would have failed `lux.network`'s e2e having never gone near the gold. The
three dots are aliased onto `--border-selected` and are identical greys.

## 4. Structural rules that are load-bearing — verify before you change them

- **This is a LAYER, not a fork.** `dependencies: { "@hanzo/design": "^0.4.9" }`.
  Everything except `tokens/brand.css` is generated from the installed substrate
  by `scripts/gen-tokens.mjs`. Bump the substrate, `pnpm build`, done. The
  previous fork drifted into a 1.66:1 focus ring and a border that vanished on
  lifted surfaces. Do not fork it again.
- **`:root:root` / `.light.light` doubling is load-bearing.** It puts the Lux
  layer at (0,2,0) so it wins on specificity rather than import order. Importing
  the substrate *after* the Lux sheet used to silently revert `--brand`, and only
  partly. Do not "simplify" the selectors.
- **Depending on `@hanzo/design` is the model and is fine. Wearing its name is
  not.** `gen-tokens.mjs` renames `hanzo-` → `lux-` wholesale and strips
  `@font-face`; check 1 fails the build if a single `hanzo` survives, and Geist
  stays owned by the substrate (zero `url()`, zero `@font-face` shipped here).
- **`--border-hairline` / `--border-card` do not exist** and must not be
  re-added. The fork declared them, 19 shipped files referenced them, the
  substrate does not have them — so every card, table and dialog was drawing its
  edge in `currentColor`, a stark near-white hairline that read as a design
  choice. The components now speak the substrate's `--border` vocabulary. Check
  10 keeps it that way.
- **`--lux-black` is `#000000`, not `#0A0A0B`.** The latter is *Hanzo's*
  press-kit black, carried in by the `hanzo-` → `lux-` rename, which turns a
  Hanzo fact into something that looks like a Lux fact. It is not even grey
  (blue one level high). `components/core/LuxLogo.jsx` paints the mark with it.

## 5. The gate — `pnpm test`, 26 checks

Every check exists because the defect it catches is **silent**. The four added
in `0.1.1`:

- **Achromatic, both themes.** Every token resolves `R = G = B` except the three
  named signals, and each permitted hue is checked to sit outside band 20–60.
  Runs on the *resolved* cascade of the shipped `styles.css`, so an overridden
  substrate value is correctly ignored. Colour syntaxes it cannot read
  (`oklch()`, `hsl()`, …) **fail** rather than pass — unknown is never a pass,
  and `oklch()` is exactly how the gold is written on `lux.network` today.
- **Specimen captions match the sheet.** The cards shipped `--border = #1f1f1f`,
  `--border = white/10` and `--ring = #333 · focus` on chips that all correctly
  *painted* the current token. The swatch was right; the caption was a fossil of
  the fork, and nothing could tell.
- **Brand imagery is achromatic.** `assets/brand/hero-visualization.png` was two
  faces over a full-spectrum rainbow circle — 39% of its pixels saturated, 8.6%
  inside the gold band — sitting in a card captioned *"cool-toned, low-key, no
  warm gradients, no illustration style"*. Deleted in `0.1.1`. The PNG reader is
  ~40 lines on `node:zlib`; a token package should not take an image dependency
  to check four files.
- **The `.light` rule got sharper.** The old exemption was name-shaped —
  anything called `--lux-*` skipped the restatement check, which existed for one
  token (`--lux-gold`) that no longer exists. It is now value-shaped: a token is
  exempt only if its value is a bare `var(--x)` onto something that itself
  inverts. A value-shaped exemption is checkable; a name-shaped one is a promise.

**Mutation-prove any change to the gate.** Eight mutations were run for `0.1.1`
— gold back in `--brand`; an amber `--state-warning` inside the fence; a dropped
`.light` restatement; a `var()` pointing at nothing; a caption drifted to the
Hanzo value; the yellow chrome dot restored; the inherited `#09090b`
`--brand-foreground` taken back; the rainbow asset returned. All eight failed
the build; all eight restored byte-identically.

## 6. Verified for 0.1.1

- Build green, 26/26 checks.
- Product-surface sample rendered headless at 1280×900 @2x, full page, both
  themes: **0 saturated pixels of 8,780,800** in each. Run chromium with
  `--disable-lcd-text` — subpixel text antialiasing paints colour fringes at
  hue 200–220 and 20–40 and will read as ~0.6% saturation on a page that has
  none, including on pure-greyscale swatch cards.
- 22 shipped specimen cards: the only saturated pixels are in
  `color-semantic.card.html`, which exists to display the three state signals.
