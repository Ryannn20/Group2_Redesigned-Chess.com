# AcChess — Play Without Barriers: Feature Manual

*An accessible, multimodal redesign of Chess.com. Proposed academic prototype — not an official Chess.com product and not connected to Chess.com servers.*

This manual describes every accessibility feature and how to try it. It covers three target groups — **blind users**, **low-vision users** and **motor-impaired users** — and the interaction methods each can choose.

---

## 0. Getting started

| | |
|---|---|
| **Open** | Double-click `index.html` (Chrome or Edge recommended). |
| **Best way to start (microphone asked only once)** | **Double-click `start-acchess.bat`** in this folder. It starts a tiny local server and opens `http://localhost:5188/`. Chrome and Edge remember your microphone choice for `localhost`, so you are asked **once** (choose *Allow*, not *Allow this time*). Close the minimized "AcChess local server" window to stop it. Needs Python. |
| **Why does opening `index.html` directly ask every time?** | A page opened from disk (`file://`) has no stable "site", so browsers cannot remember the microphone permission and ask on every start. This is a browser rule, not something the page can change. The Voice Controls panel shows the current permission state and this tip. Typed commands never need permission. |
| **Compare with the original** | The link *"Compare: current Chess.com UI recreation"* opens `chesscom-current.html`. |
| **Switch screens** | Numbered links under the header (**Home, Playing, Game Review, Puzzle, Play Menu**), the sidebar, or buttons inside each screen. |
| **Session memory** | Settings last for the browser session (until the tab closes). **Reset to defaults** is in the settings panel. |

**Defaults:** Sound effects *on* (silent until you interact), spoken output *off*, vibration *off*, screen reader mode *off*, larger targets *off*, click-to-move *on*, confirmations *on*. **The microphone never starts by itself.**

### What a first-time user sees
1. **Skip links** appear on the first **Tab**: *Skip to main content* and *Skip to Accessibility and Voice Controls*.
2. A **persistent header** on all five screens, always visible without scrolling:
   **Accessibility Settings** (Alt + Shift + A) · **Open Voice Controls** (Alt + Shift + V) · **Help**.
3. A short **welcome message** explaining the navigation methods (dismiss with *Got it*; reopen any time with **Help**).

> If Alt + Shift is used by your screen reader or your Windows keyboard-layout switcher, ignore the shortcuts — the two header buttons do exactly the same thing.

---

## 0b. Phones and tablets (responsive layout)

The same prototype adapts to the screen. Resize the browser window, or open it on a phone, to see it.

| Screen width | Layout |
|---|---|
| **≥ 1180 px** | Sidebar + board + game panel + assistive panel (three columns, up to 1640 px; two columns below that) |
| **900 – 1179 px** (tablet landscape) | Sidebar + board + panel side by side; assistive cards stack under the panel |
| **< 900 px** (tablet portrait, phones) | One column. The sidebar is replaced by a **top bar** (AcChess · **Settings** · **Voice** · **More**) and a **bottom bar** (Home · Playing · Review · Puzzle · Menu) |

On phones:
- **More** (top right) holds Learn, Tournaments, Chess Variants, Free Trial, Search, Profile, Friends, Messages, Notifications, Help and Keyboard shortcuts.
- **Settings** opens a full-width bottom sheet with a **Done** button; **Voice** opens a compact bottom sheet that moves above the on-screen keyboard.
- **Playing:** status strip (whose turn, last move) → opponent + clock → board → you + clock → **Cancel selection / Undo last move** → collapsible **Moves and game info** (history buttons, Draw, Resign, Flip always visible).
- **Game Review:** status strip → board (evaluation bar becomes a horizontal strip) → **Previous / Next** buttons directly below the board.
- **Puzzle:** objective above the board → **Hint / Try again / Cancel selection** directly below it.
- **Play Menu:** the menu comes first, large touch rows, preview board below.
- Tap a piece, then tap a highlighted square. No dragging is needed (drag-and-drop stays optional, off by default).
- Add `?welcome=off` to the address to hide the welcome banner (handy for demos).

Test results and what still needs real-device testing: see `RESPONSIVE-TEST-CHECKLIST.md`.

---

## 1. Always-available entry points

