# Changelog

## [0.4.0] - 2026-06-11

### Added
- Pass-through for **IPTC 2025.1 AI-generation provenance** props on `<Image>`:
  `ai` object (or flat `aiPrompt`/`aiPromptWriter`/`aiSystem`/`aiSystemVersion`)
  and `digitalSourceType` (`Iptc4xmpExt:DigitalSourceType`; accepts a full IRI
  or a bare CV term like `"trainedAlgorithmicMedia"`). New `aiGenerated`
  boolean shorthand sets trainedAlgorithmicMedia. Re-exports
  `DIGITAL_SOURCE_TYPE` from aeo-image. Requires aeo-image ^1.2.0.

### Fixed
- `propertiesToHash` now includes the attribution/licensing props from v0.3.0
  and the new AI props, so they survive into `transform()` on the
  on-demand/SSR image path (previously only alt/description/keywords/title
  were hashed).


## [0.3.1] - 2026-06-01

### Added
- README "Standards" section: Adobe XMP, IPTC Photo Metadata Standard 2025.1
  (descriptive/accessibility/rights subset) + DC/Adobe/PLUS; links aeo-image's
  conformance notes. Docs only.


## [0.3.0] - 2026-06-01

### Added
- Pass-through for attribution + **Google Licensable** props on `<Image>`:
  `creator`, `credit`, `rights`, `copyrightNotice`, `licenseUrl`
  (`xmpRights:WebStatement`), and `licensor` (IPTC PLUS `plus:Licensor`; accepts
  object `{url, name}` or flat `licensorUrl`/`licensorName`). Requires aeo-image ^1.1.0.


## [0.2.2] - 2026-06-01

### Changed
- Docs accuracy: reframed claims to what's spec-backed. Google Images reads &
  recommends embedding IPTC metadata (cited); HTML `alt` drives ranking, so
  embedding complements it (durability/accessibility/attribution); AI-engine
  consumption is forward-looking. Removed the internal outreach notes from the repo.


## [0.2.1] - 2026-06-01

### Changed
- Re-added the `astro-integration` keyword (plus `withastro`). Now accurate as
  of v0.2.0, which ships a real Astro integration — required for the
  astro.build/integrations catalog. Added OUTREACH.md (Discord + catalog plan).


## [0.2.0] - 2026-06-01

### Added
- **Astro Integration API** — the package's default export is now an integration,
  so setup is one line: `integrations: [aeoImage()]`. This is the recommended
  usage and makes the package discoverable as a true Astro integration.
- `astro-aeo-image/service` export — the image service is still available
  directly for advanced setups (`image.service.entrypoint`).

### Changed
- **Breaking (pre-1.0):** the default export changed from the image service to
  the integration. If you previously used
  `image: { service: { entrypoint: "astro-aeo-image" } }`, switch to either
  `integrations: [aeoImage()]` or `entrypoint: "astro-aeo-image/service"`.


## [0.1.2] - 2026-06-01

### Changed
- Removed the inaccurate `astro-integration` npm keyword. This package is an
  Astro **image service** (configured via `image.service.entrypoint`), not an
  Astro Integration (the `integrations: []` hooks API). Kept `astro-image-service`.


## [0.1.1] - 2026-06-01

### Added
- README: concrete before/after `exiftool` example showing embedded metadata.

### Changed
- First release published via GitHub Actions with **npm provenance**.

## [0.1.0] - 2026-06-01

Initial release. Astro image service that embeds `<Image>` alt text (and
optional description/keywords/title) as XMP into optimized output files,
wrapping Astro's default sharp service. Byte-preserving via `aeo-image`.
