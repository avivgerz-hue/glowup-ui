# Skill reliability sprint · 29 October 2026

Candidate for review, not a released version. Base: `0cdbd06cceaf6444edfe5646dcb3b66ed0204b7d` (merged PR #3). Public preview remains v0.1.1; tags/releases unchanged. See the [testing handoff](testing-agent-handoff.md) for the exact implementation commit.

## Five highest-impact findings

Rank reflects the plausible consequence and strength of engineering evidence, not a measured effect on design quality.

| Rank | Weakness | Evidence before the fix | Change and remaining limit |
| --- | --- | --- | --- |
| 1 · high | Inspection overrides full redesign with polish | `inspect.mjs` always emitted REFINE and “at most three meaningful fixes”, contradicting the core workflow. Scope regression test failed on the base. | Explicit `--scope redesign` / `refine`; default asks the agent to follow the request. Priorities are not an edit ceiling. `look.mjs` no longer prescribes task scope. Whether agents now execute stronger redesigns is unverified. |
| 2 · high | Claude user installation ignores its configured root | `doctor` uses `CLAUDE_CONFIG_DIR`, but `targetDir` used only `home/.claude`. Source mismatch confirmed. | Install/removal use the same configured root; project paths stay unchanged. Unit and real CLI subprocess tests cover full payload, idempotence, doctor and recoverable removal. Native Claude activation remains unverified. |
| 3 · high | Identity inspection reads external source symlinks and crashes on broken links | `look.mjs` called `statSync` / `readFileSync` on non-directory entries without requiring regular files. The regression test failed with ENOENT; external linked CSS could contribute identity signals. | Skip symlinks. Alias recommendations also stay within the app's physical root. This is a source-inspection boundary, not a comprehensive filesystem security audit. |
| 4 · medium | Installed skills/backups contaminate app orientation and preservation | `discover` did not exclude `.agents`, `.claude`, `.opencode`, `.glowup-ui`; checkpoint omitted the latter two. Regression test detected extra routes/files/tokens from skill data. | Ignore those directories consistently. Test confirms backups cannot become application routes and adding installation data does not invalidate a checkpoint. Genuine application files remain checked. |
| 5 · medium | Shared-component recommendations miss aliases and index modules | Resolver appended extensions to module IDs; `@/components/Shell` and a directory's `index.tsx` were not resolved. Regression test failed. | Resolve local plain-JSON tsconfig/jsconfig paths and directory indexes; reject outside-root targets. JSONC, extends, bundler aliases and workspace packages require manual inspection, explicitly reported. |

Four initial inspection regressions were run against the unchanged base and failed before implementation. Additional tests cover CLI diagnostics, checkpoint exclusion, configured-root installation and boundary cases. These are helper-level fixtures, not apps built by an agent.

## Instruction audit and targeted efficiency changes

CREATE establishes a first-pass system; TRANSFORM differentiates full redesign and local REFINE, preserving behavior/brand. Design-quality guidance already specifies composition, typography, shared primitives, product-specific decisions and phone states. No evidence here justifies replacing that system.

Changes align helper output with those instructions. CREATE now extends the opening brief rather than demanding another plan; verification reuses builds/servers and recaptures affected views after fixes. The report asks for actual commit status rather than an unconditional “Nothing was committed”. The canonical SKILL.md remains 39 lines. No runtime dependency was added. Reduced tool/token cost and stronger agent compliance are hypotheses until measured by the testing agent.

## Verification boundaries

- Baseline repository suite: 137 passed, zero failed/skipped.
- Final local repository suite: 146 passed, zero failed/skipped (Node 24.19.0, approximately 9.24 seconds for the test runner). Targeted inspection suite: seven passed. Hosted results are recorded in the draft PR checks. No tests were removed or quality thresholds relaxed.
- Packed candidate: actual tarball extraction, complete canonical hash equality, validation and reversible project installation for Claude/Codex/OpenCode passed. Initial pack attempt failed due to the unwritable default npm cache; retry with an isolated temporary cache passed.
- No native agent sessions, app-building trials, new demos, screenshots, design scores or A/B comparisons were produced in this sprint. Existing CI browser jobs are repository contracts, not evidence of agent quality.
- Existing activation gaps remain: installation/discovery are not full loading; full loading is not successful use or superior output. See [compatibility](../compatibility.md) and [activation procedure](../ACTIVATION-DEBUG.md).
- Retired repository/history/backups were not used. No tags, releases, visibility, telemetry, outreach or directory submissions changed.

## Research-integration backlog

| Priority | Question / candidate | Evidence needed before changing the skill |
| --- | --- | --- |
| P0 | Do users receive the complete current payload and selected references? | Native Claude/Codex/OpenCode transcripts showing full loading; record trust/settings/auth blockers separately. |
| P0 | Does corrected scope produce a substantial TRANSFORM rather than cosmetic polish? | Matched baseline/candidate runs, unchanged app/task/settings, blinded screenshots and original functionality checks. |
| P1 | Does shorter CREATE verification reduce work without losing coverage? | Actual command timeline, runtime/tool counts and affected-route/phone coverage; report unavailable tokens as unavailable. |
| P1 | Are preservation heuristics obstructing authorized composition changes? | Concrete false positives plus original behavior tests; never suppress a finding merely to obtain a pass. |
| P2 | Is broader JSONC/inherited/bundler alias resolution worth more code? | Real unresolved shared-component cases, frequency and extra inspection cost. Current fallback is manual review. |
| P2 | Do design recipes improve first-pass decisions beyond built-in agent ability? | Independent tester evidence of recipe use and blinded comparisons; popularity/research alone is not proof. |
| P2 | Does interrupted installation need per-target transactional recovery? | Reproducible write/rename failure tests and cross-filesystem/Windows plan. Existing backups preserve originals but batch atomicity is not claimed. |

Evaluate forthcoming research as hypotheses with applicability, license and execution-cost checks. Prefer an observed failure with a narrow correction to a longer compulsory workflow.
