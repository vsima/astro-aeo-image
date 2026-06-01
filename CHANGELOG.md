# Changelog

## [0.1.1] - 2026-06-01

### Added
- README: concrete before/after `exiftool` example showing embedded metadata.

### Changed
- First release published via GitHub Actions with **npm provenance**.

## [0.1.0] - 2026-06-01

Initial release. Astro image service that embeds `<Image>` alt text (and
optional description/keywords/title) as XMP into optimized output files,
wrapping Astro's default sharp service. Byte-preserving via `aeo-image`.
