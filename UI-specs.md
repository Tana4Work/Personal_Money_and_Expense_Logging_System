# UI Specification

## Purpose and scope

This document records the UI theme and behavior currently implemented for F-01 Authentication and Role Access, F-02 Account Foundation, and F-03 Opening Balance. It describes the existing client in `client/src`; transaction screens are outside its current scope.

## Theme

The project style is the Zen Green design system. In the current F-01 UI, it uses pale green page backgrounds, white content surfaces, dark green text, rounded panels, and Bootstrap components with project-specific CSS overrides. The values below are taken from `client/src/theme.css`.

| Use | Value |
|---|---|
| Main text | `#18352d` |
| Page background | `#f3f7f4` |
| Heading text | `#163d32` |
| Header background | `#123f34` |
| Primary action | `#237254` |
| Primary action hover | `#185a42` |
| Primary action active | `#144b38` |
| Panel border | `#d9e7de` |
| Panel surface | `#ffffff` |
| Keyboard focus | `#3b9970` with a translucent focus ring |
| Active status | `#216444` on `#e4f4e9` |
| Disabled status | `#7a4a37` on `#f9ece4` |

Typography uses Inter followed by system sans-serif fallbacks. Headings use dark green text, heavier weight, and responsive sizing. Small uppercase eyebrow labels use green text and increased letter spacing.

## Shared layout and components

- Bootstrap 5 CSS is imported by `client/src/main.tsx`; project theme rules are in `client/src/theme.css`.
- Authenticated pages use a full-height application shell and a dark green top bar.
- The top bar contains the "Personal Money" brand, the signed-in user's name and role pill, and a Log out button.
- Main content uses Bootstrap's responsive `.container` and spacing utilities.
- Panels use a white background, pale green border, rounded corners, and a light shadow.
- Primary buttons use the project green. Focus-visible buttons and focused form controls show the green focus treatment.

## Screens and behavior

### Sign-in

- The sign-in screen centers a white card on a pale green background with a soft radial green accent.
- The card contains a product eyebrow, "Welcome back" heading, supporting text, email field, password field, and full-width Sign in button.
- Both fields are required. The email field uses `type="email"` and `autocomplete="username"`; the password field uses `type="password"` and `autocomplete="current-password"`.
- While sign-in is in progress, the button is disabled and displays its progress label.
- Sign-in errors are shown as an alert in the card.
- On successful sign-in, the client requests the current-user identity before showing the authenticated view.

### User view

- A `USER` sees a welcome heading with their name and the message "Your financial workspace is ready."
- The "Your accounts" table displays each retrieved account's name, type, subtype, opening balance, and recorded date.
- Each owned `CASH/BANK` account has an opening-balance form with amount and date fields. The saved balance and date appear in the account table.
- The opening-balance form belongs to F-03. Transaction screens are not implemented.

### Administrator view

- An `ADMINISTRATOR` sees the "User administration" heading and text explaining that administrators manage platform access without access to financial accounts.
- The user table displays name, email, role, enabled/disabled status, and an action to enable or disable each user.
- Status uses both text and a color pill. The action button is disabled for the row while its update is in progress.
- Errors while loading or updating users are shown as alerts.

### Sign-out

- Log out calls the logout API and returns the interface to the sign-in screen.
- The client clears its in-memory token and user state when the logout request finishes.

## Responsive behavior

- The document viewport is configured for device width in `client/index.html`.
- The page supports a minimum width of 320 CSS pixels.
- The sign-in card width is capped at 27rem, constrained within the available grid column, and its padding adapts to the viewport width.
- The account and administrator tables stay within their responsive wrappers and can scroll horizontally when their columns exceed the viewport.
- The opening-balance fields and save button stack below 768px and share a row at wider viewports.
- At widths of 767.98px or less, the signed-in user label is constrained and allowed to wrap, and table wrappers use reduced horizontal padding.

## Accessibility present in the implementation

- Sign-in fields have visible labels associated with their inputs.
- Opening-balance amount and date fields have visible labels associated with their inputs.
- Screen sections use headings and `aria-labelledby` references.
- Error messages use `role="alert"`.
- The administrator table uses column headers, including a visually hidden label for the action column.
- Buttons use native button elements and expose disabled state while busy.
- Keyboard focus is visibly styled for buttons and form controls.

## Authentication state

The access token and current-user identity are held in React component state in `client/src/App.tsx`. The current implementation does not persist them in browser storage. The API client sends the token in the `Authorization: Bearer` header from `client/src/api.ts`.

## Source files

- `client/src/App.tsx` - sign-in, user, administrator, and sign-out UI.
- `client/src/api.ts` - client API requests and bearer-token header.
- `client/src/main.tsx` - React entry point and Bootstrap/theme CSS imports.
- `client/src/theme.css` - palette, typography, panels, controls, and responsive rules.
- `client/index.html` - document title and responsive viewport metadata.
- `client/tests/App.test.tsx` - UI tests for user sign-in/current-user/sign-out, opening-balance entry, and administrator access controls.
