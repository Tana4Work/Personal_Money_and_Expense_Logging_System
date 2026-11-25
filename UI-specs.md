---
version: "2.0"
name: "PMELS Charcoal"
description: "Dark, minimalist design system for the Personal Money and Expense Logging System. Adapted from the 'Estilo de Inteligência Generativa' design.md for a private finance tracker: calm surfaces, one green accent, monospace money."
colors:
  primary: "#00A67E"          # accent: primary actions, active nav, focus ring
  primary-hover: "#1DB88F"    # lighter on hover; dark text stays 6.37:1
  primary-text: "#2BC79C"     # links and ghost-button text (at least 5.87:1 on every dark surface)
  on-primary: "#202124"       # text on primary (5.18:1); the source's #F0F0F0 is 2.73:1 and fails AA
  background: "#202124"       # app background (charcoal)
  surface: "#2A2B2E"          # cards, panels, table rows
  surface-raised: "#323336"   # inputs, menus, hover rows
  border: "#3C3D41"
  text: "#F0F0F0"             # body text (14.13:1 on background)
  text-muted: "#9AA0A6"       # secondary text and captions (6.10:1)
  positive: "#81C995"         # money in, credit, success (8.22:1); replaces #00FF00
  negative: "#F28B82"         # debt, errors, rejected (6.74:1)
  warning: "#FDD663"          # archived and caution (11.48:1)
  accent: "#CE93D8"           # rare emphasis such as a loan badge (6.74:1); replaces #800080, which is 1.71:1 on charcoal
  light-surface: "#FFFFFF"    # light theme only, not in Sprint 2 scope
typography:
  display:
    fontFamily: Inter
    fontSize: clamp(1.75rem, 3vw, 2.25rem)
    fontWeight: 700
    letterSpacing: -0.01em
  h1:
    fontFamily: Inter
    fontSize: 2.25rem
    fontWeight: 700
  h2:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: 600
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    lineHeight: 1.6
    fontWeight: 400
  label:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: 500
    letterSpacing: 0.01em
  money:
    fontFamily: JetBrains Mono
    fontSize: 1rem
    fontWeight: 500
    fontVariantNumeric: tabular-nums
rounded:
  sm: 8px
  md: 16px
  lg: 24px
spacing:
  unit: 8px
  scale: [4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px]
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
    padding: 12px 16px
    fontWeight: 600
  button-ghost:
    backgroundColor: transparent
    borderColor: "{colors.border}"
    textColor: "{colors.primary-text}"
    rounded: "{rounded.sm}"
  button-danger:
    backgroundColor: transparent
    borderColor: "{colors.negative}"
    textColor: "{colors.negative}"
    rounded: "{rounded.sm}"
  card:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.border}"
    rounded: "{rounded.sm}"
    shadow: 0 2px 8px rgba(0,0,0,0.08)
  input:
    backgroundColor: "{colors.surface-raised}"
    borderColor: "{colors.border}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    focusRing: 2px solid {colors.primary}, offset 2px
---

# UI Specification: PMELS Charcoal (v2.0)

**Status:** this is the **target design for Issue 06** (`SP2-06-ui/sprint2-screens`). It takes effect only when Issue 06 merges.

**Until then, follow v1.0.** The implemented Sprint 1 "Zen Green" UI is specified in [`UI-specs-v1.0.md`](UI-specs-v1.0.md). All work before Issue 06, including any UI touched by Issues 01 to 05, follows v1.0. Do not apply PMELS Charcoal tokens or components early. Issue 06 then moves the whole client to v2.0 in one change and updates the "Implementation status" section.

**Source:** adapted from `design.md` "Estilo de Inteligência Generativa" (designmd.app). Every change from that source is listed under **Deviations from the source design**.

## Overview

PMELS is a private, multi-user money tracker. The interface has three jobs: show balances and debt correctly, make recording a transaction quick, and make rejected actions obvious. The design is calm and dark-first:

- one charcoal background;
- slightly raised cards;
- one green accent for actions;
- all money in a monospace face, so columns of figures line up.

- Density: 4/10. Airier than a spreadsheet, but tables still show 10–20 rows without scrolling on a laptop.
- Variance: 3/10. Restrained, with one layout pattern per screen type.
- Motion: 3/10. Subtle, with feedback motion only and no decoration.

