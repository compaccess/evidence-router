# Visual Fidelity Ledger

Concept: `docs/design/evidence-router-concept.png`  
Desktop render: `docs/design/evidence-router-render.png` (1440×1024 viewport)  
Mobile render: `docs/design/evidence-router-mobile.png` (390×844 viewport)

| Check | Concept evidence | Render evidence | Result |
|---|---|---|---|
| First-viewport composition | Simple header above 42/58 form/results split | Same header and split; core allocation, metrics, frontier, and evidence fit in one desktop viewport | Matched |
| Typography | Serious sans headings plus compact mono operational data | Inter headings and IBM Plex Mono data/control annotations | Matched |
| Palette | True white, near-black, cobalt, neutral hairlines | Exact white canvas, `#155eef` cobalt, gray rules, no gradients or shadows | Matched |
| Container model | Open analytical surface divided by rules; no decorative card grid | Form and results remain continuous open surfaces with horizontal rules | Matched |
| Model allocation | Colored weighted allocation is the primary focal point | 44 px weighted bar immediately below the result heading | Matched; demo intentionally optimizes up to two models rather than the concept's illustrative four |
| Metrics and constraints | Compact metric strip and explicit constraint checks | Four metrics and three quantified constraint results | Matched |
| Pareto analysis | Cost/pass-rate chart plus frontier summary | Code-native responsive SVG and summary rail | Matched |
| Evidence ledger | Table with weight, score, rationale, and cited evidence | Same fields, dated fixture disclosure, copyable JSON decision record | Matched |
| Responsive behavior | Not shown in desktop concept | 390 px layout stacks form/results; table scrolls locally; no page-level horizontal overflow | Verified extension |
| Above-the-fold copy | Product name, tagline, form/result headings, core action labels | All required strings preserved; preset tabs and explicit fixture disclosure are functional additions | No conflicting copy |

## Intentional deviations

- The optimizer enumerates one- and two-model portfolios in 10% increments for a transparent applicant-sized demo. The concept's four colors were illustrative.
- The mobile version stacks the full decision flow and uses a locally scrollable evidence table.
- The Method link targets a concise footer explanation because the demo has no secondary page.

Playwright verified preset recomputation, clipboard success state, desktop rendering, mobile rendering, and absence of page-level mobile overflow.
