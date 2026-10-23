# OCR dependencies

MixShift dynamically loads Tesseract.js 7.0.0 and tesseract.js-core 7.0.0 from jsDelivr, plus @tesseract.js-data/eng 1.0.0 (4.0.0_best_int). They are external runtime dependencies, not code authored by this project.

- Tesseract.js: https://github.com/naptha/tesseract.js — Apache-2.0; upstream LICENSE and NOTICE govern the package.
- WebAssembly core: https://github.com/naptha/tesseract.js-core — see upstream licensing and included notices for Tesseract and Leptonica.
- English recognition data: https://github.com/naptha/tessdata — see upstream trained-data distribution notices.

This release does not vendor or modify these dependencies. Versioned CDN URLs are in ocr-input.mjs. First use requires network access; browser caches may retain model files. CDN requests disclose ordinary connection/request metadata, not the selected image contents. The sample count-table PNG is a locally generated synthetic test fixture.