- **Style:** minimalist, modern, trustworthy.
- **Light/Dark:** dark is the default and the only theme required in Sprint 2. A light theme using `light-surface` is optional later work.

## Colors

| Token | Hex | Use | Contrast on its surface |
|---|---|---|---|
| `primary` | `#00A67E` | Primary button fill, active nav indicator, focus ring (not used for text) | 5.18:1 on `background`, at least 3:1 as a UI indicator on every surface |
| `primary-hover` | `#1DB88F` | Primary button hover fill | 6.37:1 with `on-primary` |
| `primary-text` | `#2BC79C` | Links and ghost-button text | 7.48 / 6.57 / 5.87:1 on background / surface / raised |
| `on-primary` | `#202124` | Text and icons on `primary` buttons | 5.18:1 |
| `background` | `#202124` | App background | — |
| `surface` | `#2A2B2E` | Cards, panels, tables | — |
| `surface-raised` | `#323336` | Inputs, dropdowns, hovered rows | — |
| `border` | `#3C3D41` | 1px strokes and dividers | — |
| `text` | `#F0F0F0` | Body text, headings, figures | 14.13:1 |
| `text-muted` | `#9AA0A6` | Captions, column headers, helper text | 6.10:1 |
| `positive` | `#81C995` | Money in, credit balances, success toasts | 8.22:1 |
| `negative` | `#F28B82` | Debt, money out in history, errors, rejected actions | 6.74:1 |
| `warning` | `#FDD663` | Archived badge, caution notes | 11.48:1 |
| `accent` | `#CE93D8` | Loan badges and rare emphasis | 6.74:1 |

**Money color rule.** Color never carries meaning by itself:

- An amount always shows a sign or label as well, for example `−2,000.00` or `Owed 600.00`.
- `positive` and `negative` only reinforce that sign or label.
- Category accounts (`INCOME` and `EXPENSE`) use `text`, not `positive` or `negative`.

## Typography

- **Display (page titles):** Inter 700, `clamp(1.75rem, 3vw, 2.25rem)`, tight tracking.
- **H2 (card and section titles):** Inter 600, 1.5rem.
- **Body:** Inter 400, 16px, line height 1.6, at most 72ch per line in prose.
- **Labels, table headers and captions:** Inter 500, 0.875rem, letter spacing 0.01em, in `text-muted`.
- **Money and technical values** (amounts, balances, dates in tables, IDs, versions): JetBrains Mono 500 with `font-variant-numeric: tabular-nums`. Amounts are right-aligned in tables and always shown with 2 decimal places and thousands separators.
- Fonts are self-hosted through `@fontsource/inter` and `@fontsource/jetbrains-mono`, with no external CDN request. Fallbacks: `system-ui, sans-serif` and `ui-monospace, monospace`.

## Layout

- **Shell:**
  - A sticky top bar (`background`, 1px bottom `border`) holds the brand "Personal Money", the main navigation, the user's name, a role pill and **Log out**.
  - Content is centered with a max width of 1280px and 1.5rem side padding.
- **Grid:** CSS Grid. The Overview uses an asymmetric grid of 2fr and 1fr, never three equal columns.
- **Spacing:** 8px base unit. Cards have 24px padding. Sections are 32–48px apart (an app needs less space than a landing page; see Deviations).
- **Mobile, below 768px:**
  - Every multi-column layout collapses to one column, with no horizontal page overflow.
  - Wide tables scroll inside their card.
  - The nav becomes a horizontal scrollable tab row under the top bar.
- **Minimum width:** 320 CSS px.
- **z-index contract:** base 0, sticky nav 100, dropdown 200, modal 300, toast 500.
- **Page height:** use `min-height: 100dvh`, never `100vh`.

## Elevation and depth

- Two levels only: `surface` cards on the `background`, and `surface-raised` for inputs and menus.
- Shadow: at most `0 2px 8px rgba(0,0,0,0.08)` on cards. Modals add a `rgba(0,0,0,0.5)` backdrop.
- **Motion:**

  | Element | Behavior |
  |---|---|
  | Hover | Color and shadow shift over 200ms ease-out |
  | List and card entry | Fade and translate-Y 8px → 0 over 300ms, staggered 60ms (first load only) |
  | Screen change | Fade only, 200ms |
  | Button active | `translateY(1px)` |

  Only `transform` and `opacity` are animated. Under `prefers-reduced-motion: reduce`, all motion is disabled.

