# AcChess — Responsive & Accessibility Test Checklist

What was **verified in this build** (automated checks in a real Chromium browser plus headless Chrome), what is **partly verified**, and what **still needs testing on real devices or with real people**. Nothing here is a claim of WCAG conformance.

Screenshots of all five screens at desktop (1440 × 900) and phone (390 × 844) are in `screenshots/`.

## 1. Viewport matrix

Checked on every screen (Home, Playing, Game Review, Puzzle, Play Menu):

| Viewport | Navigation | No horizontal scroll | Board fits (64 squares, coordinates inside squares) | Settings + Voice reachable | Targets ≥ 44 px |
|---|---|---|---|---|---|
| 320 × 568 | bottom bar + More | ✅ | ✅ 296 px (squares 37 px) | ✅ | ✅ (except board squares) |
| 360 × 640 | bottom bar + More | ✅ | ✅ 336 px (42 px) | ✅ | ✅ (except board squares) |
| 375 × 667 | bottom bar + More | ✅ | ✅ 351 px (44 px) | ✅ | ✅ |
| 390 × 844 | bottom bar + More | ✅ | ✅ 366 px (46 px) | ✅ | ✅ |
| 430 × 932 | bottom bar + More | ✅ | ✅ 406 px (51 px) | ✅ | ✅ |
| 768 × 1024 | bottom bar + More | ✅ | ✅ 680 px (85 px) | ✅ | ✅ |
| 1024 × 768 | sidebar | ✅ | ✅ 428 px, two columns (board + panel) | ✅ | ✅ |
| 1440 × 900 | sidebar | ✅ | ✅ 592 px, three columns | ✅ | ✅ |

Note: at 320–360 px wide an 8-square board cannot have 44 px squares; the board is as large as the screen allows and every square is still a full tap target.

## 2. Stress settings (worst case)

Text 160 %, board 130 %, larger targets on, high contrast on:
- 375 × 667 — all five screens: no horizontal scroll ✅
- 320 × 568 — all five screens: no horizontal scroll ✅; Settings, Voice and More still inside the top bar ✅
- Settings sheet, Voice panel and More sheet fit the viewport ✅

## 3. Phone navigation and panels

| Check | Result |
|---|---|
| Sidebar replaced by compact top bar (Settings · Voice · More) + bottom bar (Home · Playing · Review · Puzzle · Menu) | ✅ |
| Active screen clearly identified (green top border + tinted background + `aria-current`) | ✅ |
| Only one navigation system at a time (sidebar hidden from layout and screen readers on phones) | ✅ |
| Accessibility Settings = bottom sheet with sticky header (Close ✕), sticky footer (Reset, Done) | ✅ |
| Voice Controls = bottom sheet, close button always visible, typed input fallback | ✅ |
| On-screen keyboard: panels move above it (simulated `visualViewport` keyboard of 300 px; input and close button stay visible) | ✅ simulated only |
| Dialogs (resign confirmation, More, Search…) become bottom sheets, full-width buttons | ✅ |
| Focus returns to the control that opened a dialog/panel; Esc closes | ✅ (also when a tap did not focus the button) |
| Microphone never starts automatically; states shown: inactive / starting / listening / done / error | ✅ ("processing" is instant, so it has no separate state) |

## 4. Screen behaviour on phones

| Screen | Verified |
|---|---|
| Home | Compact quick-access toggles, Play Chess first, time controls, 2-column more-ways grid, cards as compact rows ✅ |
| Playing | Status strip → players + clocks → board → Cancel / Undo → collapsible "Moves and game info" with history controls, Draw / Resign / Flip ✅; tap-to-select then tap-to-move ✅ |
| Game Review | Status strip, horizontal evaluation bar, board, Previous/Next buttons directly under the board, sample-data notice, text description of arrows/highlights ✅ |
| Puzzle | Objective above the board, Hint / Try again / Cancel directly under it, Previous/Next puzzle with visible labels, correct and wrong-move feedback ✅ |
| Play Menu | Accessibility card first, touch-sized rows, menu before preview board ✅ |

## 5. Regression (desktop and shared behaviour)

Keyboard board play, Alt + Shift + A / V, typed and (simulated-recognizer) voice commands, settings commands, puzzle solved by voice, history navigation, desktop Cancel/Undo buttons, confirmation dialogs, voice navigation across the site, push-to-talk, continuous listening, low-time warning: ✅ no console errors.

## 6. Colour and contrast (computed, default theme)

| Pair | Ratio |
|---|---|
| White text on page background | 13.5 : 1 |
| Muted text on panels | 10.3 : 1 |
| Dim text on panels | 7.0 : 1 |
| Primary button label (dark on green) | 7.8 : 1 |
| White on grey buttons | 11.3 : 1 |
| Accent text on panels | 10.1 : 1 |
| Error text / warning text on panels | 6.9 : 1 / 10.6 : 1 |
| Low-time clock | 10.3 : 1 |
| Board coordinates, light squares | 4.8 : 1 |
| Board coordinates, dark squares (adjusted from cream, 3.0 : 1, to very dark green) | 4.8 : 1 |

Only change to the palette: the coordinate letters/numbers on dark squares. Selected, legal, capture, check, last-move and hint squares also use shapes, patterns and text labels (not colour alone). Piece outlines on dark squares (white pieces) are about 2.7 : 1 in the classic theme — the High-contrast piece theme and the letter-label piece theme are the remedies.

## 7. NOT verified — still needs testing

- Real phones and tablets (iOS Safari, Android Chrome): touch behaviour, safe-area insets, real on-screen keyboard, address-bar resizing, pinch zoom, orientation change.
- Real speech recognition and speech output (microphone permission prompts, accuracy, voices); vibration hardware.
- Real screen readers (NVDA, JAWS, VoiceOver, TalkBack) and switch / head-pointer devices.
- Browser zoom to 200 % / 400 % (text enlargement to 160 % was tested; page zoom was not separately tested).
- Firefox and Safari desktop.
- Formal WCAG 2.2 AA audit and any testing with blind, low-vision or motor-impaired participants.
