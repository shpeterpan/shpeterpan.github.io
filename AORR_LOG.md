# AORR Log

## 2026-07-16 Step 9 Finance-style UI Reflow

- Mode: `CODEX_FALLBACK`; Claude verifier was unavailable in this session, so Codex handled content rewrite and local validation directly.
- Pre-check: `MEMORY.md` was updated with the active loop snapshot, current commit `e010166`, last normal deploy `e010166`, Git status, and rollback criteria before edits.
- Act: replaced every remaining public placeholder in `index.html` with factual portfolio content drawn from the repository itself, including the static shell, Snake engine, Survivor mode, build log, and live/source links.
- Act: reworked the layout toward a 2026 finance-app style using larger bento cards, wider hero hierarchy, a three-card metrics rail, and clearer call-to-action links while keeping the approved bright glass top bar.
- Act: expanded `styles.css` with new `hero`, `feature`, `project`, `research`, `contact`, and timeline layout rules plus responsive spans for 1080px and 780px breakpoints.
- Verify: `git diff --check` passed and placeholder scans for the old public-status phrases returned no matches in `index.html` or `styles.css`.
- Result scope: public content cleanup and financial-layout reflow are in progress; no commit, push, or redeploy yet.

## 2026-07-16 Step 9 Change Request Re-loop

- Mode: `CODEX_FALLBACK`; Claude verifier tool was unavailable in this session, so Codex handled the validation path directly after updating the run record.
- Pre-check: `MEMORY.md` recorded the loop snapshot, current commit `8c357f2`, last normal deploy `2698d7f`, Git status, and rollback criteria before any code edits.
- Act: added the Step 9 execution order note to `AORR.md`, then removed every public approval-needed string from `index.html` and replaced it with neutral status text.
- Act: strengthened the shared surface styling in `styles.css` with heavier blur, translucency, glow, and layered glass treatment across panels, cards, tabs, controls, and choice overlays.
- Verify: local HTTP smoke at `375px`, `768px`, and `1440px` showed `scrollWidth === clientWidth`, no approval-needed string in rendered text, approved status text present, and no console errors or page errors.
- Verify: browser interaction smoke confirmed `window.__loopEngineer` existed, `survivor.start()` entered `running` state, and `snake.start()` entered `running` state with keyboard input accepted.
- Result scope: public content cleanup and liquid-glass visual refresh completed; approval gate remains `DEPLOY_APPROVAL_REQUIRED`, with no commit, push, or redeploy yet.

## 2026-07-16 Step 9 Deployment Closeout

- Deploy: committed and pushed `0cf633f` to `main`.
- Deploy verify: `https://shpeterpan.github.io/` returned HTTP `200` with GitHub Pages headers after the push.
- Result scope: loop closed as `DEPLOYED`; no rollback or follow-up edits required.

## 2026-07-16 Survivor Mode Interaction Fix

- Mode: `CODEX_FALLBACK`; `claude-sonnet-5` verifier returned no report in two non-interactive attempts, so Codex ran the unchanged pre/post checks.
- Observe: deployed browser reproduction showed an upgrade choice click failing with `Element is not connected` because the choice buttons were rebuilt every animation frame.
- Pre-test failures: `SURVIVOR_AUTO_MOVE`, `BOSS_SHOT_WRONG_TARGET`, `XP_DOUBLE_AWARD`, and `CHOICE_DOM_REPLACED`.
- Act: stopped default movement, added held keyboard/mobile movement with release-to-stop, routed boss shots to the player, removed duplicate kill XP, and memoized choice rendering.
- Act: removed the choice-state canvas veil and CSS backdrop blur, replacing it with a non-blurred bottom gradient and solid choice cards.
- Retry 1: `FIRST_INPUT_RESET` showed that starting from a direction input cleared that same input; reordered run initialization before applying the movement vector.
- Verify: all three deterministic core checks passed; ordinary upgrade click closed the overlay and resumed the run.
- Verify: local HTTP passed at `375px`, `768px`, and `1440px` with no horizontal overflow, visible action controls, and zero console warnings/errors.
- Deploy: pushed hotfix commit `2698d7f` to `main`; GitHub Pages reached `built` and page/assets returned HTTP 200.
- Deploy verify: Claude Sonnet 5 returned no final report, so Codex browser fallback confirmed three choices, no backdrop blur, ordinary choice click, resumed run, and zero console warnings/errors.
- Result scope: hotfix deployment `PASS` after one Retry; public URL is `https://shpeterpan.github.io/`.

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