| Feature | How to try |
|---|---|
| **Skip to main content** | Reload, press **Tab** once, press **Enter**. Focus jumps to the page content. |
| **Accessibility and Voice Controls entry** | Press **Tab** twice, **Enter** — focus lands on the *Accessibility Settings* button. |
| **Persistent buttons** | Scroll down on any screen; the header (with both buttons) stays on top. |
| **Alt + Shift + A / V** | Press from anywhere; press again to close. They are ignored while you are typing in a text box. |
| **Welcome / Help** | **Help** button → short instructions and a link to all keyboard shortcuts. |
| **Spoken/announced welcome** | A live-region message announces the shortcuts on load (screen readers that read live regions). |

Opening either panel **moves focus into it**, **announces** it, and **Esc** closes it and **returns focus** to the button you used. Opening one panel closes the other so the board stays visible.

---

## 2. Accessibility Settings (four categories)

Open with the header button, **Alt + Shift + A**, the sidebar *Accessibility* button, or say *"Open accessibility settings"*. Every switch shows a visible **On / Off** label plus a ✓ (never colour only).

### Vision
| Setting | What it does |
|---|---|
| **High contrast** | Black/white UI with thick borders, yellow accents, bold black-and-white pieces and a hatched board. |
| **Text size** | 100 %–160 % interface text. |
| **Board size** | 60 %–130 % of the fitted board. |
| **Board theme** | Classic green & cream (default) · High-contrast black & white · Colour-blind-safe blue & sand. |
| **Piece theme** | Classic · High-contrast bold · Classic with **letter labels** (K Q R B N P). |
| **Strong focus indicators** | Thicker double-ring outline on the focused control or square. |
| **Move indicators** | Selected, legal, capture, check and last-move squares use shapes, patterns and text chips (SELECTED, CHECK, from, to, HINT) — not colour alone. |
| **Reduced motion** | No animations; shorter delays (starts from your OS preference). |

### Nonvisual access
| Setting | What it does |
|---|---|
| **Screen-reader compatibility mode** | Announces each square as you move; keeps the transcript visible. Works alongside your own screen reader. |
| **Spoken board descriptions** | Speaks square descriptions, board readings and answers to your questions (browser speech synthesis). *Test speech* button. |
| **Spoken game announcements** | Speaks moves, check, results and error messages. |
| **Speech rate** | 0.6× – 1.6×. |
| **Announcement verbosity** | Minimal (notation) · Standard · Detailed (adds legal moves and side to move). |

### Input and motor accessibility
| Setting | What it does |
|---|---|
| **Voice control** | Marks voice input as in use; *Open Voice Controls* button. |
| **Continuous listening (optional)** | **One** microphone session stays open for many commands, so the browser asks for permission **once** instead of for every command. Speech that is not a command is ignored silently; the app's own spoken announcements are not mistaken for commands. Turns itself off after 5 minutes without a command. **Off by default.** |
| **Keyboard navigation** | Arrow keys move between squares. Off: **Tab** steps through all 64 squares. |
| **Click-to-move mode** | On (default): click/tap the piece, then the destination; dragging is off. Off: dragging pieces also works (clicking always works). |
| **Larger interactive targets** | Bigger buttons and spacing across the interface. |
| **Confirm consequential actions** | Asks before draw offers, undo and new game. **Resignation always asks**, even when this is off. |
| **Untimed play** | Turns the game clocks off — no time limit. |
| **Spacebar push-to-talk** | On by default. Press **Space** (with the board or page focused), wait for “Listening”, then say your move. When on, use **Enter** to select squares. Turn off to make Space act like Enter again. |

### Audio and haptics
| Setting | What it does |
|---|---|
| **Sound effects** | Tones for select, move, opponent move, illegal move, check, checkmate. *Test sound* button. |
| **Haptic feedback** | Vibration patterns on supported devices; on desktops a **visual demonstration** is shown and nothing is claimed to vibrate. *Test haptic feedback* button. |
| **Low-time warning** | On by default. Visual, spoken/live-region, audible and haptic warnings when a clock runs low (see section 3b). *Test low-time warning* button. |
| **Warn me when this much time is left** | 2 minutes · **1 minute (default)** · 30 s · 20 s · 10 s. |

Nothing in this panel requires a microphone, sound or vibration.

---

## 3. Global Voice Controls (one command at a time)

Open from **any screen** with **Open Voice Controls**, **Alt + Shift + V**, the Home quick-access button, or the command *"Open voice controls"*. It is a compact panel docked at the bottom-right so the board stays visible.

