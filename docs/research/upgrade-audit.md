# Upgrade audit and priorities

Scope: the current clean public repository only, inspected 28 October 2026. Retired repositories and their assets were not consulted. Baseline: 132 tests and skill validation passed.

| Rank | Category | Supported finding and evidence | Change / risk |
|---|---|---|---|
| 1 | A: first impression | README has no rendered example; a visual skill cannot be assessed at a glance. | Fresh, labelled CREATE and TRANSFORM images. Low implementation risk. |
| 2 | B: onboarding | README requires a checkout and several steps; the installer already supports direct project scope. | Tested tagged-source npx command. Low risk; no new package manager. |
| 3 | A | README says the repository is private, while the current repository API reports public and v0.1.0 is published. | Correct status and link to the existing release. Low risk. |
| 4 | C: product | Public modes use REFINE, but composition.mjs rejects `--mode refine`; the preservation scope exists only as polish. | Backward-compatible REFINE alias and explicit route. Low risk, tested and exercised on the designed fixture. |
| 5 | E: evidence | Runnable before/after fixtures exist, but no fresh public source-hashed capture/provenance record is linked. | Reproducer, equal state/viewports, image/source hashes and browser assertions. Moderate tooling risk. |
| 6 | D: compatibility | Installer tests do not establish native activation; the current probes are blocked. | Separate installer-tested, documented and unverified states. No runtime claim. |
| 7 | D | Some hosted official docs cannot be accessed; one old official source path is gone. | Record source retrieval limits and retain unverified platforms. No guessed aliases. |
| 8 | F: community | No issue forms, PR template, short roadmap or changelog. | Small privacy-aware forms and contribution links. Low risk. |
| 9 | A/F | No original social image/icon or About description/topics. | Original SVG identity, optimized PNGs, metadata and exact owner upload path. Low risk; no visibility/security changes. |
| 10 | E/C | Functional checks and subjective quality can be confused; no completed current native A/B comparison exists. | Prominent limits, activation results and a reviewer-oriented demonstration record. Larger model comparisons remain blocked. |

The existing source-preservation checks, optional browser tooling, safe installer backups and concise references are retained. These findings do not establish that design instructions are ignored or that more prose would improve results.
