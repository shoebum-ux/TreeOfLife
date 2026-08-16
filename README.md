# Studio Kudrat

The website for [Studio Kudrat](https://www.studiokudrat.com) — an independent creative studio building experiences inspired by nature, and home to the **Kudrat** live music project.

A static, dependency-free site. No build step, no framework, no package manager.

## Structure

```
index.html      # Page markup — header, hero, music, studio, tree canvas, footer
style.css       # All styling, including four responsive breakpoints
script.js       # HeroMouseTrail, RevealPainter, FilmLightbox, audio toggle
Assets/         # Leaf and blossom PNGs used by the hero trail
Assets/music/   # YouTube thumbnails for the featured films
```

## Sections

**Hero** — Leaves trail the cursor across the landing area. `HeroMouseTrail` drops a random PNG from `Assets/` every 150ms, each fading out over 2s. Centering is handled in CSS (`translate(-50%, -50%)`) so it stays accurate at every breakpoint.

**Live Music** — The featured films. Each uses a *facade*: a local thumbnail is shown, and YouTube's player is only injected when clicked, so no third-party script loads on page view. Handled by `FilmLightbox`, which closes on Escape, backdrop click, or the close button, and removes the iframe to stop playback.

**Tree of Life** — The signature interaction. Two stacked canvases: `baseCanvas` builds a faint watercolor tree from 150 bleeding blobs over 3 seconds, then `revealCanvas` paints full color in under the cursor using five offset bleed rings per stroke. An IntersectionObserver resets it when scrolled out of view so it re-blooms on each visit. Double-click restarts the animation.

**Audio** — A nature-sound loop, off by default, toggled from the header.

## Adding a film

1. Save the thumbnail to `Assets/music/<videoId>.jpg`:
   `curl -o "Assets/music/<videoId>.jpg" "https://i.ytimg.com/vi/<videoId>/maxresdefault.jpg"`
2. Copy a `.film-card` block in `index.html` and update `data-video-id`, `data-video-title`, the `img` src and alt, plus the title and meta line.

## Type and color

Both live as custom properties at the top of `style.css`.

Type is **fluid** — every size is a `clamp()` that interpolates with the viewport, so there are no per-breakpoint font-size rules and nothing collapses to an unreadable size on a phone. Change `--fs-display`, `--fs-title`, and friends to retune the whole scale. Media queries handle layout only.

Lime (`--lime`) is a brand accent, not a background. It appears as the marker underline behind `<mark>`, on link hover, and in text selection. `--accent` is a deeper leaf green for small structural marks — the segment on the section rule, focus rings — where lime is too pale to read against paper.

## Local development

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173. Opening `index.html` via `file://` mostly works, but Instagram embeds and video need a real origin.

## Deployment

Vercel serves `www.studiokudrat.com` from the `main` branch of this repo — merging to `main` deploys to production. GitHub Pages is also still enabled for the repo but is an unused leftover, not the production host.
