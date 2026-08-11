# Repository Guidelines

<!-- codex: 2026-08-10 Add contributor guidance for the Bridg-It game repository. -->

## Project Structure & Module Organization

This is a static browser game with no build step. `index.html` is the entry point and controls page structure and script order. Keep visual rules in `css/style.css`. Game state, move validation, and win detection belong in `js/game.js`; AI selection belongs in `js/ai.js`; SVG rendering and DOM events belong in `js/ui.js`; `js/stats.js` owns local performance records. Python regression tests live in `tests/`. Design notes and debugging material are in `docs/`; root-level `page1.jpg` and `page2.jpg` are reference screenshots.

## Build, Test, and Development Commands

Open `index.html` directly in a browser for manual play. Use a hard refresh after changing scripts so cached query-string versions do not hide a change.

Run tests from Windows PowerShell:

```powershell
python.exe -m pytest -q
python.exe -m pytest -q tests/test_bridg_it.py
```

The first command runs the full regression suite. The second command focuses on core board rules. The repository has no separate bundler or JavaScript lint command; before submitting, run the affected tests and verify the changed interaction in a browser.

## Coding Style & Naming Conventions

Use four-space indentation. Use `snake_case` for JavaScript files, functions, and variables; `PascalCase` for classes; and `UPPER_SNAKE_CASE` for constants. Keep modules focused: place rule changes in `game.js` and presentation changes in `ui.js`. Add comments for public functions and explain graph-search invariants. Avoid unrelated formatting changes and keep individual files below 500 lines when practical.

## Testing Guidelines

Every behavioral change needs a focused pytest case in `tests/test_<topic>.py`. Name tests `test_<behavior>_<scenario>()`. Use small boards to cover valid moves, crossing restrictions, win detection, and AI termination. Do not depend on network access, browser state, or generated artifacts. Add a regression test before fixing a bug whenever it can reproduce the reported behavior.

## Commit & Pull Request Guidelines

Recent history uses short imperative summaries, such as `update角平分线`. Prefer a clearer scoped form, for example `[js/ai] fix master move timeout`, and state why the change is needed. Pull requests should include the problem, implementation summary, test commands and results, and manual verification. Attach screenshots for visual changes; include reproduction steps for rule or AI changes.

## Configuration & Assets

Do not commit credentials, personal data, or large generated assets. Preserve compatibility for script version query parameters and local-storage keys. When either changes, document cache invalidation or record-migration effects in the pull request.
