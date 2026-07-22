# Word-Based Usage Input Design

## User moment

A product, operations, procurement, or finance user is estimating an LLM workload. They can approximate the words sent to and returned by one call, but they do not have a tokenizer and should not need one to obtain a routing recommendation.

## Decision

The routing brief will collect two whole-number fields:

- Input words per call
- Output words per call

The interface will not ask the user to enter tokens. It will show one short note: cost is estimated at approximately 1.33 tokens per word, and actual tokenization varies by language and model.

## Estimation rule

A single utility will define the demo assumption:

```text
estimated tokens = round(words × 4 / 3)
```

Zero words produce zero estimated tokens. Editable fields prevent negative values. The ratio and explanatory copy are centralized so the optimizer, UI, tests, and exported decision cannot silently disagree.

This is a planning estimate, not an exact tokenizer result.

## Data flow

`RoutingInput` will store `inputWordsPerCall` and `outputWordsPerCall`. Presets will also store words. The cost forecast will convert those values immediately before applying the existing provider prices per million tokens.

The copied decision JSON will contain the word-based routing input plus a `usageEstimation` record with the ratio, estimated input/output tokens, and a note that the estimate varies by language and model. Derived token counts are evidence for the forecast, not user inputs.

Existing presets will use word counts that approximate their current token workloads, keeping the demo forecasts stable within normal integer-rounding differences:

- Customer support: 750 input words and 188 output words
- Research agent: 6,000 input words and 1,125 output words
- Coding workflow: 3,750 input words and 900 output words

## UI behavior

The existing two-column usage layout remains. Only the terminology, field bindings, values, and estimation note change. Updating either word field continues to recompute the forecast immediately.

No language selector, provider tokenizer, advanced setting, or extra workflow step will be added.

## Tests

- Unit-test the shared conversion for zero and representative word counts.
- Verify the router calculates token-priced cost from word-based inputs.
- Verify presets and types no longer expose editable token fields.
- In browser QA, confirm the words labels and estimation note are visible, changing input words changes projected cost, copied JSON includes the word input and estimation metadata, and desktop/mobile layouts do not overflow.

## Non-goals

- Exact or provider-specific tokenization
- Language detection
- Asking users to select a conversion rate
- Changing provider price units
- Claiming that 1.33 tokens per word applies exactly to every workload
