# TypeReel — AI Asset Generation Prompts
For Google Gemini (free plan, image generation) or ChatGPT Go. Every prompt is ready to paste.
Brand: **TypeReel** · indigo **#5B5BD6** · font vibe: Montserrat (geometric, friendly-bold).

## Read this first — the two rules that save you a rejection

1. **AI models can't hit exact pixel sizes.** Generate at the closest square/wide aspect, then do the final resize/crop in **Photopea** (photopea.com — free, in-browser Photoshop, exact-pixel canvases, PNG export with transparency). Canva Free also works for the tiles. Final sizes required by CWS: icon **128×128 PNG** (artwork ~96×96 centered with ~16px transparent padding), screenshots **1280×800**, small tile **440×280 PNG/JPEG**, marquee **1400×560 PNG/JPEG**.
2. **Screenshots must show the real product.** Fully AI-invented UI in store screenshots risks a "misleading metadata" rejection and user distrust. So: capture the real popup/export/assistant UI yourself, and use AI only for the **background frame + caption bar** the screenshot sits on. Prompts below are written that way.

Suggested split: **Gemini free** for the icon/logo and the two tiles (its image model handles flat vector-style graphics and short text well — still expect 2–3 retries on text spelling); **ChatGPT Go** as fallback when Gemini garbles the wordmark. For text-heavy frames, skip AI text entirely and set the type yourself in Photopea/Canva — it's 2 minutes and always spelled right.

---

## 1. Logo / store icon (128×128 PNG, also 48/32/16)

Paste into Gemini or ChatGPT:

```
Design a flat, minimal app icon glyph for a Chrome extension called "TypeReel".
Concept: a rounded keyboard keycap seen slightly from above, and on the keycap face a small film-reel / play-button motif is integrated (the typing + video idea in one mark). One single glyph, not a scene.
Style: modern flat vector look, 2 colors only — indigo #5B5BD6 as the main color and white for the glyph details. Very slight corner rounding, no gradients, no shadows, no outlines, no text, no letters anywhere.
Composition: glyph centered on a fully transparent background, glyph fills about 75% of the canvas, generous even margins.
It must stay recognizable when shrunk to 16×16 pixels, so keep shapes chunky and details minimal.
Square image, high resolution.
```

Follow-up line to get options: `Give me 4 distinct variations: (a) keycap + reel, (b) cursor-bar | merging into a film reel, (c) speech-cursor hybrid, (d) the letters idea replaced by pure geometry.`

Post-process in Photopea: open → Image > Image Size → 96×96 → Canvas Size → 128×128 (transparent) → File > Export As > PNG. Repeat at 48/32/16 (File > Export As, change size). Check the 16px version by zooming out — if it turns to mush, ask the model for "chunkier, fewer details".

Also generate a **wordmark** (for tiles and the export end-frame):

```
Create a clean wordmark logo: the word "TypeReel" in a modern geometric sans-serif (Montserrat-like), bold weight, white text on transparent background, with the two words visually distinguished: "Type" in pure white and "Reel" in a slightly lighter indigo-tinted white. No icon, no tagline, no effects. Wide image, high resolution. Spell it exactly: T-y-p-e-R-e-e-l, one word, capital T and capital R.
```
(If the AI misspells it twice, stop and set the wordmark in Photopea with Montserrat Bold — you already ship that font in the repo.)

## 2. Screenshots — 5 × 1280×800 (AI makes the frame, you supply the real UI)

Step 1 — generate ONE reusable background frame (paste once, reuse for all five):

```
Design a clean marketing background frame for Chrome Web Store screenshots, 16:10 wide format.
Layout: soft diagonal gradient background from indigo #5B5BD6 (top left) to a deep navy #23234A (bottom right), very subtle dot-grid texture at 5% opacity. In the center, a large empty rounded-rectangle "browser window" placeholder card (white, 16px corner radius, thin light gray top bar with three small window dots) taking up about 78% of the width, positioned slightly below center. Above the card, leave a clear horizontal band about 120px tall for a headline. Minimal, premium SaaS look. No text anywhere, no logos, no icons, no people.
```

