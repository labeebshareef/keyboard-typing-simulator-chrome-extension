# Chrome Web Store Relaunch — Deployment File
**Extension:** v3.3.0 (currently listed as "Keyboard Typing Simulator", id `flieihjecdghlbgbmjbilfcabbdplanh`)
**Prepared:** 2026-07-26 · All character counts machine-verified against limits confirmed on developer.chrome.com (name ≤75, summary ≤132; detailed description has no Google-published limit — ~16K is third-party folklore, our text is 3,296 chars).
**Recommended brand: TypeReel** (see §1 rationale — GhostType is name-collided on CWS; full evidence in Appendix A).

> ⚠️ Renaming happens in `manifest.json` (`name` field) and requires uploading a new package version → full review. Reviews, ratings and installs are tied to the item ID and are not reset by a rename (no Google doc states otherwise; no credible report of resets found).

---

## 1. Extension name / store title (limit: 75 chars, verified)

**RECOMMENDED — 66/75 chars:**
```
TypeReel — Realistic Typing Simulator & Auto Typer for Demo Videos
```
Rationale: "typing simulator" is the winnable head term (category leader has only 30K installs); "auto typer" is the niche's highest-volume pair-term, placed second so we match the query without leading with its cheat-contaminated neighborhood; "Realistic" is the clean differentiator adjective (vs. "human/undetectable" used by cheat-adjacent tools); "for Demo Videos" is the intent firewall — it tells both users and CWS reviewers what this is for. Em-dash separator matches the niche #1 (Duey.ai) pattern. Brand is 8 chars, leaving maximum room for keywords.

**Alternate 1 (if you keep GhostType) — 61/75 chars:**
```
GhostType — Realistic Typing Simulator & Auto Typer for Demos
```
Same keyword logic. Accept the trade-offs: exact-name collision with two active same-niche listings, including "GhostType AI" (an "undetectable bypass" tool) — see Appendix A.

**Alternate 2 (keyword-forward, AI-forward) — 72/75 chars:**
```
TypeReel: Typing Simulator, AI Writer & GIF Export for Demos & Tutorials
```
Use if you want the AI hypothesis expressed in the title. Weaker: "AI Writer" is an unwinnable head term (Grammarly 35M, QuillBot 5M), and comma-stacking reads closer to the keyword-stuffing pattern reviewers dislike.

---

## 2. Short description / Summary (limit: 132 chars, verified — plain text, no HTML)

**Variant A — demo-creator hook — RECOMMENDED — 129/132:**
```
Realistic human typing for demo videos, tutorials and screen recordings. On-device AI writes and fills forms. Export GIF or WebM.
```
Leads with the wedge audience's exact job; covers "human typing", "demo videos", "tutorials", "screen recordings", "on-device AI", "GIF/WebM" — six search phrases in one grammatical sentence.

**Variant B — AI/privacy hook — 130/132:**
```
Type like a human. Chrome's built-in AI (Gemini Nano) writes, rewrites and fills forms — 100% on-device, private. Export GIF/WebM.
```
Use if Chrome features/promotes built-in-AI extensions (Google has run spotlight collections for Gemini Nano API users — worth watching).

**Variant C — QA/utility hook — 128/132:**
```
Auto typer with human rhythm — variable speed, typos, corrections. Fill forms with AI sample data. Record typing as GIF or WebM.
```
Leads with the highest-volume query ("auto typer") for maximum search match; weaker intent firewall, so keep the description's demo framing if you use this.

---

## 3. Detailed description (no verified limit; ours = 3,296 chars, plain text, CWS-safe)

Copy exactly as below (bullets are "•" characters, which CWS renders fine; no markdown syntax used). First 3 lines are the above-the-fold click-winners; keyword frequencies verified: "auto typer" ×1, "typing simulator" ×2, "auto typing" ×1, "form filler" ×1 — all far under the policy's 5-repetition ceiling; zero forbidden terms (no "undetectable", "bypass", "typing test", "WPM", "essay", game names).