### Microphone flow
1. Open Voice Controls — nothing is listening yet.
2. Press the **microphone button** (deliberate action).
3. The app announces **"Listening. You may speak now."** and then opens the microphone.
4. Say **one** command. The recognized text appears under **Heard** and is announced (*"Heard: …"*).
5. The command is **validated** against the current game/screen and executed only if valid; **Understood as** and **Result** show the real outcome.
6. The microphone returns to **Microphone off**. Press it again for the next command.

| Situation | Behaviour |
|---|---|
| Permission denied / no microphone / unsupported browser / no network / nothing heard | An explanation is shown **and announced**, and focus moves to the **text box**, which keeps working. |
| Low recognition confidence on a move or consequential command | A dialog asks *"Did I hear you correctly?"* before running it. |
| **Continuous listening** (optional) | Press the microphone **once**. The indicator reads *"Listening continuously"* and a cue stays on screen. Say as many commands as you like — the same microphone session handles them all (one permission prompt). Say **"stop listening"**, press the mic button / Space, close the panel, turn the setting off, or wait 5 minutes without a command to switch it off. If the browser ends the session by itself, the same recogniser is reopened. Unrelated speech is ignored and shown in the history as *ignored*. Use headphones if your speakers' sound is picked up by the microphone. |

You can always **type** the same commands in the text box (Alt + Shift + V opens the panel; the box is the second control).

### Spacebar push-to-talk ("hit the spacebar, then speak your move")

| Step | What happens |
|---|---|
| 1. Focus the board or the page | Click the board, **Tab** to it, or just be on the page (not in a text box or on a button). |
| 2. Press **Space** | A cue appears at the bottom — *"Listening… say your move"* — and the app announces *"Listening. You may speak now."* |
| 3. Say one command | e.g. *"Knight to f3"*, *"Move e2 to e4"*, *"Castle kingside"*, *"What is on e4?"* |
| 4. Result | The cue shows what was heard and the result; the result is also announced. The microphone then turns off. |
| Stop early | Press **Space** again while listening. |

Notes: Space is **not** hijacked on buttons, links, switches or text boxes (they keep their normal behaviour). It works on every screen; without a board it will say there is no chessboard. If the browser has no speech recognition you are told so and pointed to Voice Controls (typed commands). Say or click *"Turn off spacebar push-to-talk"* if it clashes with your screen reader.

### Navigating the whole app by voice (not only while playing)

Everything you can reach with mouse, touch or keyboard can be reached by voice, on every screen and inside dialogs.

| Goal | Say |
|---|---|
| Know where you are | "Where am I?", "What's on this screen?", "Read the headings" |
| Hear what is available | "What can I do here?", "List controls", then "More" for the next 8 |
| Go to a screen | "Go to home", "Go to play" (Play menu), "Go to playing" (current game), "Go to puzzles", "Open game history" / "game review" |
| Open site sections | "Go to learn", "Open tournaments", "Chess variants", "Free trial", "Search", "Open my profile", "Friends", "Messages", "Notifications" |
| Search | "Search for contrast" (opens Search with the results read out) |
| Press any control by name | "Press play chess", "Click solve puzzles", "Choose five minutes", "Press review game", "Press challenge", "Press dismiss recommended match" — or just say its name, e.g. "Start lesson" |
| When several controls match | The app lists them with numbers (*"2 controls match…: 1, Solve Puzzles; 2, Solve daily puzzle"*). Say **"two"** or **"second"**, or **"cancel"**. |
| Move through controls | "Next control", "Previous control", then "Activate" to press the one you are on |
| Scroll | "Scroll down", "Scroll up", "Go to the bottom", "Go to the top" |
| Back / close | "Go back" (previous screen), "Close" (dialog, settings, voice panel or welcome message) |
| Settings | "Open accessibility settings", "Enable high contrast", "Increase text size", "Turn off sound", "Turn on larger targets" |

Names are matched forgivingly ("five minutes" = **5 min**, "the" and "button" are ignored). Short or unclear fragments are never acted on; instead the app says it did not understand. Commands inside dialogs are limited to *close*, *confirm/cancel* and pressing that dialog's own buttons, so nothing behind it changes by accident.

