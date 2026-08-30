# Test Plan

## Deterministic tests
- Empty manuscript.
- Unicode preservation.
- Newline normalization.
- Stable segmentation.
- Hash/cache behavior.
- Dependency scheduling.
- Retry limits.

## Prompt regression
Fixtures live in `prompts/tests`. A prompt change must preserve historical acceptance cases.

## Integration
Input -> normalize -> segment -> memory -> plan -> run -> QA -> deliver.

## Failure policy
Technical failures retry with bounded backoff. Content failures produce a targeted repair task. Critical QA failures block final delivery.

## Token efficiency tests
- Cache identical requests.
- Verify no unnecessary full-manuscript context.
- Prefer deterministic validation before semantic evaluation.
- Record input/output token budgets when an LLM provider is active.