Step 2 — capture the real UI (zoom Chrome to ~110–125% so text is legible at 1280 wide):
- S1: popup in basic mode + a page form mid-typing, the moment a typo is being corrected
- S2: export page, theme picker open, a clip mid-render
- S3: a focused field with the assistant icon + open AI panel generating text
- S4: advanced mode with several fields queued + the "Kept your text for N fields" rescan toast
- S5: composite — shortcuts list, dark-mode popup, and Chrome's permission prompt showing the no-all-sites scope

Step 3 — assemble in Photopea: New file 1280×800 → place frame → paste UI capture inside the white card (Edit > Transform to fit) → add the caption in Montserrat Bold, white, ~44px, in the headline band:

1. `Typing that looks human. Because it types like one.`
2. `Export any take as GIF or WebM — 3 themes, 3 sizes.`
3. `Chrome's built-in AI writes it. TypeReel types it.`
4. `Script whole forms. Rescan keeps your text.`
5. `No account. No servers. Runs only where you invoke it.`

Order matters: upload in exactly this order — the first screenshot is the search-results thumbnail.

## 3. Small promo tile — 440×280 (required; listings without it are shown after listings with it)

```
Design a small promotional tile for a Chrome extension, wide 11:7 format.
Background: solid indigo #5B5BD6 with a very subtle darker indigo diagonal sweep in the lower right.
Left two-thirds: the text "TypeReel" in bold white geometric sans-serif (spell exactly: T-y-p-e-R-e-e-l), and below it in smaller, lighter white text the single line "Human-real typing for demos".
Right third: a simple flat white glyph of a keyboard keycap merged with a film reel, floating with generous padding.
Flat design, no gradients on the text, no shadows, no extra words, no watermark, nothing else.
```
Then Photopea: crop/resize to exactly 440×280, export PNG. If the AI garbles either text string, generate the tile **without any text** (delete the two text sentences from the prompt) and set the type yourself — cleaner anyway.

## 4. Marquee promo tile — 1400×560 (optional, but required to be eligible for homepage featuring — make it)

```
Design a wide marquee banner for a Chrome extension, 5:2 format.
Background: deep navy #23234A with a soft indigo #5B5BD6 glow rising from the bottom left, subtle dot-grid texture at 5% opacity.
Left third: the wordmark "TypeReel" in bold white geometric sans-serif (spell exactly T-y-p-e-R-e-e-l), with the tagline underneath in lighter white: "Type it like a human. Export it like a pro."
Right two-thirds: a horizontal film-strip motif of three rounded frames, like frames on a movie reel: frame 1 shows a stylized text field with a typing cursor mid-word, frame 2 shows a stylized sparkle/AI chip icon, frame 3 shows a stylized play button with a small "GIF" badge. All frames flat white/indigo line style, consistent stroke width.
Premium, minimal, flat. No other text, no people, no photos, no watermark.
```
Photopea: exact-crop to 1400×560, export PNG. Same fallback: if text garbles, generate textless and set type manually.

## 5. Free-tool cheat sheet

| Job | Tool | Why |
|---|---|---|
| Generate glyph/tile/marquee art | Gemini free (or ChatGPT Go) | Both plans include image generation; flat vector-style prompts work well |
| Exact-pixel resize/crop/canvas, transparency, PNG export | **Photopea** (photopea.com) | Free browser Photoshop, no signup, opens PSD/exports every format |
| Setting text on tiles/screenshots | Photopea (Montserrat from your repo) or Canva Free | AI text spelling is the #1 retry-waster — manual type is faster and pixel-clean |
| Compressing final PNGs | tinypng.com | Free; CWS has no hard size limit but faster listing loads |
| Quick mock browser frames | screely.com / shots.so (free tiers) | Alternative to the AI background frame for S1–S5 |

## 6. Final pre-upload checklist

- icon128.png: 128×128, PNG, transparent padding, replaces `public/icons/` set (16/32/48/128) — legible at 16px
- 5 screenshots: exactly 1280×800, real UI inside, caption order as in §2
- small_tile.png: exactly 440×280
- marquee.png: exactly 1400×560
- Every text string spelled: TypeReel (capital T, capital R, one word)
- No claim in any image that isn't in the shipped feature set (no "undetectable", no speed/WPM claims)
