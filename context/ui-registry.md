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
| `Navbar` | `components/layout/Navbar.tsx` | `bg-surface-obsidian/90 backdrop-blur-md border-b border-white/10 px-6 py-4` | Top global navigation bar |
| `Button` | `components/ui/Button.tsx` | `font-sans font-semibold rounded-md transition-all active:scale-95` | Reusable button (Violet, Cyan, Console) |
| `Card` | `components/ui/Card.tsx` | `bg-surface-carbon border border-white/10 rounded-lg p-6` | Standard structural container |
| `Badge` | `components/ui/Badge.tsx` | `font-mono text-xs uppercase font-bold tracking-wider rounded px-2.5 py-1` | Telemetry & status chips |
| `Input` | `components/ui/Input.tsx` | `bg-surface-obsidian border border-white/20 text-optic-white rounded-md px-4 py-2.5 focus:border-team-a-core` | Form text fields |
| `TeamPodium` | `components/live-match/TeamPodium.tsx` | `bg-surface-carbon border border-white/10 rounded-xl p-8` | Stage score displays |
| `OptionCard` | `components/live-match/OptionCard.tsx` | `bg-surface-carbon border border-white/10 rounded-lg p-5 cursor-pointer` | Live MCQ option choice |
| `StageHeader` | `components/live-match/StageHeader.tsx` | `border-b border-white/10 pb-4 px-10` | Active subject, round, and turn display |
