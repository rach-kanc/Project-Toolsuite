# AGENTS.md — Project Toolsuite

## What this is

A privacy-first collection of browser-based utilities. All tools run client-side in vanilla HTML/CSS/JS. No build step, no package manager, no tests, no CI.

## Dev server

```bash
# Live Server (VS Code); port 5501 per .vscode/settings.json
npx serve .          # or just open index.html directly
```

## Structure

- `index.html` — landing page; tools are defined in a JS array (`const tools = [...]`) and rendered dynamically into `.tools-grid`. Each entry has `{ name, path, tags }`.
- `tools/<name>/` — 55+ single-page tools. Entrypoint filenames vary (defined per-entry in the tools array, e.g. `cron.html`, `aes.html`, `index.html`).
- `theme.css` — CSS custom properties for light/dark mode. Import as `../../theme.css` from tools.
- `theme.js` — Dark mode toggle (IIFE prevents FOUC). Include before `<style>` or as `<script src="../../theme.js">`.
- `sw.js` — Service worker: cache-first for static resources, network-first for `index.html` (ensures fresh tool list).
- `assets/css/notifications.css` + `assets/js/notifications.js` — shared toast/notification system (`notify.success()`, `notify.error()`, `notify.info()`).
- `manifest.json` — PWA manifest.

## Installed Skills (`.agents/skills/`)

| Skill | Use in this repository |
|---|---|
| `accessibility-compliance` | Audit and implement WCAG 2.2 patterns across tool pages; ARIA roles, keyboard nav, screen-reader support |
| `conventional-commit` | Generate standardized commit messages following Conventional Commits spec for all PRs |
| `core-web-vitals` | Optimize LCP, INP, CLS on tool pages — critical for a static site with many separate HTML entries |
| `deploy-to-vercel` | Deploy the static site (or preview deployments) to Vercel from CLI |
| `github-actions-docs` | Reference when writing or modifying `.github/` workflows for CI/CD on this repo |
| `jsdoc-typescript-docs` | Document shared JS utilities (`theme.js`, `notifications.js`, tool scripts) with JSDoc comments |
| `modern-css` | Write modern CSS for tool stylesheets and `theme.css`; container queries, custom properties, etc. |
| `modern-javascript-patterns` | Refactor tool JS to ES6+ patterns — async/await, modules, destructuring — without adding a build step |
| `pwa-development` | Maintain and extend `sw.js` (service worker, caching strategies, offline support, `manifest.json`) |
| `responsive-design` | Make tool UIs fluid across screen sizes using CSS Grid, container queries, mobile-first breakpoints |
| `semantic-html` | Ensure all tool HTML uses correct semantic elements, document structure, and native controls |
| `wcag-audit-patterns` | Run WCAG 2.2 audits on individual tool pages; surface and remediate accessibility violations |

## Conventions

- **No build tools, no npm, no CI**. This is a static site deployed on Vercel.
- Every tool is self-contained in its own directory under `tools/`. Use `../../` to reference root assets.
- Design: monospace-first (JetBrains Mono + Space Grotesk), high-contrast, monochrome, thick borders (`2px solid #000` / `var(--border)`), inversion on hover.
- Dark mode: toggle via `toggleTheme()` in `theme.js`; class `dark-mode` on `<html>`. Use CSS vars `--bg`, `--text`, `--border`, etc.
- When adding a new tool: create `tools/tool-name/index.html` + any local CSS/JS, then append an entry to the `const tools = [...]` array in `index.html`.
- Filename `contributers.html` is intentionally misspelled (do not "fix" it).
- PRs follow `pull_request_template.md` — include summary, issue ref, testing steps, contributor details.
- No test framework exists. Verify changes by opening affected pages in a browser.
