# UI Tokens

Design tokens for **PGC Arena** extracted from the **Electric Obsidian Arena** specification (`DESIGN.md`). Use these exact values throughout the codebase — never hardcode raw hex values or arbitrary utility colors in components.

---

## How to Use

This project uses **Tailwind CSS v4**. All design tokens are defined using the `@theme` directive in `app/globals.css`. No `tailwind.config.ts` file is used.

Tailwind v4 automatically maps `--color-*` variables to utility classes:

- `--color-surface-obsidian` → `bg-surface-obsidian`, `text-surface-obsidian`
- `--color-surface-onyx` → `bg-surface-onyx`, `border-surface-onyx`
- `--color-surface-carbon` → `bg-surface-carbon`, `border-surface-carbon`
- `--color-surface-interactive` → `bg-surface-interactive`
- `--color-team-a-core` → `bg-team-a-core`, `text-team-a-core`, `border-team-a-core`
- `--color-team-b-cyan` → `bg-team-b-cyan`, `text-team-b-cyan`, `border-team-b-cyan`
- `--color-state-success` → `text-state-success`, `border-state-success`
- `--color-state-warning-rose` → `text-state-warning-rose`, `border-state-warning-rose`

```tsx
// Correct — uses generated utility tokens
<div className="bg-surface-carbon border border-white/10 text-optic-white rounded-lg p-6">
  <span className="text-team-a-core font-mono text-sm tracking-wider">TEAM A</span>
</div>

// Never — hardcoded hex values or generic colors
<div className="bg-[#1B1A26] text-purple-500 border-red-500">
```

---

## globals.css — Complete Token Definition

```css
@import "tailwindcss";

@theme {
  /* Typography */
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  /* Surfaces & Substrates */
  --color-surface-obsidian: #0A0A0F;
  --color-surface-onyx: #12111A;
  --color-surface-carbon: #1B1A26;
  --color-surface-interactive: #262436;

  /* Text Tiers */
  --color-text-optic-white: #FFFFFF;
  --color-text-bright-slate: #F1F5F9;
  --color-text-high-contrast: #E2E8F0;
  --color-text-muted-slate: #94A3B8;

  /* Team A — Electric Violet */
  --color-team-a-core: #8B5CF6;
  --color-team-a-bright: #A78BFA;
  --color-team-a-deep: #7C3AED;

  /* Team B — Bright Cyan & Coral Accent */
  --color-team-b-cyan: #06B6D4;
  --color-team-b-ice: #38BDF8;
  --color-team-b-coral: #FB923C;

  /* Status Architecture (Zero Green, Red, Yellow) */
  --color-state-success: #22D3EE;
  --color-state-success-indigo: #818CF8;
  --color-state-warning-rose: #E11D48;
  --color-state-warning-plum: #BE185D;

  /* Projector Edge Boundaries */
  --color-border-subtle: rgba(255, 255, 255, 0.08);
  --color-border-medium: rgba(255, 255, 255, 0.16);
  --color-border-bright: rgba(255, 255, 255, 0.35);

  /* Radius */
  --radius-sm: 0.125rem;  /* 2px */
  --radius-md: 0.25rem;   /* 4px - standard buttons/inputs */
  --radius-lg: 0.5rem;    /* 8px - modules/question bays */
  --radius-full: 9999px;  /* pills & indicators */
}

/* Custom Stage Volumetric Shadows & Glows */
.glow-team-a {
  box-shadow: 0 0 36px -4px rgba(139, 92, 246, 0.45);
}

.glow-team-b {
  box-shadow: 0 0 36px -4px rgba(6, 182, 212, 0.45);
}

.glow-success {
  box-shadow: 0 0 36px -4px rgba(34, 211, 238, 0.45);
}

.glow-miss {
  box-shadow: 0 0 36px -4px rgba(225, 29, 72, 0.45);
}
```

---

## Token Reference Table

| Category | Token Variable | Value | Role |
|---|---|---|---|
| Surface | `--color-surface-obsidian` | `#0A0A0F` | Baseline canvas absorbing ambient venue light |
| Surface | `--color-surface-onyx` | `#12111A` | Structural arena bays and team podium backdrops |
| Surface | `--color-surface-carbon` | `#1B1A26` | Elevated question bay & interactive option cards |
| Surface | `--color-surface-interactive`| `#262436` | Hovered cards, input slots, focused wells |
| Text | `--color-text-optic-white` | `#FFFFFF` | Primary headers, active question prompts, scores |
| Text | `--color-text-bright-slate` | `#F1F5F9` | Option descriptions, subtitle copy |
| Text | `--color-text-high-contrast`| `#E2E8F0` | Telemetry tags, chips, secondary labels |
| Team A | `--color-team-a-core` | `#8B5CF6` | Team A indicator, active lockout banner, primary button |
| Team A | `--color-team-a-bright` | `#A78BFA` | Team A border highlight, hover glow |
| Team B | `--color-team-b-cyan` | `#06B6D4` | Team B indicator, active lockout banner, cyan button |
| Team B | `--color-team-b-ice` | `#38BDF8` | Team B border highlight, hover glow |
| Status | `--color-state-success` | `#22D3EE` | Correct answer validation, point awards |
| Status | `--color-state-warning-rose`| `#E11D48` | Miss state, time expiry, incorrect selection |
| Border | `border-white/10` | `rgba(255,255,255,0.1)` | Structural card boundaries |
| Border | `border-white/20` | `rgba(255,255,255,0.2)` | Interactive control boundaries |
