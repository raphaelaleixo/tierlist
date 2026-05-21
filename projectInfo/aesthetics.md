# Tierlist — Aesthetics

Decisions captured outside the standard brainstorm flow. Implementation should treat this as the visual brief alongside `rules.md`.

## Direction

**Full CRT cosplay** anchored to **golden-age arcade (1980–83)**: *Pac-Man*, *Donkey Kong*, *Galaga*, *Centipede*. We commit to the affectations — scanlines, glow, curvature, pixel typography — rather than just nodding at them.

Not the era we considered and ruled out: 16-bit fighter VS screens (don't scale past 2 players); synthwave (cinematic but not arcade-mechanical); Game Boy (limited multi-player legibility).

## Big screen (read-only — full retro commitment)

- **CRT framing:** scanlines, slight screen curvature, soft glow halo, dark bezel surround. This is the centerpiece "arcade cabinet."
- **8×8 chunky pixel sprites** and pixel typography throughout.
- **Arcade cabinet chrome:** `1UP`, `HI-SCORE`, blinking `READY`/`GAME OVER`, score readouts that tick up, animated heart icons.
- **Players as coloured pixel avatars** (ghost-style — pick from a fixed set of distinct EGA-era hues at lobby join).
- **Played cards** are pixel-framed; tier letter renders as a big chunky 8×8 sprite-style block.
- **Trick reveal:** pixel "card flip" animation per played card, in turn order. Heart pops + chiptune sting on the winner.
- **F-beats-S "upset" moment:** dedicated callout — `BONUS!` / `UPSET!` (exact word TBD), score-tick-up animation, F-card flashes. This is the marquee in-game beat.
- **End-of-game reveal:** animated walkthrough of each player's full tier list (both rounds, including the unplayed mystery card). Stretch: styled as a Pac-Man-style "intermission cutscene" — the player's pixel avatar walks across the screen revealing each tier one by one.

## Phone (interactive — pure CRT, typing-optimized)

- Same CRT styling as the big screen: scanlines, glow, dark background, pixel font on tier letters, headings, scores, status text.
- **Critical exception for input fields:** typed body content uses a modern legible sans-serif inside the otherwise-retro frame. Inputs are oversized, high-contrast (white text on dark), large tap targets. We accept the slight stylistic dissonance (modern typeface inside a CRT frame) because the typing load is real (~14 inputs per player per game) and unreadable pixel fonts on input would be a usability failure.
- **No faux hardware bezel** (ruled out arcade-cabinet panel and Game Boy framings — they eat keyboard-adjacent screen space the inputs need).
- **Tier-writing form:** 6 stacked rows, each with a chunky pixel tier-letter badge on the left and a large modern-sans input field on the right. Submit button at the bottom.
- **Hand-of-cards view (during play):** pixel-framed cards, item visible in modern-sans (so the player can read what they wrote), tier hidden as `?` or face-down pixel pattern.
- **Recap screen (8s post-write):** styled like a high-score-entry confirmation — your tier list rendered as a mini-tier-list on a black screen, then it fades out.

## Palette

- **Background:** near-black (`#000` or `#0a0a14`), with optional faint scanline overlay.
- **Player colours** (6, EGA-era saturated): exact hex values TBD. Candidate set — red, orange, yellow, green, cyan, magenta. All distinguishable on black across a room.
- **Tier colours:** TBD between two approaches — see Open Decisions.
- **Heart token:** classic arcade red (`#ff0000`-ish) — universal "life" colour, reads instantly.

## Typography

- **Pixel/bitmap font** for: tier letters, headings, scores, system text, callouts. Reference candidates: Press Start 2P (Google Fonts, web-friendly), Pixeloid, or a custom 8×8 bitmap.
- **Modern sans-serif** for: typed user content on phone (categories, tier items, items inside hand cards). Reference: system-ui, Inter, or similar.

## Sound (deferred, but planned)

Out of scope for v1 in code, but the spec should leave hooks for:

- Chiptune SFX vocabulary inspired by golden-age arcades.
- Beep on tap, slide on card play, ascending arpeggio on trick win, dramatic chord on F-beats-S upset.
- Heart-award "pop" sound, score-tick-up on score changes.
- Optional background loop, off by default.

## Animation idioms

- **Pixel card flip** for tier reveal (the per-trick reveal moment).
- **Heart icon pop** on heart award.
- **Score readout tick-up** on heart-count changes.
- **`BONUS!` / `UPSET!` callout** for F-beats-S (wording TBD).
- **Stretch: Pac-Man-style intermission cutscene** for the end-game tier-list walkthrough.

## References

- *Pac-Man* (1980), *Donkey Kong* (1981), *Galaga* (1981), *Centipede* (1981).
- *Pac-Man Championship Edition DX* (2010) — modern but faithful aesthetic reference; what "polished golden-age arcade" looks like with modern tooling.
- CGA / EGA palettes.

## Open design decisions

- **Exact player colour values** from the candidate set (final RGB hexes). Verify accessibility/contrast on dark background.
- **Tier colour mapping:** two viable approaches — (a) classic tier-list red-to-blue gradient on the tier letter itself (S=red, F=blue/purple), letting player colour identify *who*; or (b) uniform white-pixel tier letters, with player colour doing all the visual identifying. Pick one.
- **F-beats-S callout wording:** `BONUS!`, `UPSET!`, `F WINS!`, `EXTRA!`, or another arcade idiom.
- **Specific pixel font** (web-loadable, licensed, with the characters we need).
- **Big-screen background motifs:** blank black, subtle dot grid (Pac-Man-style maze hint), animated motif, or something else.
- **Intermission-cutscene scope:** how literal to go on the Pac-Man-style walkthrough — full custom pixel animation, or simpler staggered reveal?
- **Sound design scope for v1:** include or defer entirely?
