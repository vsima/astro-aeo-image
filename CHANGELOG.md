# Changelog

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
