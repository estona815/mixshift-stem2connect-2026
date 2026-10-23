# MixShift

An educational tool for inspecting how a changed aggregate success rate relates to changed group rates and changed group shares. New work began on 2026-10-22 for the STEM2Connect Scientific Research track. The solo entrant is registered; this project remains a Devpost draft and has not entered the contest through final submission. No measured learning benefit, adoption or award is claimed.

## Run and reproduce

Manual entry needs no packages, build, API or credentials. Optional OCR downloads pinned Tesseract.js 7.0.0, its 7.0.0 core and the English 1.0.0 best-int model from jsDelivr; first use needs internet access. Recognition runs in the browser without uploading the image. In this directory run `python3 -m http.server 8843 --bind 127.0.0.1` and open `http://127.0.0.1:8843`. Use a modern browser with BigInt and ES modules.

Run `node --test engine.test.mjs table-import.test.mjs`. Nine tests cover exact known fractions, both replacement orders, period reversal, group ordering and splitting, invalid inputs, count boundaries and 6,561 independently calculated small two-group profiles. This is bounded synthetic validation, not proof of all possible inputs or real-world effectiveness.

For a separate Python standard-library Fraction oracle, run `python3 reference_fraction.py` with Node.js available on PATH, or supply `--node /absolute/path/to/node`. It compares eight exact fraction fields and the strict reversal flag across 15,625 exhaustive three-group profiles and 110 deterministic profiles spanning 2–12 groups (seed 20261022). All 15,735 profiles matched. The reference computes the average of the two replacement orders independently of the production half-sum expression.

The default synthetic example has Returning counts 90/100 before and 19/20 after, and First-time counts 1/10 before and 12/80 after. Both group rates rise by five percentage points, but the aggregate falls from 91/110 to 31/100. The exact split is within-group change 1/20, composition change −156/275, headline change −569/1100, all as proportions. Displayed percentage points multiply these by 100 and round to two decimal places.

## Method and interpretation

For each group define success rates r0 and r1 and shares w0 and w1 of the period total. Before rate is `Σw0r0`; after rate is `Σw1r1`. Within-group contribution is `Σ[(w0+w1)/2](r1−r0)`. Composition contribution is `Σ[(r0+r1)/2](w1−w0)`. Their sum equals the aggregate difference exactly. Equivalently, average the contributions over the two orders of replacing rates and replacing shares. The audit shows each order and each group's contribution.

The engine uses reduced BigInt fractions for rates, weights and contributions; its residual must be exactly zero. JSON exports serialize fractions as strings and include every original label/count and explicit false flags for causal claims, significance tests and uncertainty intervals. A reversal label requires every individual rate to change strictly in the opposite direction from the aggregate; ties do not trigger it.

Rate standardization and decomposition are established methods, not an algorithm invented by this project. Background: Prithwis Das Gupta, US Census Bureau, [Standardization and Decomposition of Rates: A User's Manual](https://cdn.www.census.gov/library/publications/1993/demo/p23-186.html), 1993. Original bibliographic credit: Evelyn M. Kitagawa, [Components of a Difference Between Two Rates](https://doi.org/10.1080/01621459.1955.10501299), 1955. The arithmetic engine uses no external statistical code or published dataset. The optional OCR runtime is an external dependency. The two-factor identity above is explicitly derived and tested in this implementation; no claim is made that the whole Census manual is implemented.

## Limits and safety

Use 2–12 matched groups, consistently defined across periods. Counts must be integers; each denominator must be positive, successes cannot exceed it, and combined totals cannot exceed 1,000,000 per period. Zero-denominator and missing-group rates are undefined and are rejected, not silently imputed. Normalized duplicate names and malformed Unicode are rejected. Input edits clear the old result and disable export until recalculated.

This is descriptive arithmetic. It does not identify causes, measure all confounders, validate group definitions, test significance, quantify uncertainty or recommend a medical, financial or public-policy decision. Use synthetic data; avoid personal information. Exports contain all input labels/counts and need review before sharing. The OCR option requests runtime/model files from jsDelivr; the CDN receives ordinary request metadata. Tesseract may cache model files in browser storage. Images and counts are processed locally; there is no analytics or image-upload endpoint. Inputs remain in memory unless exported.

## AI and provenance

OpenAI Codex assisted implementation, tests, explanations and design prompting. Built-in Image Gen generated a UI design concept, not a raster replacement for the working interface. The user supplied contest goals and operating constraints. All example data is synthetic. No claim is made of unaided human coding, a user study or a new statistical method. No external fonts, music, private datasets or paid inference service is used. The synthetic table image is generated locally. Tesseract.js and its neural OCR runtime perform recognition; this does not make the arithmetic analysis an AI inference or establish recognition accuracy on other images.

## OCR judge walkthrough

1. Expand Import a count-table image and choose `ocr-synthetic-table-v001.png` from this folder.
2. Select Read image. First use downloads the OCR runtime/model; wait for recognition to complete.
3. Compare the original image with the editable text. Expected rows: `Returning 90 100 19 20` and `First-time 1 10 16 80`.
4. Select Review rows, verify all eight counts, then Apply reviewed counts. The previous analysis and export become unavailable.
5. Select Analyze change. The headline is −47.73 percentage points; inspect the exact zero residual.
6. Edit a recognized number after reviewing it: Apply must become unavailable until the new text is reviewed. Ambiguous characters such as `9O` must be corrected manually.

Image limits: PNG/JPEG/WebP up to 5 MB, 10 megapixels and 4096 pixels per side. Use one single-word group label plus four integer counts per line. OCR does not infer column meaning, repair digits, validate source data or understand arbitrary table layouts.

The local browser check recognized this one clean synthetic image exactly. This is a narrow demonstration, not a general accuracy benchmark. Slow, failed or blocked model downloads are reported and manual entry remains available. Tesseract.js is Apache-2.0 licensed; see https://github.com/naptha/tesseract.js and the upstream core/data projects for their notices.

## Contest status

This is the OCR enhancement of the existing MixShift entry 1252247, not a second entry. The earlier video demonstrates manual entry and does not demonstrate OCR. Confirm that the deployed demo matches this source revision before using it for judging. Final eligibility review, updated public source/demo/video, action-time legal assent, single-sender submission and verified receipt remain outstanding. Demo Day presentation delivery is a separate event obligation.
