# Design Brief

## Direction

Civic Ledger — a clean, modern community-economy interface where earned work (Me-Coins, gold) and collective governance (We-Coins, indigo) are visually distinct at a glance, now extended with live identity, proposal status, and vote-progress surfaces.

## Tone

Professional productivity/governance: restrained, information-dense, and civic — a treasury ledger aesthetic with crisp surfaces, subtle elevation, and two unmistakable token identities.

## Differentiation

A dual-token color language — warm gold for earned Me-Coins and deep indigo for governance We-Coins — makes the economy legible instantly, with mono-font balances reinforcing the financial-ledger feel.

## Color Palette

| Token          | OKLCH (dark)  | Role                                  |
| -------------- | ------------- | ------------------------------------- |
| background     | 0.15 0.02 262 | deep civic surface                    |
| foreground     | 0.95 0.01 250 | primary text                          |
| card           | 0.19 0.022 262| elevated surface                      |
| primary        | 0.62 0.17 265 | We-Coins governance indigo            |
| accent         | 0.78 0.15 80  | Me-Coins earned gold                  |
| me-coin        | 0.78 0.15 80  | earned-work token (gold)              |
| we-coin        | 0.62 0.17 265 | governance token (indigo)             |
| status-active  | 0.62 0.17 265 | Active proposal badge (indigo)        |
| status-closed  | 0.56 0.015 255| Closed proposal badge (muted)         |
| vote-yes       | 0.62 0.17 265 | Yes vote progress (indigo)            |
| vote-no        | 0.65 0.2 25   | No vote progress (destructive red)    |
| progress-track | 0.29 0.024 262| progress bar track                    |

## Typography

- Display: Space Grotesk — headings, hero numbers, page titles
- Body: DM Sans — paragraphs, labels, UI text
- Mono: Geist Mono — token balances, amounts, Principal ID, ledger figures
- Scale: hero `text-4xl md:text-6xl font-bold tracking-tight`, h2 `text-2xl md:text-3xl font-bold tracking-tight`, label `text-xs font-semibold tracking-widest uppercase`, body `text-base`

## Elevation & Depth

Cards sit on `bg-card` with `shadow-subtle`; interactive cards lift to `shadow-elevated` on hover. Depth comes from layered surfaces, not gradients.

## Structural Zones

| Zone    | Background      | Border   | Notes                                   |
| ------- | --------------- | -------- | --------------------------------------- |
| Header  | bg-card         | border-b | sticky, brand + nav + identity chip + balances |
| Content | bg-background   | —        | alternate sections with bg-muted/30     |
| Footer  | bg-muted/40     | border-t | muted, non-interactive                  |

## Spacing & Rhythm

Section gaps `py-12 md:py-20`; card grids `gap-4 md:gap-6`; micro-spacing `space-y-2` for grouped labels. Generous padding inside cards (`p-6`) for a calm, readable density.

## Component Patterns

- Buttons: `rounded-lg`, primary = indigo (We-Coins governance), gold for Me-Coins earning actions; Vote Yes = indigo, Vote No = destructive red; hover darkens
- Cards: `rounded-xl bg-card shadow-subtle` with `border border-border/60`
- Badges: pill `rounded-full`; status via `.badge-active` (indigo) / `.badge-closed` (muted); token badges `bg-me-coin-soft text-me-coin` / `bg-we-coin-soft text-we-coin`
- Progress bars: `.progress-track` + `.progress-fill-yes` / `.progress-fill-no`, animate width on vote
- Identity: `.principal-chip` mono pill showing truncated Principal ID with copy-to-clipboard; live Me/We balances in mono

## Motion

- Entrance: `animate-fade-in-up` 0.4s on page sections
- Hover: `transition-smooth` 0.3s — lift shadow, darken button
- Decorative: subtle `fade-in` on balance updates; `progress-fill` width animates 0.5s on vote tally change

## Constraints

- Token colors only — no raw hex or arbitrary Tailwind color classes
- Me-Coins = gold, We-Coins = indigo, never swapped
- Active = indigo, Closed = muted neutral, Vote Yes = indigo, Vote No = destructive red
- Productivity restraint: no decorative gradients on surfaces, no bouncy animation
- AA+ contrast maintained in both light and dark modes

## Signature Detail

The dual-token color language — gold Me-Coins vs indigo We-Coins — carried through balances, badges, and CTAs so users always know what they earn versus what they govern, with status and vote-progress surfaces reusing the same indigo/red semantics.