## Shapes

Base radius 8px (`rounded.sm`) for buttons, inputs, cards and tables. `rounded.md` (16px) is for modals and the sign-in card. `rounded.lg` (24px) is for pills and badges.

## Components

- **Primary button:** `primary` fill, `on-primary` text, weight 600. Hover lightens to `primary-hover` and adds a slight lift shadow. Active is pressed down 1px. Disabled is at 50% opacity with a `not-allowed` cursor, and shows its progress label ("Saving…").
- **Ghost button:** transparent, with a 1.5px `border` stroke and `primary-text` text. Hover fills with `surface-raised`.
- **Danger button** (Delete, Archive): transparent, with a `negative` stroke and `negative` text. It always opens a confirmation modal.
- **Card:** `surface`, 1px `border`, radius 8px, 24px padding. Optional header with an H2 and right-aligned actions.
- **Input and select:**
  - The label sits above the field. No floating labels.
  - `surface-raised` fill and a 1px `border`.
  - Focus ring: 2px `primary`, offset 2px.
  - Error text below the field in `negative`, linked with `aria-describedby`.
  - Amount inputs use `inputmode="decimal"` and the money font.
- **Allocation editor** (payment and receive forms):
  - Each row has a line type, an account and an amount, plus **Add line** and remove buttons.
  - A live footer shows "Allocated 1,800.00 of 2,000.00". It turns `positive` when the totals are equal and `warning` otherwise.
  - This footer is guidance only. The server remains the enforcement (README §5).
- **Money cell:** right-aligned, in the money font, with a sign or label, colored per the money color rule.
- **Badges** (pill, `rounded.lg`): role (`USER`, `ADMINISTRATOR`), status (`Active`, `Disabled`, `Archived` in `warning`), account type, and loan (`accent`).
- **Navigation:** a top bar with text links. The active item has a 2px `primary` underline and weight 500.
- **Toast:** bottom-right, `surface-raised`, with a left 3px bar in `positive` or `negative`. Auto-dismisses after 4s and is announced with `role="status"`.
- **Server rejection alert:** inline in the form, `role="alert"`, `negative` text, showing the server's exact message, for example "Insufficient balance in the source cash account.". The client never pre-checks balances (AC-40 pattern).
- **Skeleton:** a shimmer block matching the final size. No circular spinners.
- **Empty state:** a Lucide icon, one sentence and one action button, for example "No transactions yet." with **Record a transaction**.
- **Icons:** `lucide-react` only, 16–20px, with `aria-hidden` when decorative. No emoji.

## Screens

Feature and AC references point to the Sprint 2 contracts in `docs/sprints/sprint-2/`.

### Sign-in and register (F-01, F-07)

- A centered card (`rounded.md`, max width 27rem) on `background`. It holds the heading "Welcome back", email and password fields, and a full-width primary **Sign in** button. A ghost link leads to **Create account**.
- Keep the Sprint 1 behavior:
  - Both fields are required.
  - `type="email"` with `autocomplete="username"`, and `autocomplete="current-password"`.
  - The button is disabled while the request is in progress.
  - Errors appear as an alert.
  - After sign-in, the client requests the current user before showing the app.
- The register form keeps the F-07 rules and the success notice ("Account created. Please sign in.").

### Overview (F-06, F-10, F-11)

- An asymmetric grid of 2fr and 1fr.
- **Left:**
  - A "Balances" card listing Cash accounts with balances.
  - A "Recent activity" card showing the last 5 transactions, with **View all** linking to History.
- **Right:** stat tiles for **Cash total**, **Owed to you** (`loansGivenOutstanding`), **You owe** (`loansTakenOutstanding`), **Income** and **Expenses**.
- Primary action in the page header: **Record transaction**.

### Accounts (F-08, F-09)

- A table grouped by type (Cash, Loans given, Loans taken, Income, Expenses). Columns: name, subtype, balance (money cell) and status badge. Row actions: Rename, Opening balance (balance accounts only), Archive or Restore, Delete.
- Header action: **New account**, which opens a modal form. The subtype list follows the type (F-08 pair table).
- A **Show archived** toggle. Archived rows use `text-muted` with a `warning` badge.
- Server 409 messages appear inline in the modal or row ("Only an account with a zero balance can be archived.").

