# MixShift

A local educational tool for inspecting how a changed aggregate success rate relates to changed group rates and changed group shares. New work began on 2026-10-22 for the STEM2Connect Scientific Research track. This prototype is not a registered or submitted contest entry. No measured learning benefit, adoption or award is claimed.

## Run and reproduce

No packages, build, API, credentials or model downloads are required. In this directory run `python3 -m http.server 8843 --bind 127.0.0.1` and open `http://127.0.0.1:8843`. Use a modern browser with BigInt and ES modules.

Run `node --test engine.test.mjs`. Nine tests cover exact known fractions, both replacement orders, period reversal, group ordering and splitting, invalid inputs, count boundaries and 6,561 independently calculated small two-group profiles. This is bounded synthetic validation, not proof of all possible inputs or real-world effectiveness.

For a separate Python standard-library Fraction oracle, run `python3 reference_fraction.py` with Node.js available on PATH, or supply `--node /absolute/path/to/node`. It compares eight exact fraction fields and the strict reversal flag across 15,625 exhaustive three-group profiles and 110 deterministic profiles spanning 2–12 groups (seed 20261022). All 15,735 profiles matched. The reference computes the average of the two replacement orders independently of the production half-sum expression.

The default synthetic example has Returning counts 90/100 before and 19/20 after, and First-time counts 1/10 before and 12/80 after. Both group rates rise by five percentage points, but the aggregate falls from 91/110 to 31/100. The exact split is within-group change 1/20, composition change −156/275, headline change −569/1100, all as proportions. Displayed percentage points multiply these by 100 and round to two decimal places.

## Method and interpretation

For each group define success rates r0 and r1 and shares w0 and w1 of the period total. Before rate is Σw0r0; after rate is Σw1r1. Within-group contribution is Σ[(w0+w1)/2](r1−r0). Composition contribution is Σ[(r0+r1)/2](w1−w0). Their sum equals the aggregate difference exactly. Equivalently, average the contributions over the two orders of replacing rates and replacing shares. The audit shows each order and each group's contribution.

The engine uses reduced BigInt fractions for rates, weights and contributions; its residual must be exactly zero. JSON exports serialize fractions as strings and include every original label/count and explicit false flags for causal claims, significance tests and uncertainty intervals. A reversal label requires every individual rate to change strictly in the opposite direction from the aggregate; ties do not trigger it.

Rate standardization and decomposition are established methods, not an algorithm invented by this project. Background: Prithwis Das Gupta, US Census Bureau, [Standardization and Decomposition of Rates: A User's Manual](https://cdn.www.census.gov/library/publications/1993/demo/p23-186.html), 1993. Original bibliographic credit: Evelyn M. Kitagawa, [Components of a Difference Between Two Rates](https://doi.org/10.1080/01621459.1955.10501299), 1955. No external code or published dataset is embedded. The two-factor identity above is explicitly derived and tested in this implementation; no claim is made that the whole Census manual is implemented.

## Limits and safety

Use 2–12 matched groups, consistently defined across periods. Counts must be integers; each denominator must be positive, successes cannot exceed it, and combined totals cannot exceed 1,000,000 per period. Zero-denominator and missing-group rates are undefined and are rejected, not silently imputed. Normalized duplicate names and malformed Unicode are rejected. Input edits clear the old result and disable export until recalculated.

This is descriptive arithmetic. It does not identify causes, measure all confounders, validate group definitions, test significance, quantify uncertainty or recommend a medical, financial or public-policy decision. Use synthetic data; avoid personal information. Exports contain all input labels/counts and need review before sharing. Application code has no network calls, analytics or persistent storage. Inputs remain in memory unless exported.

## AI and provenance

OpenAI Codex assisted implementation, tests, explanations and design prompting. Built-in Image Gen generated a UI design concept, not a raster replacement for the working interface. The user supplied contest goals and operating constraints. All example data is synthetic. No claim is made of unaided human coding, a user study or a new statistical method. No external fonts, music, images, datasets, paid services or runtime model are embedded.

## Contest status

Local independent code, arithmetic and browser review completed. A stale detailed-audit display found during review was fixed and independently rechecked for edit, error, add, remove and successful recalculation flows. Public source: https://github.com/estona815/mixshift-stem2connect-2026 . Free demo deployment verification, actual demo-video production and hosting, event registration, saved Devpost package review, final legal assent, single-sender coordination and verified contest receipt remain separate steps. A prerecorded Demo Day presentation is an additional event obligation whose delivery instructions are still to be confirmed. This project is not QuorumGlass and contains no reused QuorumGlass source or media.