```
TypeReel types like a person: variable speed, natural rhythm, small typos it goes back and fixes. Into any text field, on any page you point it at.

Built for demo videos, tutorials and screen recordings — your typing takes look human on the first try, every take.

Need words? Chrome's built-in on-device AI (Gemini Nano) writes them. Done? Export the take as a GIF or WebM. Nothing ever leaves your browser.

WHO IT'S FOR
• Demo and screen-recording creators who want typing that looks real, not pasted
• Tutorial makers and product marketers filming walkthroughs
• QA engineers and form testers who fill the same forms all day
• Writers who want AI drafts typed naturally into any editor

REALISTIC TYPING SIMULATOR
Paste or write your text, click a field, press Start. TypeReel simulates human typing with adjustable speed, random pauses, and optional mistakes that get corrected as it goes. Use one-field mode for quick takes, or advanced mode to script an entire multi-field form in one run. Page changed mid-setup? Rescan finds your fields again and keeps the text you already wrote.

ON-DEVICE AI, BUILT INTO CHROME
Generate new text, rewrite what you have, or auto-fill whole forms with realistic sample data — names, emails, addresses that look real but aren't. A small assistant icon appears on the text field you're working in (only on pages where you've invoked TypeReel) and types the result in place. Site-aware presets suggest the right kind of text for the site you're on.

It all runs on Chrome's built-in AI (Gemini Nano), on your device: no API keys, no account, no cloud. On devices where Chrome's built-in AI isn't available yet, every typing feature still works — AI features simply wait until Chrome enables them.

EXPORT TYPING AS GIF OR WEBM
Turn any typing session into a clean, loopable clip: 3 themes, 3 sizes, ready for tutorials, product demos, docs and social posts. The typing animation is rendered for you — no screen recorder needed for the typing part.

PRIVACY, PLAINLY
• Everything runs locally in your browser. No servers, no account, no analytics, no data collection.
• TypeReel only touches a page when you invoke it there — it does not run in the background on all sites.
• The clipboard shortcut is optional and off by default. If you enable it, clipboard text is typed once and never stored.

KEYBOARD SHORTCUTS
Alt+Shift+T types your saved text into the focused field. Alt+Shift+P pauses or resumes. Alt+Shift+A shows or hides the AI assistant icons. Alt+Shift+C (opt-in) types your clipboard. Drive everything without opening the popup and spoiling your recording — customize keys at chrome://extensions/shortcuts.

HOW TO GET STARTED
1. Pin TypeReel and open it on the page you're recording.
2. Paste your text — or let the AI write it — and click your target field.
3. Press Start, watch it type like a human, then export the take as GIF or WebM.

Dark mode included. A What's New panel keeps you posted after updates.

TypeReel is a typing simulator, human-style auto typer, AI writing assistant and sample-data form filler in one — an auto typing tool made for people who show their screens for a living: demo creators, tutorial makers, marketers and testers. If you've ever re-recorded a take because the typing looked robotic, this is for you.
```

**Shortcuts verified against manifest v3.3.0** (5 commands; stop-typing ships unbound by design).

Note: "typing" appears 15× across 3,296 chars — always inside natural phrases; the policy bars *unnatural* repetition >5 of a keyword, and every exact keyword phrase here is ≤2. Do not add more "typing"-phrases when editing.

---

## 4. Category + language

- **Category:** `Workflow & Planning` — this is where the demo/recording cohort sits (Screencastify 4M, Scribe 1M, Tango 400K, Guidde 100K). It positions us with the wedge audience rather than in the auto-typer bargain bin ("Tools"), and its browse-traffic quality is higher.
- **Primary language:** English (United States). Additional locales in §12.

---

## 5. Screenshot plan — 5 × 1280×800 (required: min 1, max 5; supply all 5 — Google recommends it)

