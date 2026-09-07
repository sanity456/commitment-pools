# Commitment Pools — black and royal gold draft

Local-only visual update. Dispute Court, wallet execution, contracts, authentication rules, historical test evidence, dependency pins and social-preview artwork are unchanged. Nothing in this design update authorizes publishing, pushing, or changing repository access.

- Background: black (`#08090b`), dark elevated panels.
- Accent: royal gold (`#d4af37`), bright gold wordmark (`#f2d58a`).
- Wordmark: Great Vibes, interpreting the user's “Crossive” as cursive. Served through the existing Next font pipeline. Working UI and amounts remain in Geist.
- Selected logo: original emperor penguin with converging gold vortex, transparent PNG, 1254 × 1254. The owner selected this artwork unchanged, with “Commitment Pools” centered above it in gold cursive. This vertical layout is shared by navigation, wallet account screens, and the existing home introduction. No tagline is included in the logo.
- App icon: a separate lightweight geometric convergence symbol in SVG, designed to stay legible at favicon sizes.
- Status messages retain semantic success, warning and error colors; form controls and keyboard focus have contrasting boundaries.

The owner chose the generated artwork as the product logo. It retains its illustrative/metallic treatment and minor edge speckles visible at full resolution; no image regeneration or raster alteration was made for the name-above-logo update. No browser interaction or visual QA was performed in this branding task. Token-level contrast tests do not constitute a complete accessibility audit.

## Local validation

- Complete frontend suite: 114 passed, 0 failed (including five brand/contrast/layout tests).
- Type checking, strict lint, formatting check and Vercel-target production build: passed.
- Local home and wallet sign-in routes: HTTP 200. Original mascot, optimized 256-pixel mascot and favicon: HTTP 200; the optimized mascot is 25,418 bytes.
- Text-token pairings meet at least 4.5:1; control boundaries meet at least 3:1; dark text on gold meets at least 7:1.
- No contracts, wallet transaction handlers, repository visibility, deployment configuration, dependency pins or historical evidence were changed. No push, deployment, or new on-chain transaction was performed.

## Asset provenance

The later [September 7 UI pass](../verification/ui-polish-2026-09-07.md) preserves these assets and documents the separately requested desktop/mobile checks. Its local verification supersedes the earlier 114-test count above for the combined working tree; neither record claims a deployed update or a completed human-wallet acceptance test.

Tool mode: built-in ImageGen. One generation; no CLI fallback or raster edits. The original generated alpha is preserved.

Integrated file: `public/brand/emperor-vortex.png`.

## Exact generation prompt

```text
Use case: logo-brand
Asset type: original transparent-background emblem for a black and royal-gold product called Commitment Pools; the wordmark is separate native UI text.
Scene/backdrop: genuinely transparent background with an actual alpha channel. Only the emblem itself is opaque; outside and between the linework is transparent. No background rectangle, no checkerboard pattern.
Primary request: one dignified emperor penguin integrated with a geometric gold vortex: many clean abstract streams converge downward beneath and around the mascot into one deep, powerful black center, suggesting the pooling of data, finance, and human effort.
Subject: one recognizable upright adult emperor penguin with a strong elegant silhouette, a natural black head and back, restrained warm-ivory breast, and the species' natural golden neck accents. Calm, noble bearing, beak in a slight three-quarter profile, anatomically recognizable flippers held close to the body. Use a subtle crisp gold contour where needed to remain legible on black.
Style/medium: sophisticated minimal vector-like emblem, sharply defined shapes and deliberate geometric linework, balanced negative space, original design.
Composition/framing: one centered compact square emblem with comfortable transparent margins. Penguin above the focal center; a small set of flowing royal-gold lines and precise nested elliptical arcs funnel beneath and around it, visually converging downward into a single deep black pool. Keep the penguin clearly recognizable and the vortex visually integrated. All strokes stay inside the canvas.
Color palette: rich black, royal gold, and restrained warm ivory only.
Constraints: no text, no letters, no wordmark, no numbers, no watermark. No crown, cape, clothes, coins, extra animals or mascots, scenery, border, mockup, 3D rendering, decorative flourishes, lens flare, or photorealistic texture. Crisp readable mark, not a busy illustration. Deliver one image only, preserving genuine transparent alpha.
```
