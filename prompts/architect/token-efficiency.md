# Token Efficiency Contract

1. Never send the full manuscript when a segment, memory item, or result is sufficient.
2. Run deterministic normalization, hashing, segmentation and validation before LLM work.
3. Cache identical provider requests using a stable key containing agent, prompt version, input hash and relevant options.
4. Ask for structured JSON, not prose, from internal agents.
5. Summarize completed work into editorial memory; do not replay prior transcripts.
6. Run independent QA only on changed output or a targeted sample unless a full audit is explicitly required.
7. Retry only technical/transient failures automatically; content failures become bounded repair tasks.
8. Never exceed the task's token budget without an explicit planner decision.