Style rule from evidence: nobody in the auto-typer niche has designed screenshots (1–5 raw UI captures is the norm), while the AI-writing/demo-tool winners run 7–11 designed frames with caption overlays. Designed frames with short benefit captions = instant visual outclassing of every direct competitor. Use the brand indigo (#5B5BD6), consistent caption bar top-left, real UI centered at ~80% scale on a soft gradient background.

**Screenshot 1 — HERO: realistic typing, mid-mistake.** A real page form with TypeReel typing; the frame freezes the moment a typo is being corrected (backspace ghosting shown), popup visible with speed/mistakes sliders. Caption: **"Typing that looks human. Because it types like one."** — This is first because the mistake-correction moment is the one visual no competitor can fake with a static screenshot; it *is* the product.
**Screenshot 2 — GIF/WebM export studio.** Export page with the three themes visible (theme picker open), a typing clip mid-render, size options showing. Caption: **"Export any take as GIF or WebM — 3 themes, 3 sizes."**
**Screenshot 3 — On-device AI panel.** A focused text field with the in-field assistant icon and open panel generating text; a visible "on-device · Gemini Nano" chip in the panel UI. Caption: **"Chrome's built-in AI writes it. TypeReel types it. Nothing leaves your browser."**
**Screenshot 4 — Advanced multi-field script.** A long form with several fields queued/badged, the rescan toast "Kept your text for 4 fields" visible. Caption: **"Script whole forms. Rescan keeps your text."**
**Screenshot 5 — Control & trust.** Composite: shortcuts list, dark-mode popup, and the permission prompt showing activeTab-only scope. Caption: **"No account. No servers. Runs only where you invoke it."**

Order logic: strongest differentiator → shareable output → AI trust → power feature → trust close. Screenshots are localizable per locale (§12).

---

## 6. Promo tile plan

**Small tile 440×280 — REQUIRED in practice:** Google explicitly de-ranks listings without it ("shown after extensions that do have that image").
Layout: indigo (#5B5BD6) background; left 60%: wordmark "TypeReel" above one line in white — **"Human-real typing for demos"**; right 40%: the icon/glyph with a subtle typing-cursor motif. No other text (tiles render small; one message only).

**Marquee 1400×560 — optional, build it anyway** (needed if Chrome ever features the extension; costs one artboard).
Layout: left third: wordmark + tagline **"Type it like a human. Export it like a pro."**; right two-thirds: a 3-panel film-strip motif — panel 1 a field being typed (cursor mid-word), panel 2 the AI panel, panel 3 a GIF export frame. Film-strip visual reinforces the "reel" brand.
Both tiles: PNG or JPEG. Tiles cannot be localized — keep text minimal and English.

---

## 7. Single purpose statement (Privacy tab; no published char limit — 209 chars)

```
Simulates realistic, human-like typing of user-provided or locally AI-generated text into text fields on pages where the user invokes the extension, and exports those typing sessions as GIF or WebM recordings.
```

---

## 8. Permission justifications (Privacy tab, one per permission)

**storage — 256 chars:**
```
Stores the user's typing scripts, preferences (typing speed, mistake rate, theme, dark mode, shortcut toggles) and cached settings locally on the user's device so they persist between sessions. Nothing is transmitted anywhere; the extension has no servers.
```

**activeTab — 344 chars:**
```
Grants temporary access to the current page only when the user explicitly invokes the extension (toolbar click or keyboard shortcut). Used to locate the focused text field and simulate typing into it on that page alone. Chosen deliberately instead of host permissions so the extension cannot read or run on sites the user has not invoked it on.
```

**scripting — 291 chars:**
```
Injects the content script that performs the simulated keystrokes, shows the optional in-field assistant icon/panel, and scans form fields for multi-field typing scripts — only into the page the user invoked via activeTab. No scripts run on pages the user has not activated the extension on.
```

**commands — 206 chars:**
```
Registers keyboard shortcuts (start/pause typing, open the assistant, opt-in clipboard typing) so users can control typing hands-free while screen recording, without opening the popup and spoiling the take.
```

**clipboardRead (optional permission) — 392 chars:**
```
Optional and OFF by default. When the user enables the clipboard typing shortcut in settings (a Chrome permission prompt confirms it), pressing the shortcut reads the current clipboard text once and types it into the focused field. Clipboard content is used transiently for that single action and is never stored or transmitted. The permission can be revoked at any time from the same toggle.
```

**Remote code declaration:** answer **No, I am not using remote code**. (The version-gate fetch of `config.json` from GitHub is *data*, not code — JSON config is explicitly fine under MV3; the justification above needs no mention of it. Do NOT declare remote code.)

---

## 9. Privacy practices disclosures (data-usage checkboxes + certification)

Check **NONE** of the data-type boxes. The truthful matrix:

| Dashboard data type | Answer |
|---|---|
| Personally identifiable information | ☐ No |
| Health information | ☐ No |
| Financial and payment information | ☐ No |
| Authentication information | ☐ No |
| Personal communications | ☐ No |
| Location | ☐ No |
| Web history | ☐ No |
| User activity | ☐ No |
| Website content | ☐ No |

(User text typed via the extension is processed in-page at the user's direction and stored, at most, locally via chrome.storage — it is never collected, transmitted, or accessible to the developer. That is not "collection" under CWS definitions.)

Then tick all three certification statements:
- ✅ I do not sell or transfer user data to third parties, outside of the approved use cases
- ✅ I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- ✅ I do not use or transfer user data to determine creditworthiness or for lending purposes

---

## 10. Privacy policy — required? Yes, host one.

Strictly, Google's privacy-policy mandate attaches to products that "handle user data," and CWS defines user data broadly (form data, user-generated content) **even when only stored locally**. Since the extension stores user-written scripts/preferences via chrome.storage and (optionally) reads the clipboard, the safe, dispute-proof answer is to host a policy. It also strengthens the listing's trust block and is a prerequisite for the Featured badge review going smoothly.

**Where:** a GitHub Pages page in the config repo you're creating anyway (e.g. `https://<username>.github.io/typereel-config/privacy.html`). Paste its URL in the Privacy tab's "Privacy policy" field.

**Ready-to-host draft (edit bracketed items):**

```
TypeReel — Privacy Policy
Last updated: [DATE]

TypeReel is a browser extension that simulates realistic typing, generates
text with Chrome's built-in on-device AI, and exports typing sessions as
GIF or WebM files. It is designed so that your data never leaves your
browser.

Data we collect: none.
TypeReel has no servers, no accounts, no analytics, and no trackers. We
(the developer) receive no information about you or your use of the
extension.

Data stored on your device:
- Text and typing scripts you enter, if you choose to save them
- Preferences (typing speed, mistake rate, theme, shortcuts, dark mode)
- Cached AI presets for sites where you used the assistant
This data is stored locally using Chrome's extension storage and never
transmitted. Uninstalling the extension deletes it.

AI processing:
All AI features (generate, rewrite, sample-data fill, site presets) run
on-device using Chrome's built-in AI (Gemini Nano). Your text is not sent
to us or to any third-party AI service by the extension.

Clipboard:
The clipboard typing shortcut is optional and off by default. If you
enable it, the extension reads your clipboard only at the moment you press
the shortcut, types the text into the field you chose, and does not store
or transmit it.

Page access:
TypeReel uses Chrome's activeTab permission: it can only interact with a
page when you explicitly invoke it there (toolbar or shortcut). It does
not run in the background on other sites.

Updates check:
The extension periodically fetches a small static configuration file (a
JSON file containing version information) from GitHub to know whether an
update notice should be shown. This request contains no personal data
beyond what any web request includes, and nothing about you is stored.

Changes:
If our practices ever change, this policy and the store listing will be
updated before any change takes effect.

Contact: labeeb@aicenter.ae
```

---

## 11. Support email / homepage / other URLs

- **Support email (account-level, required & verified):** `labeeb@aicenter.ae`.
- **Homepage URL:** you have no website yet — use the GitHub repository URL (make the repo public, or create a clean public `typereel` repo/landing README). A GitHub Pages one-pager (same repo as the privacy policy) is 30 minutes of work and looks better in the Details section; do it before submission if possible, otherwise add it in the first update.
- **Support URL:** GitHub Issues page of that repo (`.../issues`). This keeps bug reports off your review section — listings whose only feedback channel is reviews accumulate 1★ support requests (visible pattern on Lightning Autofill, 3.4★).
- **Official URL:** skip for now — it requires a Search Console-verified domain. If you later buy `typereel.com` (check availability when you decide the name), verify it and set it; it adds a trust line under the title.

---

## 12. Localization plan — 5 locales, in order of leverage

Evidence: per-locale listings create separate search surfaces (documented case: 40% of an extension's installs from Japanese search after localizing). Locales chosen for Chrome desktop share, screen-recording/tutorial-creator density, and weak local competition (no localized auto-typer listing exists in any of these):

1. **Japanese (ja)** — strongest documented CWS-localization payoff; large tutorial/demo culture; zero localized competitors.
2. **Portuguese-Brazil (pt-BR)** — huge Chrome market, very active creator economy, English listings underperform there.
3. **Spanish (es)** — largest aggregate reach across LatAm+Spain for one translation.
4. **German (de)** — big market, strong QA/enterprise-tester segment, high privacy sensitivity (our on-device story lands hardest here).
5. **French (fr)** — rounds out the top-5 reach; strong edtech/tutorial segment.

**What to localize, in order:** (1) title's keyword tail (keep "TypeReel", translate "Realistic Typing Simulator & Auto Typer for Demo Videos"), (2) the 132-char summary, (3) the first three description lines + section headers, (4) full description, (5) screenshot captions (screenshots are localizable; tiles are not). Ship 1–3 for all five locales at relaunch; 4–5 in the first month. Use a native-check pass (Fiverr/DeepL+native review) — machine-only translations read as spam to reviewers.

---

## 13. Post-publish SEO checklist — 30/60/90

**Week 0 (submission):**
- Submit with all 5 screenshots, small tile, marquee, privacy policy URL. Complete listings rank ahead of incomplete ones and are Featured-badge-eligible.
- Verify publisher email; confirm Established Publisher badge appears (automatic once verified + clean record).

**Days 1–30 — velocity foundation:**
- **Reviews (policy-safe):** the in-app ReviewAskCard (asks after 3rd completed session) is compliant — it must ask *everyone*, never gate on sentiment, never offer anything. Target: 25+ new reviews in 30 days (evidence: 43–80 reviews is enough to lead this niche's social proof). Reply to every review, especially negatives — response quality is visible and factored into curation.
- **Nominate for Featured badge** via the One Stop Support page once the listing is live and clean (self-nomination is official and free).
- Publish 3–5 exported GIFs/WebMs (the product's own output) on X, LinkedIn, Reddit r/SaaS r/QualityAssurance, and a Product Hunt launch — every share is a demo *made by the feature we're selling*. Include store link.
- Monitor daily: CWS search rank for "typing simulator", "auto typer", "typing for demos" (incognito, per-locale); uninstall rate (dashboard); review sentiment.

**Days 31–60 — iterate on data:**
- Ship a feature-or-fix update every 2–4 weeks (top-5 niche listings all updated within 3 weeks of my check; freshness correlates with rank).
- A/B the summary: if impressions ↑ but installs flat, swap Variant A → C for two weeks and compare dashboard impressions→installs conversion.
- Complete full-description localization for the 5 locales; verify localized search rank in ja/pt-BR.
- Seed 2–3 YouTube tutorial creators (free tool, no payment — incentivized *reviews* are banned; incentivized *videos* about the tool are fine) making "how to make typing look natural in screen recordings" content.

**Days 61–90 — compound:**
- Review count target: 75+ total, rating ≥4.5 (the rating that unlocks "high rating" filter visibility and beats every direct competitor's).
- Watch Google's built-in-AI ecosystem posts/collections — extensions using Gemini Nano get periodic editorial spotlights; when a collection opens, apply/ping via One Stop Support.
- Re-run the competitor scan (Duey.ai two-listing strategy, any new entrant using "for demos" framing) and adjust keyword tail if a term is contested.
- Gate check (from your plan): if <2K installs by day 90, re-diagnose wedge messaging before spending on anything else.

**Standing monitors:** weekly-active users vs installs (retention drives rank more than raw installs), impressions→installs conversion per locale, keyword rank for the 6 tracked phrases, review velocity, uninstall spikes within 24h of any update.

---

## Appendix A — Branding decision record (Phase 2)

**Hypothesis tested:** "AI-forward branding with core features in the name attracts more installs." Verdict: **half-right, category-dependent.** In the demo-tools cohort every post-2022 winner adds "AI" to its title (Scribe, Arcade, Supademo) — but they own an AI *category*. In AI-writing, the head terms are saturated (Grammarly 35M). In our primary niche, the winners' titles carry *function keywords* ("Auto Typer & Typing Simulator"), not "AI". Conclusion: features-in-title = yes (title is the heaviest ranking field); AI-led = no (unwinnable head terms, and it dilutes the demo wedge that is our only uncontested ground). AI belongs in the summary and screenshot 3, not the brand.

**Scoring (5 = best):**

| Criterion | GhostType | TypeReel | DemoType |
|---|---|---|---|
| CWS keyword strength (brand token adds nothing for all; tail identical) | 3 | 3 | 4 ("demo"+"type" in brand) |
| CTR in a results list | 3 — reads stealth-tool next to "GhostType AI: undetectable bypass" | 4 — video connotation matches wedge | 3 — reads like "demo version" |
| Memorability / word-of-mouth | 4 | 4 | 2 (generic) |
| Trademark & CWS collision | **1 — exact name taken (active, June 2026); "GhostType AI" = bypass tool; Ghost Typer also live; softonic mirror pollution** | 4 — no CWS/web collision found (do a USPTO/EUIPO check before finalizing) | 2 — "DemoType" is a named Microsoft ZoomIt feature (Sysinternals, 2024) |
| Migration cost | 5 (already in code) | 4 — unpublished rebrand = find/replace + icons (placeholders anyway) + config repo (not yet created) | 4 (same as TypeReel) |
| **Total** | **16** | **19** | **15** |

**Recommendation: rename to TypeReel.** The margin is clear and the knockout is specific: "GhostType AI" — the exact string users would type after seeing our AI features — is an active extension marketing "undetectable… bypass," the one association our positioning must refuse. Compounding: exact "GhostType" is also taken by a same-niche auto-typer updated last month, and "ghost" semantically whispers the stealth framing we firewall against everywhere else. Migration cost is at its lifetime minimum: the GhostType rebrand has never been published, the icons are placeholders awaiting a designer anyway, and the config repo doesn't exist yet. This window closes at first publish.

**If you overrule and keep GhostType:** use Alternate 1 title; expect to permanently share brand-search results with a bypass tool; consider a CWS impersonation report against "GhostType AI" (long shot).

**Code changes the rename implies:** manifest `name`/`short_name`, wordmark strings, `version-gate.ts` repo path → `typereel-config`, docs, CHANGELOG header, export watermark/theme labels if branded. All pre-publish, so no user-facing migration.

## Appendix B — Quality bar: our result-card vs. the 3 strongest competitors

| Listing (title + summary as shown in search) | Why a scanner clicks / skips |
|---|---|
| **Duey.ai — Auto Typer & Typing Simulator for Docs, Slides & Word Online** · "Duey.ai's Auto Typer types your work naturally in Google Docs, Slides & Microsoft Word Online. Includes humanizing tools." (30K, 4.1★) | Keyword-strong but confined to Docs/Slides/Word; "humanizing tools" signals AI-detection games. A demo creator sees nothing for them. |
| **Human Auto Typer** · "Use Human Auto Typer for Google Docs or any website for automatic character typer and add random keyboard pauses and typos symbol" (10K, 4.8★) | Highest rating, but the summary is barely grammatical keyword paste — zero benefit, zero audience. Clicks on rating alone. |
| **Loom – Screen Recorder & Screen Capture** · "Record your screen and camera with one click." (7M, 4.6★) | Owns recording, says nothing about typing. Not a competitor for the typing query — proof the wedge is unclaimed. |
| **TypeReel — Realistic Typing Simulator & Auto Typer for Demo Videos** · "Realistic human typing for demo videos, tutorials and screen recordings. On-device AI writes and fills forms. Export GIF or WebM." | Only card that (1) matches both head keywords, (2) names the searcher's actual job — demo videos, tutorials, screen recordings — in the first line, (3) offers two capabilities no rival card mentions at all (on-device AI, GIF/WebM export), and (4) contains no cheat-signaling vocabulary for a wary scanner to bounce off. For the demo-creator query, ours is the only relevant result; for the generic "auto typer" query, ours is the only one that says what it's *for*. |

Verified final counts: title 66/75 · summaries 129, 130, 128 /132 · description 3,296 chars · single purpose 209 · justifications 256/344/291/206/392. Forbidden-term scan: clean.

## Appendix C — Evidence base (key sources)

- Limits & fields: developer.chrome.com/docs/extensions/reference/manifest (name 75, summary 132) · /docs/webstore/cws-dashboard-listing (assets, small-tile de-ranking) · /docs/webstore/images
- Ranking: developer.chrome.com/docs/webstore/discovery (official heuristic: ratings + usage) · extensionranker.com/blog/chrome-web-store-ranking-patterns (120K-record study: title/summary/description relevance tiers)
- Policy: developer.chrome.com/docs/webstore/program-policies/listing-requirements (5-repetition keyword rule, testimonial ban) · /best_listing (no superlatives, no competitor names) · /program-policies/spam-and-abuse (incentivized reviews banned)
- Privacy tab: developer.chrome.com/docs/webstore/cws-dashboard-privacy · /program-policies/user-data-faq (policy required when "handling user data", incl. local-only)
- Competitors & keywords: live CWS listings pulled 2026-07-26 (Duey.ai, Human Auto Typer, Undetectable AI, Fake Filler, Grammarly, QuillBot, Loom, Scribe, Screencastify, Tango, Arcade, Supademo, KeyStrokes, HumanTyper) · chrome-stats.com install data
- GhostType collisions: chromewebstore.google.com/detail/ghosttype/dkpbjgpjnbnphdkpeljeknmaednclaoe (15 users, active) · /detail/ghosttype-ai/oailoanlpoofglbaechjhohmbbhpeifi ("undetectable… bypass", 145 users) · /detail/ghost-typer/cpgalfopkljmocpfonliakophfpdhlpg
