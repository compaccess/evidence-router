# Evidence Router Design

## Purpose

Evidence Router is a public applicant demo for BFC AI Gateway. A reviewer can open it without credentials, describe an AI workflow, set a monthly budget and minimum pass rate, and receive an auditable model-routing recommendation in under one minute.

## Considered approaches

1. Extend `sub2api`. This provides mature proxy plumbing but hides the applicant's contribution inside a large fork and pulls account, billing, and relay concerns into a routing demo.
2. Build a backend-backed live router. This proves real calls but requires hosted secrets, ongoing spend, and a server before a reviewer can see value.
3. Build a zero-setup static decision lab. This makes the optimization and evidence fully inspectable, deploys on GitHub Pages, and can later sit above any compliant provider gateway. This is the selected approach.

## User moment

A BFC reviewer opens the repository from an application email. With roughly one minute of attention and no API keys, they need to see that the candidate understands model evaluation, constrained optimization, cost forecasting, and evidence-backed decisions—not merely frontend polish.

## Product flow

The single-screen application has two columns. The left column captures use case, workflow type, monthly calls, token volume, monthly budget, pass-rate floor, and decision priorities. Three presets make the demo immediately runnable. The right column shows:

- the recommended weighted model portfolio;
- projected monthly API cost and savings versus an all-frontier baseline;
- expected pass rate and latency;
- a budget/quality constraint status;
- a compact Pareto frontier chart;
- an evidence ledger explaining every score and routing weight.

Changing any input recomputes the result deterministically. A copyable JSON decision record makes the output auditable.

## Optimization model

The bundled catalog contains six representative model profiles with transparent, dated fixture values for input/output price, latency, and task-specific pass rates. Values are explicitly labeled as demo benchmark fixtures, not live provider claims.

The optimizer enumerates portfolios in 10% increments, retains combinations meeting the pass-rate floor and monthly budget, and maximizes a normalized utility score:

`quality_weight * quality + cost_weight * savings + speed_weight * speed`

If no portfolio satisfies both constraints, it returns the least-violating portfolio and explains the shortfall. The all-frontier baseline uses the highest-quality eligible model for 100% of calls.

## Architecture

- React + TypeScript + Vite for a static, fast, GitHub Pages-compatible UI.
- Pure functions in `src/lib/router.ts` for forecasting, enumeration, Pareto filtering, and evidence generation.
- Catalog fixtures in `src/data/models.ts` with source labels and timestamps.
- Vitest unit tests for feasibility, weighting, cost calculation, deterministic ranking, and infeasible constraints.
- No network calls, accounts, API keys, backend, tracking, or user-data persistence.

## Visual direction

The interface resembles a restrained research/operations console rather than a marketing landing page: true white canvas, near-black text, cobalt accent, thin neutral rules, compact mono labels, and one continuous result surface instead of a grid of decorative cards. The model mix is the visual focal point. UI text and charts remain code-native.

## Accessibility and responsiveness

Inputs have visible labels, keyboard focus states, and sufficient contrast. Desktop uses a 42/58 split; below 900 px the form stacks above results. The core result remains readable at 390 px without horizontal scrolling.

## Acceptance criteria

1. `npm test` passes unit tests covering the optimizer and forecasts.
2. `npm run build` produces a static site.
3. Each preset returns a deterministic recommendation with cost, savings, quality, latency, and evidence.
4. Impossible constraints yield an explicit near-feasible explanation rather than an empty or fabricated result.
5. The deployed GitHub Pages URL works without credentials.
6. README explains the decision model, limitations, local commands, and how it relates to a provider gateway such as `sub2api` without claiming integration.

## Resume integration

The one-page English resume leads with Evidence Router and links both repository and live demo. Supporting entries retain PineAI evaluation, the IKP evaluation suite, and a compact agent benchmark item. Claims about the demo are limited to behavior verified in the repository.
