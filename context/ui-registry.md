# UI Registry

Living document for **PGC Arena**. Updated after every UI component is built. Read this before building any new component — match existing patterns exactly before inventing new ones.

---

## How to Use

Before building any component:
1. Check if a similar component already exists here.
2. If yes — match its exact classes and tokens.
3. If no — build it following `ui-rules.md` and `ui-tokens.md`, then add it here.

After building any component — run `/imprint` to record the component name, file path, and exact classes used.

---

## Components

| Component | Path | Key Tokens & Classes | Purpose |
|---|---|---|---|
| `Navbar` | `components/layout/Navbar.tsx` | `bg-surface-obsidian/90 backdrop-blur-md border-b border-border-subtle px-6 py-3.5` | Top global navigation bar |
| `Button` | `components/ui/Button.tsx` | `font-sans font-semibold rounded-md transition-all active:scale-[0.98]` | Reusable button (`team-a`, `team-b`, `console`, `danger`, `ghost`) |
| `Card` | `components/ui/Card.tsx` | `bg-surface-carbon border border-border-subtle shadow-obsidian-card rounded-lg p-6` | Standard structural container |
| `Badge` | `components/ui/Badge.tsx` | `label-caps px-2.5 py-0.5 rounded border` | JetBrains Mono telemetry & status chips |
| `Input` | `components/ui/Input.tsx` | `bg-surface-obsidian border border-white/20 text-optic-white rounded-md px-4 py-2.5 focus:border-team-a-core` | Form text fields |
| `Modal` | `components/ui/Modal.tsx` | `bg-surface-carbon border border-border-medium rounded-xl shadow-modal-dialog p-6 animate-fade-in` | Telemetry dialog container |
| `TeamPodium` | `components/live-match/TeamPodium.tsx` | `score-display label-caps bg-surface-carbon border-2 border-team-a-core glow-team-a rounded-xl p-6` | Stage score displays |
| `OptionCard` | `components/live-match/OptionCard.tsx` | `text-body-xl bg-surface-carbon border border-white/10 glow-success glow-miss rounded-xl p-5 cursor-pointer` | Live MCQ option choice |
| `StageHeader` | `components/live-match/StageHeader.tsx` | `border-b border-white/10 pb-6 px-10` | Active subject, round, and turn display |
| `MysteryBoxGrid` | `components/live-match/MysteryBoxGrid.tsx` | `border-2 bg-surface-carbon hover:border-white/40 rounded-xl h-36` | Sudden-death mystery boxes |
| `WinnerCelebration` | `components/live-match/WinnerCelebration.tsx` | `bg-surface-carbon border border-white/20 rounded-2xl shadow-modal-dialog p-8 md:p-12` | Grand victory podium with confetti VFX |