### Commands
| Intent | Examples |
|---|---|
| Panels & settings | "Open accessibility settings", "Open voice controls", "Close settings", "Enable high contrast", "Disable high contrast", "Increase text size", "Decrease text size", "Make the board bigger", "Turn off sound", "Turn on sound", "Enable screen reader", "Turn on spoken announcements", "Enable vibration", "Reduce motion", "Turn on larger targets", "Turn off dragging", "Disable the clock", "Reset accessibility settings" |
| Navigate | See the table above — screens, sidebar sections, controls, scrolling, back/close |
| Describe | "What is on e4?", "Read the board", "Whose turn is it?", "What was the last move?" |
| Select / move | "Select e2", "Move e2 to e4", "Knight to f3", "Knight from g1 to f3", "Pawn takes e5", "Castle kingside" |
| Legal moves | "Read legal moves", "Legal moves for g1" |
| Cancel vs undo | "Cancel selection" (drops a selection, no move) · "Undo" (takes back a completed move, asks to confirm) |
| History / review | "Previous move", "Next move", "First position", "Last position" (while "Go back" means the previous *screen*) |
| Game actions | "Offer draw", "Resign", "New game" — each asks for confirmation |
| Puzzle | "Hint", "Read the puzzle" |
| Confirm | "Confirm" / "Yes", "Cancel" / "No" |
| Other | "Help", "Stop" (stops speech) |

Letters and numbers can be spoken ("e two to e four"). If two pieces could make the same move (e.g. two knights), the app **asks which one**; answer with the starting square ("a1") or "first". A move is only reported as completed when the rules engine accepted it, e.g. **"Move completed. White pawn moved from e2 to e4."**

---

## 3b. Low-time warning

| Part | What you get |
|---|---|
| **Visual** | The low clock turns **dark red with a hatched pattern** and a **⚠ LOW TIME** marker (not colour alone); in the final 10 seconds the marker reads **⚠ TIME!**, the border is dashed and (unless Reduced motion is on) the clock pulses. High-contrast mode uses a yellow-on-black version. Both clocks can show it. |
| **Spoken / live region** | *"Low time. One minute left on your clock."*, *"30 seconds left on your clock."*, *"Ten seconds left."* — each once, urgent. The opponent's low time is announced once, politely. |
| **Audible** | A four-tone alarm when your clock first reaches the warning level and at 30 s / 10 s, plus a soft tick every second in the last 10 s — only if **Sound effects** are on. |
| **Haptic** | A vibration pattern at each warning — only if **Haptic feedback** is on (visual demo on devices without vibration). |
| **Off switches** | Settings → *Low-time warning* off, or *Untimed play* (no clocks at all), or say *"Turn off low-time warning"*. |

**Try it quickly:** Home → time control **1 min** → **Play Chess** — the 1-minute clocks start at the warning level, so you see the marker immediately and hear the alarm once the clock runs. Or open Settings → Audio and haptics → **Test low-time warning**, or set *Warn me when this much time is left* to 30 seconds.

---

## 4. Blind users — nonvisual chess

| Task | How |
|---|---|
| **Board access** | The board is an ARIA grid of 64 labelled squares (e.g. *"e2, white pawn"*, *"e4, empty, legal move"*, *"e8, black king, king in check"*). |
| **Move around** | **Tab** to the board, then **arrow keys**; **Home/End** = first/last file. |
| **Select & move** | **Enter** on a piece, move to a highlighted square, **Enter** again. (**Space** is push-to-talk while that setting is on.) |
| **Speak a move** | Press **Space**, wait for “Listening”, then say your move. |
| **Read** | **R** whole board · **T** whose turn · **L** last move · **M** legal moves · **D** this square · **?** all keys. |
| **History** | **Page Up / Page Down**, or the ⏮ ◀ ▶ ⏭ buttons, or *"previous move"* / *"next move"*. |
| **Cancel** | **Esc** (selection only — no move is played). |
| **Feedback** | Illegal moves are explained (*"…would leave your king in check"*, *"The path … is blocked by…"*), plus **check, checkmate, stalemate and result** announcements. |
| **Status messages** | Sent to polite/assertive ARIA live regions; repeated messages within ~1 s are suppressed; moving between squares does not spam the live region. |

All descriptions are generated from the actual position — nothing is pre-written.

---

## 5. Low-vision users

