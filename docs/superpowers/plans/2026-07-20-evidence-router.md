# Evidence Router Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a zero-setup, evidence-backed smart-model-routing demo, then add the verified project to a one-page English resume.

**Architecture:** A static React/TypeScript application calls pure deterministic routing functions over a bundled model catalog. GitHub Actions deploys the built site to Pages; the existing LaTeX resume consumes a new shared project section.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, CSS, GitHub Actions, XeLaTeX/pdflatex-compatible LaTeX.

## Global Constraints

- No user accounts, payments, credential storage, provider secrets, subscription pooling, or live relay traffic.
- Demo benchmark values must be labeled fixtures rather than current provider claims.
- The demo must work without network calls or configuration.
- Resume must compile to exactly one page and only claim verified behavior.

---

### Task 1: Deterministic routing engine

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `src/types.ts`, `src/data/models.ts`, `src/lib/router.ts`
- Test: `src/lib/router.test.ts`

**Interfaces:**
- `optimizeRoute(input: RoutingInput, models: ModelProfile[]): RoutingResult`
- `forecastPortfolio(input: RoutingInput, allocations: Allocation[], models: ModelProfile[]): Forecast`

- [ ] Write Vitest cases asserting monthly token cost, weighted pass rate, budget/pass-floor feasibility, deterministic ordering, and an explicit infeasible result.
- [ ] Run `npm test -- --run`; expect the initial module-resolution failure.
- [ ] Implement typed fixtures, forecast calculations, 10% portfolio enumeration, utility ranking, Pareto points, and evidence rows.
- [ ] Run `npm test -- --run`; expect all routing tests to pass.
- [ ] Commit the independently testable routing engine.

### Task 2: Interactive decision console

**Files:**
- Create: `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles.css`, `src/components/InputPanel.tsx`, `src/components/ResultPanel.tsx`, `src/components/PortfolioBar.tsx`, `src/components/ParetoChart.tsx`, `src/data/presets.ts`

**Interfaces:**
- Consumes `RoutingInput`, `RoutingResult`, and `optimizeRoute` from Task 1.
- Produces a responsive single-screen workflow with three presets and copyable JSON.

- [ ] Generate and approve one full-screen UI concept for the decision console.
- [ ] Extract exact layout, palette, typography, component, and copy rules from the concept.
- [ ] Implement controlled inputs, preset selection, immediate recomputation, constraint messaging, weighted portfolio, metrics, chart, evidence ledger, and JSON export.
- [ ] Run `npm run build`; expect a successful Vite production build.
- [ ] Run the app and verify all presets, custom inputs, narrow viewport, and copy action in a browser.
- [ ] Compare concept and browser screenshots with `view_image`, repair visible drift, and commit the UI.

### Task 3: Public repository and deployment

**Files:**
- Create: `README.md`, `LICENSE`, `.gitignore`, `.github/workflows/deploy.yml`

**Interfaces:**
- GitHub Pages publishes `dist/` from the default branch.

- [ ] Document the product, algorithm, fixture limitation, architecture, local commands, screenshots, and compliant relationship to upstream API gateways.
- [ ] Configure Vite's production base and a Pages workflow using `actions/configure-pages`, `actions/upload-pages-artifact`, and `actions/deploy-pages`.
- [ ] Run `npm test -- --run && npm run build`; expect both commands to succeed.
- [ ] Create public repository `ktwu01/evidence-router`, push commits, enable Pages, and verify the public URL returns HTTP 200.

### Task 4: One-page English application resume

**Files:**
- Create: `shared/sections_en/project_evidence_router.tex`
- Create: `BFC_AI_Gateway_Resume_KoutianWu_PhD_UTAustin/BFC_AI_Gateway_Resume_KoutianWu_PhD_UTAustin.tex`
- Create: `BFC_AI_Gateway_Resume_KoutianWu_PhD_UTAustin/_header0.tex`, `_header1.tex`, `_header2.tex`

**Interfaces:**
- The main resume imports existing education/experience sections plus the new verified demo section.

- [ ] Add a concise project entry linking the repository and live demo, describing constrained portfolio optimization, forecasting, Pareto analysis, and evidence trails.
- [ ] Assemble a one-page English resume led by Evidence Router, followed by PineAI, IKP, and the strongest compact benchmark/full-stack evidence.
- [ ] Compile twice and confirm the LaTeX log reports exactly one output page with no fatal errors.
- [ ] Inspect the PDF visually for clipping, overlaps, malformed links, and readable hierarchy.
- [ ] Run `build_all.sh` or the relevant targeted checks and commit the resume artifacts.

### Task 5: Completion audit

**Files:**
- Verify all created artifacts and external URLs; no new files required.

- [ ] Confirm the repo is public, the live demo loads, inputs alter recommendations, and JSON evidence is copyable.
- [ ] Confirm tests and production build pass from a clean dependency install.
- [ ] Confirm the final PDF is exactly one page and every new claim is supported by repository behavior.
- [ ] Record final repository, live demo, `.tex`, and `.pdf` paths for handoff.
