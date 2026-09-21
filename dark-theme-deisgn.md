---
name: Deep Slate & Petroleum Matrix
colors:
  surface: '#0b141b'
  surface-dim: '#0b141b'
  surface-bright: '#313a42'
  surface-container-lowest: '#060f16'
  surface-container-low: '#141d23'
  surface-container: '#182127'
  surface-container-high: '#222b32'
  surface-container-highest: '#2d363d'
  on-surface: '#dae4ed'
  on-surface-variant: '#c0c7cd'
  inverse-surface: '#dae4ed'
  inverse-on-surface: '#283139'
  outline: '#8a9297'
  outline-variant: '#41484c'
  surface-tint: '#9acdea'
  primary: '#9acdea'
  on-primary: '#003548'
  primary-container: '#124e66'
  on-primary-container: '#8bbeda'
  inverse-primary: '#2f647d'
  secondary: '#b1cbd0'
  on-secondary: '#1c3438'
  secondary-container: '#354d51'
  on-secondary-container: '#a3bdc2'
  tertiary: '#bcc8d6'
  on-tertiary: '#27313c'
  tertiary-container: '#3f4a55'
  on-tertiary-container: '#adb9c7'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c1e8ff'
  primary-fixed-dim: '#9acdea'
  on-primary-fixed: '#001e2b'
  on-primary-fixed-variant: '#0f4c64'
  secondary-fixed: '#cde7ed'
  secondary-fixed-dim: '#b1cbd0'
  on-secondary-fixed: '#051f23'
  on-secondary-fixed-variant: '#334b4f'
  tertiary-fixed: '#d8e4f2'
  tertiary-fixed-dim: '#bcc8d6'
  on-tertiary-fixed: '#111d27'
  on-tertiary-fixed-variant: '#3d4853'
  background: '#0b141b'
  on-background: '#dae4ed'
  surface-variant: '#2d363d'
typography:
  display-hero:
    fontFamily: Inter
    fontSize: 72px
    fontWeight: '800'
    lineHeight: 80px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Inter
    fontSize: 38px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 44px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md-mobile:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: 0em
  title-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: 0em
  title-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: 0.01em
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0.01em
  label-numeric-lg:
    fontFamily: Inter
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 60px
    letterSpacing: -0.01em
  label-uppercase:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.12em
  label-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 2.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system delivers a focused, competition-grade dark visual environment engineered specifically for zero-latency live tournament broadcasts and massive auditorium projector throws. It addresses the optical challenges of large-scale projection: light bleed, chromatic wash-out, contrast loss in ambient auditorium lighting, and distant legibility from the back rows of an auditorium.

### Design Style & Atmosphere
- **Aesthetic Movement:** Technical Minimalism crossed with Petroleum Tonalism. Sharp, authoritative, and frictionless.
- **Audience & Context:** Collegiate teams, stage arbiters, and an audience viewing 150-inch-plus projection screens. Every element must be discernible in peripheral vision within a fraction of a second.
- **Emotional Response:** High stakes, intellectual rigor, unflinching technological stability, and refined stage presence.
- **Anti-Fatigue Dark Stance:** Light backgrounds on stage flood the hall with ambient lumens, washing out faces and stage spotlights. This design system keeps projection black levels deep and stable using mineral slate bases, punching through with high-luminosity mist typography and luminous petroleum accents.

## Colors

The palette is derived strictly from the mineral-slate spectrum, balancing high-absorption backgrounds with luminous visual beacons.

### Swatch Mapping & Roles
- **Background Deep Neutral (`#212A31` / `#161C22`):** Ground-level viewport canvas. Eliminates projector grey glare while retaining deep color tonality.
- **Surface Container Base (`#2E3944`):** Card panels, question blocks, and leaderboard tiers. Provides clear physical containment without requiring white-hot light borders.
- **Primary Brand Accent (`#124E66`):** The signature petroleum cyan. Anchors primary actions, current question cards, active team podium markers, and focused states.
- **Mineral Sage Border & Secondary (`#748D92`):** Structural borders, secondary badges, inactive option outlines, and subtitled metadata.
- **Platinum Mist (`#D3D9D4`) & Optic White (`#FFFFFF`):** Dominant foreground typography, question copy, and metric readouts that punch cleanly through auditorium distance.

### Semantic Tones (Auditorium-Safe)
In place of oversaturated neon reds and greens that blast projector color wheels, use refined mineral tones:
- **Success / Verified Correct:** `#1A6B72` (Deep Emerald Teal) with `#98E4D6` text/border.
- **Error / Eliminated:** `#7C3B3F` (Muted Cinnabar Slate) with `#F5C2C4` text/border.
- **Timer Warning:** `#876332` (Deep Amber Ochre) with `#F8DCAC` indicator.

