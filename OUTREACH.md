# Outreach plan (Astro)

Astro has **GitHub Discussions disabled** on the main repo, and `withastro/roadmap`
Discussions are **only for core RFCs/Proposals** — neither is a venue for sharing a
community integration. Astro is **Discord-first**, with an official **integrations
catalog**. So outreach has two real channels, plus amplification.

---

## 1. Astro Discord — primary (community share)

**Join:** https://astro.build/chat
**Channel:** the showcase / "I made this" / integrations channel (currently `#showcase`
or `#made-with-astro` — pick the one for tools/integrations, not site showcases).

**Etiquette (matches Astro governance — authenticity + positive engagement):**
- Lead with the problem and the idea, ask for feedback — not "check out my package."
- **Disclose** you're the maintainer.
- One post, no cross-channel spamming. Engage with replies.

**Draft message:**

> Hi all — built a small Astro **image integration** and would love feedback 🙏
>
> Astro requires `alt` on every `<Image />`, but that text only lives in the rendered HTML. The moment the optimized file in `dist/_astro/` is indexed by Google Images or read by an AI crawler (ChatGPT/Perplexity/AI Overviews) *as a file*, the description is gone.
>
> **`astro-aeo-image`** wraps the default sharp service and, after sharp encodes each variant, embeds the `alt` (+ optional description/keywords) as standards **XMP** into the output file — byte-preserving, no re-encode, pixels untouched. One line:
> ```js
> integrations: [aeoImage()]
> ```
> It's an *authoring* layer (writes new descriptive metadata from the alt you already have), distinct from sharp's `keepMetadata`, which only *preserves* existing tags.
>
> Repo (MIT, provenance-published, before/after exiftool example in the README): https://github.com/vsima/astro-aeo-image
> Disclosure: I maintain it (and the zero-dep `aeo-image` writer under it). Mostly want to know — is "alt text should live in the file too" useful to others, and is the image-service-wrapper approach sound?

---

## 2. astro.build/integrations catalog — durable discoverability

The catalog at **https://astro.build/integrations/** is populated from npm. To be listed,
a package generally needs:

- [x] An **Astro integration** (default export usable in `integrations: []`) — ✅ done in v0.2.0.
- [ ] The **`astro-integration` keyword** in `package.json`. ⚠️ We *removed* this for accuracy when the package was service-only. Now that v0.2.0 ships a real integration, **re-adding `astro-integration` is correct** — the package genuinely is one. (Re-add it; it's no longer misrepresenting.)
- [ ] A clear **README** with install + usage (✅) and ideally a homepage/repo (✅).
- [ ] Submit per the current docs: **https://docs.astro.build/en/reference/publish-to-npm/** ("Publish to npm" / integration listing). Some periods require a PR to the catalog data or an automated npm-keyword crawl — check the page for the current mechanism.

**Action:** re-add `astro-integration` to keywords in a `0.2.1`, then follow the
publish-to-npm/catalog submission steps.

---

## 3. Amplification (also feeds aeo-image's own AEO)

- **Blog post / dev.to:** "Make your Astro images self-describing for AI search" — a how-to that ranks in Google and gets cited by answer engines. This is the highest-leverage discoverability move and on-thesis for the project.
- **Bluesky/X** with the `#astro` community, linking the post.
- Answer the occasional image/SEO question in Discord `#support` — genuine presence converts a "package drop" into a "community member sharing a tool" (governance values this).

---

## Sequencing

1. Ship **0.2.1** re-adding the now-accurate `astro-integration` keyword.
2. Submit to the **integrations catalog** (per publish-to-npm docs).
3. Post in **Discord** (message above).
4. Write the **blog post**, link from Discord + social.