### Record (F-05, F-04, F-06, F-10–F-12)

Segmented tabs, each with its own form, and every form shows server rejections inline:

| Tab | Form |
|---|---|
| **Payment** | Source (Cash or loan-taken) plus the allocation editor (Expense, Repayment, Loan given, Transfer) |
| **Receive** | Receiving Cash account plus the allocation editor (Income, Repayment of a loan given, Borrowing, Transfer) |
| **Transfer** | From and to pickers (the *to* list excludes the *from* account), amount, date, note |
| **Repay** | Bank or wallet source, loan-taken destination, amount, date |

After a success, show a toast, reset the form, and refresh balances.

### Loans (F-10, F-11)

- Two cards side by side, collapsing below 768px.
- **Loans given:** account, owed to you, and the last activity.
- **Loans taken:** account, you owe, and the last activity.
- Row actions jump to Record with the loan preselected ("Record repayment", "Repay").

### History (F-13, F-14)

- A filter bar: from and to date, account, form type, line type, minimum and maximum amount, note text, **Apply** and **Clear**.
- A result count ("37 transactions") and a paginated table (20 per page, Previous and Next). Columns: date, description (lines summarized), accounts, note and amount.
- Row actions:
  - **Edit** opens the matching Record form pre-filled with the saved values, in a modal.
  - **Delete** opens a confirmation modal: "Delete this transaction? Balances will be recalculated."
- The empty state reads "No transactions match these filters." with a **Clear filters** action.

### Administrator (F-01)

- The heading "User administration" with the explanation that administrators manage platform access and have no access to financial data.
- A table with name, email, role badge, status badge and an Enable/Disable button. The button is disabled for its row while the update runs, and errors appear as alerts.
- The navigation shows no financial screens for administrators.

### Sign-out

**Log out** calls the logout API, clears the in-memory token and user, and returns to Sign-in (unchanged from Sprint 1).

## States (every data screen)

| State | Treatment |
|---|---|
| Loading | Skeletons sized like the final content |
| Empty | Empty-state component with an action |
| Validation error | Field-level message below the input |
| Server rejection (400 or 409) | Inline `role="alert"` showing the server's message; the form keeps the user's input |
| Forbidden or expired session (401 or 403) | Return to Sign-in with "Your session has ended. Please sign in again." |
| Network failure | Alert "Could not reach the server. Try again." with a retry button |

## Accessibility (WCAG 2.1 AA target)

- Every text and background pair is at least 4.5:1 on `background`, `surface` and `surface-raised`. The lowest is `text-muted` on `surface-raised`, at 4.78:1. The focus ring and nav indicator are at least 3:1. `primary` is never used as text. Use `primary-text`.
- Every input has a visible `<label>`. Errors use `aria-describedby` and `role="alert"`.
- Every interaction works by keyboard. Modals trap focus and return it to the opener, and Esc closes them. The tab order follows the visual order.
- Tables use `<th scope>`. Icon-only buttons have an `aria-label`.
- Status is never conveyed by color alone (money color rule and badges with text).
- `prefers-reduced-motion` is respected.
- Touch targets are at least 44×44px on mobile.

## Authentication state

Unchanged from Sprint 1. The token and current user are held in React state only, with no browser storage, and the token is sent as `Authorization: Bearer` from `client/src/api.ts`.

## Do's and don'ts

- Do show every amount with 2 decimals, thousands separators and a sign or label.
- Do show the server's exact rejection message.
- Do keep one primary button per form.
- Don't use emoji. Use Lucide icons.
- Don't use gradients or glows. Use flat color only.
- Don't use shadows heavier than `0 2px 8px rgba(0,0,0,0.08)`.
- Don't use pure black (`#000000`) or fully saturated neon (`#00FF00`, `#00FFFF`).
- Don't use three equal-width columns for primary content.
- Don't write marketing copy ("Elevate", "Seamless", "Unleash", "Next-Gen"). Use plain task language.
- Don't use lorem ipsum. Demo data comes from the synthetic seed.
- Don't load images or fonts from external hosts.

## Deviations from the source design