## Typography

Inter powers the system across all tiers to guarantee high legibility, robust optical weights, and consistent character width rendering.

### Projection Rules
- **Tabular Figures (`font-feature-settings: "tnum" 1`):** Mandatory for all countdown clocks, match scores, millisecond round markers, and leaderboard ranks to eliminate visual jitter during real-time tick events.
- **Mist vs. White Hierarchy:** Use `#FFFFFF` exclusively for active questions, timers, and leading scores. Use `#D3D9D4` for answer choice bodies and column titles. Inactive, secondary, or past round telemetry defaults to `#748D92`.
- **Micro-Labels:** Metadata chips and stage status tags must be set in uppercase with extra letter spacing (`0.12em`) to guarantee crisp rendering even on standard resolution beamers.

## Layout & Spacing

The architecture operates on an 8pt modular grid structured for large aspect-ratio cinema screens (16:9 and 16:10 projectors) down to arbiter tablets.

### Layout Model
- **Stage Display (16:9 1080p / 4K):** Dual-zone layout. The primary 8-column canvas is reserved for the live active query, answer choices, and real-time response bars. The remaining 4 columns display the running tournament bracket, countdown speedometer, and podium matrix.
- **Stage Margins:** A strict `2.5rem` (40px) outer edge margin shields UI boundaries from physical auditorium projector clipping and keystoning tolerances.
- **Rhythm & Density:** Generous internal card spacing (`space-lg` to `space-xl`) isolates multi-choice options to prevent visual conflation when viewed from auditorium distances of 30+ meters.

## Elevation & Depth

This design system eschews typical drop shadows, which turn muddy on projected screens. Instead, depth is structured through calibrated luminance tiers and petroleum-tinted boundary luminescence.

### Depth Hierarchy
- **Level 0 (Canvas Base):** Deepest slate `#1B2228` with `#212A31`.
- **Level 1 (Structural Cards / Arena Paneling):** Surface container `#2E3944` bounded by a 1px solid stroke in `#748D92` at 30% opacity (`rgba(116, 141, 146, 0.3)`).
- **Level 2 (Active Stage Element / Focused Question):** Surface `#124E66` at 35% fill combined with a solid `#124E66` edge stroke.
- **Level 3 (Spotlight / Buzzer Triggered State):** A sharp inner edge highlight using `#D3D9D4` and a high-focus petroleum cyan outer glow: `box-shadow: 0 0 24px rgba(18, 78, 102, 0.6)`.

## Shapes

The interface embraces a disciplined, industrial-precision radius language (`roundedness: 1`).

- **Containers & Question Cards:** Compact 4px (`rounded-sm`) to 8px (`rounded-lg`) corner radii convey precision instrument engineering.
- **Status Pills & Micro-Indicators:** 4px radius retain rectangular stability without soft, toy-like roundness.
- **Sharp Contrast Breaks:** Crisp 45-degree chamfers are reserved for competition rank plates and stage status badges to underline competitive intensity.

## Components

### Buttons & Interactive Podiums
- **Primary Stage CTA / Buzzer Armed:** Surface filled with `#124E66`, 1.5px boundary in `#748D92`, text in pure `#FFFFFF`. On state activation or lock-in, background lifts to `#1B6989` paired with an external `0 0 16px rgba(18, 78, 102, 0.8)` projection halo.
- **Secondary / Pass Option:** Background in `#2E3944`, 1px boundary in `#748D92` at 40% opacity, text in `#D3D9D4`. Hover/Focus shifts stroke to 100% `#748D92`.

### Quiz Multiple-Choice Cards
- Built on `#2E3944` background containers with an 8px radius.
- Option keys (A, B, C, D) are enclosed in a solid square chip (`#212A31`) with `#D3D9D4` bold labels.
- Selected state activates a `#124E66` inner boundary and an accent wash across the container.
- Correct state activates `#1A6B72` container highlighting, while incorrect answers dim down to `#1C242B` with 40% opacity text.

### Leaderboard & Ranking Strip
- Highly compact rows featuring `#2E3944` backgrounds alternate with subtle `#212A31` stripes.
- Numeric ranks use `label-numeric-lg` styling in `#D3D9D4`. First-place rank is highlighted with an accent border in `#124E66` and an optic white score.

### Countdown Timer Bar & HUD
- A full-bleed progress track in `#212A31` carrying a 6px active gauge bar in `#124E66`.
- Below 5 seconds, the gauge transitions cleanly to mineral amber `#876332` with an ambient glow to signal urgency without blinding the room.

### Input Fields & Arbiter Controls
- Recessed inputs with `#1B2228` fills and 1px borders using `#748D92` (50% opacity).
- Active cursor and input focus brings the border to solid `#124E66` with high-contrast `#FFFFFF` text entry.