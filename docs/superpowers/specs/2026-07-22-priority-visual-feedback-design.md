# Priority Visualization Feedback Design

## User moment

A reviewer drags Quality, Cost, or Latency during a live demo. They need immediate visual proof that the routing decision was recomputed. If the chart remains pixel-identical, the reasonable conclusion is that the controls are disconnected from the routing logic.

## Reproduced failure

With the customer-support preset, changing Quality from 50 to 60 changes selected utility from 0.771 to 0.774. The selected portfolio remains the same. The current Pareto chart receives the same points, produces identical DOM, and produces a byte-identical screenshot.

The chart plots monthly cost against pass rate. Those coordinates describe the feasible portfolio frontier and should not move merely because user preferences change. The failure is that the chart contains no other visual encoding of the priorities or recomputed decision score.

The current browser check changes presets and compares forecast cost. It never interacts with a priority slider or checks the visualization.

## Considered approaches

### Animate or flash the existing chart

A generic animation would acknowledge the input event but would not show how priorities affect the decision. It could make disconnected controls look active, so this approach is rejected.

### Move Pareto coordinates when priorities change

Changing cost or pass-rate coordinates in response to preference weights would misrepresent the data. The frontier geometry comes from portfolio forecasts, not user preference. This approach is rejected.

### Preserve the frontier and add decision-specific visual encodings

The selected approach keeps cost/pass-rate geometry correct while adding three priority-driven signals:

1. An in-chart priority-mix bar shows both raw inputs and normalized values, so every slider change remains visible even when the normalized ratio is unchanged.
2. Frontier points visually encode their current utility, so priority changes rerank the alternatives even when the winner stays the same.
3. The selected route is rendered explicitly and last, including when it is not part of the cost-quality frontier.

## Data model

Each plotted point will include monthly cost, pass rate, latency, current utility, frontier membership, and selected status. The optimizer already calculates utility for every candidate, so the chart will consume the existing decision evidence rather than recomputing ranking logic in React.

The plot builder will retain representative frontier points, always retain the selected frontier point, and append the selected point when a speed-driven recommendation is dominated in cost and quality. The frontier polyline will connect only frontier members.

The chart will receive the current priorities. It will normalize them using the same sum-based rule as the optimizer. A zero-total input will display three zero segments while preserving the optimizer's existing fallback behavior.

## Rendered behavior

The chart will be labeled as a feasible frontier plus selected route. A compact priority-mix strip inside the SVG will show raw Quality/Cost/Latency inputs alongside distinct colors and normalized percentages. The raw input text changes for every slider movement, including scale-invariant changes such as `100/0/0` to `50/0/0` where the normalized mix remains the same.

Frontier points will expose current utility through opacity and radius. The selected route will use a high-contrast ring and a text label. A legend will distinguish frontier alternatives from the recommendation.

The surrounding copy will state that the frontier geometry represents available cost-quality trade-offs while priorities rerank those alternatives. This explains why the line can remain fixed without leaving the visualization visually stale.

## Tests

### Unit tests

- Hold workload, budget, pass-rate floor, and model catalog fixed while changing only priorities. Confirm that an extreme quality-first setting can select a different portfolio.
- Confirm every routing result contains exactly one visible selected point.
- Use a small catalog where a latency-first winner is dominated in cost and quality. Confirm that the selected route is still included without joining the Pareto polyline.

### Browser regression

- Load the customer-support preset.
- Capture the chart state and screenshot.
- Change Quality from 50 to 60 while leaving all other inputs fixed.
- Assert that the chart's priority signature changes.
- Assert that the rendered chart screenshot changes even though the selected portfolio and forecast metrics remain stable.
- Set Cost and Latency to zero, change Quality from 100 to 50, and assert the screenshot still changes even though the normalized mix is unchanged.
- Change to an extreme quality-first mix and confirm the selected route and forecast update.

### Existing gates

- Run the complete Vitest suite.
- Run the production build.
- Run the visual QA script at desktop and mobile sizes.
- Confirm there are no application runtime errors.

## Scope boundaries

This fix does not change synthetic model evidence, add production data, introduce continuous optimization, or make the Pareto frontier preference-dependent. It repairs the missing visual connection between the priority controls and the routing result.