| Source rule | This spec | Reason |
|---|---|---|
| `button-primary` text `#F0F0F0` on `#00A67E`, hover "8% darken" | Text `#202124` (`on-primary`). Hover lightens to `#1DB88F`. Links use `#2BC79C` | The source pair is 2.73:1 and fails WCAG AA. Darkening would drop dark text to 4.14:1, and `#00A67E` as text on raised surfaces is 4.06:1. |
| `surface` `#00FF00` (success) | `positive` `#81C995` | `#00FF00` breaks the source's own 80% saturation cap and is 1.37:1 on white. |
| `accent` `#800080` | `#CE93D8` | `#800080` is 1.71:1 on the charcoal background. |
| Cyan `#00FFFF` and black `#000000` in the palette | Removed | The source's don'ts forbid pure black and oversaturated color. |
| Color named "Azul IA" | Called `primary` | `#00A67E` is green, not blue. |
| Split-screen hero, zig-zag feature rows, section gaps of 4–8rem | App shell, asymmetric grids, 32–48px gaps | PMELS is an application, not a landing page. |
| Text-generation animation, neural-network visuals, "AI glows" | Not used | No AI feature exists in PMELS, and glows conflict with the source's own flat-color rule. |
| Card shadow `0 2px 12px rgba(0,0,0,0.06)` (Components) | `0 2px 8px rgba(0,0,0,0.08)` | The source contradicts itself. Its don'ts cap shadows at 8px blur. |
| Entry translate 16px over 420ms, 80ms stagger | 8px over 300ms, 60ms stagger | A data app is used repeatedly, and long entry motion slows it down. |
| picsum.photos placeholder images | None | The app needs no photos, and external images are disallowed. |
| Light theme "Full" | Dark only in Sprint 2 | Kept bounded for Deliverable 2. A light theme is optional later work. |

## Implementation notes for Issue 06

- Keep Bootstrap 5 for the grid, modals and forms, and theme it through CSS custom properties in `client/src/theme.css`, defining `--pm-*` tokens from the front matter. Rewriting the components is not required.
- New dependencies: `lucide-react`, `@fontsource/inter` and `@fontsource/jetbrains-mono`. All three install from npm, with no runtime CDN.
- Split `client/src/App.tsx` into `client/src/screens/` (`Overview`, `Accounts`, `Record`, `Loans`, `History`, `Admin`, `SignIn`) and `client/src/components/` (`MoneyCell`, `AllocationEditor`, `ConfirmModal`, `Toast`, `EmptyState`, `Skeleton`).
- A shared `formatMoney()` helper produces `1,234.56` and `−1,234.56`, using `Intl.NumberFormat('en-US', { minimumFractionDigits: 2 })`. A unit test covers it.
- Client tests in `client/tests/` cover the UI AC from each Sprint 2 contract (AC-48-UI, AC-53-UI, AC-59-UI, AC-66-UI, AC-74-UI, AC-82-UI, AC-89-UI). The Sprint 1 tests in `App.test.tsx` keep passing. Selectors that depended on old text are updated only where this spec renames the text, and every such change is listed in the PR.

## Implementation status

| Area | Status (25 Nov 2026) |
|---|---|
| Sprint 1 screens (Sign-in, User view, Administrator, Sign-out) | Implemented in the v1.0 Zen Green theme ([`UI-specs-v1.0.md`](UI-specs-v1.0.md)). This applies until Issue 06 merges. |
| PMELS Charcoal theme and the Sprint 2 screens | Planned (Issue 06) |

## Source files

- `client/src/App.tsx`: the current single-file UI. Issue 06 splits it into `screens/` and `components/`.
- `client/src/api.ts`: API requests and the bearer-token header.
- `client/src/main.tsx`: React entry point and the Bootstrap and theme imports.
- `client/src/theme.css`: design tokens and component overrides.
- `client/index.html`: document title and responsive viewport.
- `client/tests/`: UI tests.

## Version history

| Version | Date | Change | Issue |
|---|---|---|---|
| 1.0 | Sprint 1 | Described the implemented "Zen Green" theme and the F-01 to F-03 screens. Preserved unchanged in [`UI-specs-v1.0.md`](UI-specs-v1.0.md). | Sprint 1 |
| 2.0 | 2026-11-25 | Rewritten in design.md format as the target "PMELS Charcoal" design system for the Sprint 2 UI (Issue 06), adapted from "Estilo de Inteligência Generativa" with accessibility fixes and app-specific screens. | #73 |
