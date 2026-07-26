# Update system — how it works & one-time setup

Shipped in v3.3.0. Two pieces:

1. **Remote compatibility gate** — the extension reads a static `config.json`
   you host for free on GitHub. When `minVersion` in that file is higher than
   the installed version, the popup is replaced by an "Update required" screen
   and keyboard shortcuts refuse to run (with a toast pointing to the popup).
   Until you raise that number, users never see anything.
2. **"What's new" popup** — after any update, the popup shows one-time paged
   release notes (Next / Got it) covering every version the user skipped.
   Fresh installs never see it. Add a new `CHANGELOG` entry in
   `entrypoints/popup/utils/whats-new.ts` for each release.

## One-time setup (~2 minutes)

1. Create a **public** GitHub repo named `ghosttype-config` (any GitHub
   account, free).
2. Add a file `config.json` at the repo root — copy
   `docs/remote-config/config.json` from this project. Keep `minVersion` at
   `"3.0.0"` for now (nothing is blocked).
3. In `entrypoints/popup/utils/version-gate.ts`, replace
   `<YOUR_GITHUB_USERNAME>` in `REMOTE_CONFIG_URL` with your GitHub username.
4. Rebuild. Done — nothing visible changes for users.

Safe to ship before doing this: with the placeholder URL (or a 404) the gate
simply stays open.

## Flipping the switch later

Edit `config.json` on GitHub (web UI is fine) and raise `minVersion` to the
lowest version you still allow, e.g.:

```json
{
  "minVersion": "4.0.0",
  "message": "This version of GhostType is out of date and no longer supported. Update to keep typing.",
  "updateUrl": "https://chromewebstore.google.com/detail/flieihjecdghlbgbmjbilfcabbdplanh"
}
```

Everything below `minVersion` locks within ~6 hours (config refresh interval;
raw.githubusercontent.com itself caches ~5 minutes). `message` and
`updateUrl` are optional; `updateUrl` must be a Chrome Web Store URL or it is
ignored (defends against a tampered config redirecting users).

Note this gate exists in **v3.3.0 and newer only**. Versions ≤3.2.0 have no
gate — but Chrome auto-updates store installs within hours, so those users
move forward on their own; the gate guarantees no one can sit on an old
version after that.

## Behavior details

- **Fail-open**: never fetched / fetch fails / file deleted → extension works
  normally. Once a config is cached it keeps applying offline, so going
  offline does not unblock an outdated install.
- **Refresh points**: on install/update, on browser startup, on popup open,
  and after any keyboard command — all throttled to one fetch per 6 hours.
- **Fast update path**: the "Update now" button calls
  `chrome.runtime.requestUpdateCheck()`; the background worker listens for
  `onUpdateAvailable` and calls `chrome.runtime.reload()`, so the update
  applies seconds after the user closes the popup.
- **No new permissions**: raw.githubusercontent.com sends
  `Access-Control-Allow-Origin: *`, so the fetch needs no host permissions and
  the install-time permission prompt is unchanged.
- **Store-policy safe**: the config is pure data (a version string + text),
  never executed — this is the standard remote-config pattern, not remote
  code.
