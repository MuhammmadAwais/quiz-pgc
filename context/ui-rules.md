# UI Rules

Concise rules for building the **PGC Arena** interface. Strictly follow the **Electric Obsidian Arena** specification (`DESIGN.md`).

---

## Typography Pairing

1. **Inter (`font-sans`)**: Reserved for:
   - Page navigation and brand headers
   - Question prompts and option text
   - Form inputs, modal copy, and settings controls
   - Section subheadings

2. **JetBrains Mono (`font-mono`)**: Strictly enforced for:
   - Live score boards (`tabular-nums`, 72px desktop / 44px mobile)
   - Round timers and countdown clocks
   - Telemetry tags, chips, and question counters (`Q 03 / 10`)
   - Option indicators (`[A]`, `[B]`, `[C]`, `[D]`)

```tsx
// Score Board Example
<div className="font-mono text-7xl font-extrabold tracking-tight tabular-nums text-optic-white">
  {score}
</div>
```

---

## Projector Safety & Layout Constraints

Live stage projector setups require strict layout and contrast safeguards:

1. **2.5rem (40px) Margin Boundary (`p-10` or `px-10 py-8`)**:
   - Every projector view must respect a 40px perimeter margin to prevent clipping caused by lens overscan or keystone adjustments on stage.

2. **30-Foot Viewing Range Rule**:
   - Questions must be legible from 30+ feet away under ambient stage lights.
   - Question prompts: minimum `text-2xl` (24px) or `text-3xl` (30px) with `leading-relaxed font-semibold text-optic-white`.
   - Option cards: minimum `text-lg` (18px) or `text-xl` (20px) with high contrast.
   - Scores: `text-6xl` to `text-7xl font-extrabold`.

3. **No Low-Contrast Grays**:
   - Never use low-contrast text colors (`text-zinc-600`, `text-gray-500`) for meaningful data.
   - Text colors must be `#FFFFFF` (optic white), `#F1F5F9` (bright slate), or `#E2E8F0` (high contrast).

4. **Zero Traffic-Light Colors**:
   - Never use standard green (`#22c55e`), red (`#ef4444`), or yellow (`#eab308`).
   - Use **Electric Ice Cyan (`#22D3EE`)** for correct answers and score increases.
   - Use **Luminous Rose-Pink (`#E11D48`)** for misses, timeouts, or errors.

---

## Component Visual Rules

### 1. Structural Cards
- Background: `bg-surface-carbon` (`#1B1A26`)
- Border: `border border-white/10`
- Radius: `rounded-lg` (`0.5rem` / 8px)
- Padding: `p-6`

### 2. Live Match Option Cards
- Grid: 2 columns × 2 rows grid on desktop stage display.
- Layout: Recessed container with letter badge (`[A]`, `[B]`, `[C]`, `[D]`) in `JetBrains Mono`.
- Idle State: `bg-surface-carbon border border-white/10 text-bright-slate hover:bg-surface-interactive hover:border-white/25`.
- Selected Correct State: `border-state-success bg-state-success/10 text-optic-white glow-success`.
- Selected Miss State: `border-state-warning-rose bg-state-warning-rose/10 text-optic-white glow-miss`.

### 3. Team Score Podiums
- **Team A Pod**:
  - Border accent: `border-team-a-core/40`
  - Active turn glow: `glow-team-a`
  - Name badge: `text-team-a-bright font-mono uppercase tracking-widest`
  - Score display: Optic white 72px `JetBrains Mono`
- **Team B Pod**:
  - Border accent: `border-team-b-cyan/40`
  - Active turn glow: `glow-team-b`
  - Name badge: `text-team-b-ice font-mono uppercase tracking-widest`
  - Score display: Optic white 72px `JetBrains Mono`

### 4. Interactive Buttons
- **Team A Action**: `bg-team-a-core hover:bg-team-a-bright text-surface-obsidian font-semibold rounded-md px-5 py-2.5 transition-all`.
- **Team B Action**: `bg-team-b-cyan hover:bg-team-b-ice text-surface-obsidian font-semibold rounded-md px-5 py-2.5 transition-all`.
- **Console Trigger (Neutral)**: `bg-surface-carbon border border-white/20 hover:border-white/40 text-optic-white font-medium rounded-md px-4 py-2 transition-all`.

### 5. Chips & Badges
- Uppercase `font-mono text-xs font-bold tracking-wider rounded px-2.5 py-1 border`.
- Success: `bg-state-success/15 border-state-success text-state-success`
- Miss: `bg-state-warning-rose/15 border-state-warning-rose text-state-warning-rose`
- Team A: `bg-team-a-core/15 border-team-a-core text-team-a-bright`
- Team B: `bg-team-b-cyan/15 border-team-b-cyan text-team-b-ice`
- Neutral: `bg-surface-onyx border-white/15 text-text-high-contrast`

### 6. Sudden-Death Mystery Box
- 3D-styled carbon box with numeric index in `JetBrains Mono`.
- Unrevealed: `bg-surface-carbon border-2 border-white/20 hover:border-team-a-bright hover:scale-105 transition-transform cursor-pointer`.
- Opened: Displays subject tag and reveals the sudden death question prompt.
