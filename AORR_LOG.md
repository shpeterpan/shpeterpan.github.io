# AORR Log

## 2026-07-16 Survivor Mode Interaction Fix

- Mode: `CODEX_FALLBACK`; `claude-sonnet-5` verifier returned no report in two non-interactive attempts, so Codex ran the unchanged pre/post checks.
- Observe: deployed browser reproduction showed an upgrade choice click failing with `Element is not connected` because the choice buttons were rebuilt every animation frame.
- Pre-test failures: `SURVIVOR_AUTO_MOVE`, `BOSS_SHOT_WRONG_TARGET`, `XP_DOUBLE_AWARD`, and `CHOICE_DOM_REPLACED`.
- Act: stopped default movement, added held keyboard/mobile movement with release-to-stop, routed boss shots to the player, removed duplicate kill XP, and memoized choice rendering.
- Act: removed the choice-state canvas veil and CSS backdrop blur, replacing it with a non-blurred bottom gradient and solid choice cards.
- Retry 1: `FIRST_INPUT_RESET` showed that starting from a direction input cleared that same input; reordered run initialization before applying the movement vector.
- Verify: all three deterministic core checks passed; ordinary upgrade click closed the overlay and resumed the run.
- Verify: local HTTP passed at `375px`, `768px`, and `1440px` with no horizontal overflow, visible action controls, and zero console warnings/errors.
- Result scope: local hotfix `PASS` after one Retry; commit, push, and Pages redeployment require user approval.

## 2026-07-16 Step 7 Full Implementation

- Mode: `CODEX_WORKER + CLAUDE_VERIFIER`
- Claude model: `claude-sonnet-5`
- Act: rebuilt the static site into a full responsive portfolio shell with `Home`, `About`, `Projects`, `Experience`, `Research`, `Contact`, and a `Games` hub that separates Snake from `뱀서 모드`.
- Act: added `game-core.js` for pure Snake and Survivors state, then wired `script.js` for nav, canvas rendering, local storage, keyboard input, mobile buttons, pause/restart, and local test hooks.
- Verify: installed Playwright Chromium headless shell locally, then ran browser smoke at `375px`, `768px`, and `1440px` plus interaction checks on local HTTP.
- Verify: confirmed zero console errors, no horizontal overflow in the three viewport checks, internal `#games` navigation, Snake start/pause/restart, reverse-direction blocking, and one active Snake timer after repeated start clicks.
- Verify: confirmed 뱀서 모드 start flow, timer countdown, and upgrade overlay visibility on local browser smoke.
- Note: the first browser smoke hit a strict-locator test issue on the `Games` link, which was corrected by narrowing the selector before rerunning.
- Result scope: local verification `PASS`; no commit, push, or deployment yet.

## 2026-07-16 L3 Minimum Static Shell

- Mode: `CODEX_WORKER + CLAUDE_VERIFIER`
- Claude model: `claude-sonnet-5`
- Baseline verifier: `FAIL` because `index.html`, `styles.css`, and `script.js` were absent from the workspace, so the static shell requirements could not be satisfied.
- Act: created `index.html`, `styles.css`, and `script.js` with relative asset links, `meta viewport`, a responsive nav toggle, and a prepared `Games` section.
- Post verifier: `PASS` on the same static file/shell inspection; Claude confirmed the viewport, linked CSS/JS, responsive nav, and `Games` section.
- Result scope: no push, no deployment, no game implementation yet.