| Task | How |
|---|---|
| Enlarge | Settings → **Text size**, **Board size**; browser zoom (Ctrl + +) also works without clipping or hidden controls. |
| High contrast | Header → *Accessibility Settings* → High contrast, or say *"Enable high contrast"*, or the toolbar toggle. |
| Tell pieces apart | Piece theme → *High-contrast bold* or *Letter labels*. |
| See states without colour | Move indicators: **SELECTED** chip + double ring; legal moves = black dot with white ring, captures = hatched double ring; **CHECK** chip + hatching; last move = from/to chips + dashed/solid inner borders. |
| Focus | **Strong focus indicators**; the keyboard cursor square always shows a dashed ring. |
| Small screens | The header stays compact (short labels at very large text sizes); content reflows to one column. |

---

## 6. Motor-impaired users

| Task | How |
|---|---|
| No precision needed | **Click-to-move**: click the piece, then the destination. No dragging required. |
| Optional dragging | Settings → Click-to-move **off** → drag pieces (clicking still works). |
| Keyboard only | Arrow keys, Enter/Space, Esc; every control is reachable by Tab. |
| Voice only | Voice Controls → *"Select e2"*, *"Move e2 to e4"*, *"Knight to f3"*, *"Cancel selection"*. |
| Larger targets | Settings → **Larger interactive targets**. |
| No time pressure | Settings → **Untimed play**; there are no timeouts on dialogs or messages. |
| Avoid accidents | **Cancel selection** (Esc) and **Undo last move** are separate buttons; draw/undo/new game/resign ask first, and **resign always asks**. |
| No hover-only features | Everything works with click, tap, keyboard or voice. |

---

## 7. Screens

| Screen | What to try |
|---|---|
| **1 Home** | Quick-access row (*Accessibility Settings*, *Open Voice Controls*, Screen reader, High contrast, Sound, Speech); big **Play Chess** button with time control; calm cards for Puzzles / Lessons / Bots; Recommended Match (dismissible); Game History → review; Daily Puzzle. |
| **2 Playing** | Full game vs a **simulated** opponent: board, clocks (or *No limit*), moves list, history buttons, draw/resign/flip, status card with **Cancel selection** and **Undo last move**, announcement transcript. |
| **3 Game Review** | Sample game with step controls, spoken move descriptions, arrows/highlights described in text, evaluation graph with a text alternative. *All marks are pre-written sample data — no engine.* |
| **4 Puzzle** | Two built-in puzzles, graded hints (**H**), wrong moves announced and taken back, solved state with sound/announcement. |
| **5 Play menu** | Accessibility card first, grouped actions, **↑/↓** moves between items, rule-enforced preview board. |

---

## 8. Suggested demo script (≈ 6 minutes)

1. Reload → **Tab** → show skip links, header buttons and the welcome message.
2. **Alt + Shift + A** → enable High contrast, raise Text size; **Esc**.
3. **Alt + Shift + V** → press the microphone → *"What is on e4?"* → *"Move e2 to e4"* → note the spoken result and that the mic turns off.
4. Type *"Resign"* → show the confirmation → Cancel.
5. On the board: **Tab**, arrows, **Enter** on g1, **M**, **Esc** (cancel vs undo).
6. Settings → Click-to-move off → drag a pawn; turn on Larger targets.
7. Review (**Page Up/Down**, **V**); Puzzle (**H**, wrong move, solve).
8. Narrow the window to phone width / zoom to 200 %.

---

## 9. What is real and what is simulated

- **Real:** the chess rules engine (legal moves, check, checkmate, stalemate, castling, en passant, promotion — verified with standard perft test positions), the board, keyboard/voice/typed input, settings, live-region announcements, sound tones, browser speech synthesis and recognition **where the browser supports them**, vibration **where the device supports it**.
- **Simulated:** the opponent (a scripted move picker — not an engine, not a person), draw replies (first declined, second accepted), review marks/graph/accuracy (sample data), only two puzzles, the Chat/Players/Tournaments/Lessons areas (explained in dialogs), no accounts or multiplayer.
- **Browser dependent:** speech recognition (Chrome/Edge, usually needs internet and microphone permission), speech voices, vibration (phones/tablets).
- **Testing note:** the behaviours above were checked with automated browser interaction tests (keyboard, simulated speech recognizer, typed commands, settings, resizing). **No formal testing with blind, low-vision or motor-impaired participants has been done**, and the prototype has not been verified with specific screen readers (NVDA, JAWS, VoiceOver, TalkBack).
