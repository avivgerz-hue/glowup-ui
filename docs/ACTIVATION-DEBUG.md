# Verify activation

Discovery, full instruction loading and useful behavior are separate findings. A skill listing or successful installation proves only packaging/discovery.

```bash
node scripts/test-activation.mjs
node scripts/test-activation.mjs --run --timeout-ms 60000
```

The first prepares isolated temporary fixtures without model calls. The second requires normally authenticated native Claude Code/Codex CLIs and their normal permissions. Hidden tokens in both a temporary skill body and reference distinguish complete loading from name recognition. These markers never belong in the production skill.

Keep raw logs private. Authentication/network failures are blocked tests, not passes or proof that the skill is ignored. Controls must also be checked for global/ancestor skill contamination. After activation, use [matched comparisons](../benchmarks/PAIRED-EVALUATION.md) to assess actual implementation influence and independent visual quality. No completed current-preview quality advantage is claimed.
