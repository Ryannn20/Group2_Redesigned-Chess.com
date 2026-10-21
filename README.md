# AcChess — Play Without Barriers ♟️

**An Academic HCI Prototype for Accessible Chess Interfaces**

## ⚠️ Disclaimer

AcChess is a student-developed academic prototype created for educational and research purposes as part of a Human–Computer Interaction (HCI) project.

**AcChess is not an official Chess.com product.** It is not affiliated with, endorsed by, sponsored by, or operated by Chess.com. The project is an independent redesign concept inspired by the interface and interaction patterns of existing online chess platforms.

This project is not connected to Chess.com servers and does not provide official Chess.com accounts, online multiplayer services, rankings, subscriptions, or other official platform services.

## 🎓 Project Purpose

AcChess explores how multimodal interaction and accessibility-focused interface design can help reduce barriers to playing and learning chess.

The prototype focuses on improving usability for:

- **Blind users:** screen-reader support, keyboard navigation, and spoken board descriptions.
- **Low-vision users:** high contrast, adjustable text and board sizes, and clearer visual indicators.
- **Users with motor impairments:** alternative input methods, keyboard controls, voice commands, and larger interactive targets.

The project applies Human–Computer Interaction (HCI) principles to explore discoverability, feedback, consistency, error prevention, user control, and inclusive interaction.

## 🧩 Prototype Features

Depending on the current implementation, AcChess may include:

- Home dashboard and chess-playing interface.
- Game review and puzzle demonstrations.
- Accessibility settings and visual customization.
- Keyboard navigation and shortcuts.
- Voice-control interface and typed command alternatives.
- Spoken feedback and board descriptions.
- High-contrast and text-size options.
- Responsive layouts for desktop, tablet, and mobile devices.

Some features may be simulated or partially implemented. The presence of a control in the interface does not necessarily mean it provides a fully functional service. Please refer to the actual implementation when evaluating feature support.

## 🧪 Academic and Evaluation Notice

AcChess is a prototype intended for demonstration, iterative design, and usability evaluation. It should not be considered a validated accessibility product or a substitute for a fully tested chess platform.

Any demonstration content, sample moves, opponent behavior, analysis, or puzzle solutions should be treated as illustrative unless explicitly verified by the implementation.

No claims of formal accessibility certification, completed user testing, or proven usability outcomes are made unless supported by documented testing results.

## 🔒 Privacy and Data

Do not enter passwords, sensitive personal information, or confidential information into this prototype.

If browser features such as speech recognition or microphone access are implemented, their behavior may depend on the browser, device, permissions, and external services involved. Review the implementation and relevant browser privacy settings before using these features.

Do not assume that information is stored securely, transmitted privately, or deleted automatically unless the implementation explicitly provides and verifies those behaviors.

## 🖥️ Usage

AcChess may be run locally in a compatible web browser or hosted as a static website, for example through GitHub Pages, depending on its implementation.

Some browser-dependent features may require a secure context, compatible browser support, or additional configuration.

## ▶️ Running the prototype

| Way | How |
|---|---|
| Quickest | Double-click `index.html` (Chrome or Edge). It is one self-contained file and needs no backend. |
| Recommended (microphone is asked only once) | Double-click `start-acchess.bat`. It serves the folder at `http://localhost:5188/` (needs Python). |
| Rebuild after editing `src/` | `python build.py` assembles `index.html` from `src/`. |

## 🆕 Phase 2 — redesigned interface

The five screens (Home, Playing, Game Review, Puzzle, Play Menu) were redesigned in place; Phase 1 features were kept.

- **Home:** one clear next action (Start/Continue playing) and three grouped cards.
- **Global Quick settings bar** at the top of every screen: Screen reader, High contrast, Sound, Speech, Vibration.
- **Playing:** board-first two-column layout, status strip, Game status card, Cancel selection and Undo kept separate, illegal moves marked and explained.
- **Game Review:** timeline and plain-language explanation panel, everything labelled as sample data.
- **Puzzle:** objective, Hint / Try again / Next puzzle in one place, text-and-icon feedback.
- **Play Menu:** four labelled groups and an honest "not available" list.
- **Settings:** four categories, new Volume control, speech rate up to 3×, board size up to 200 %, preferences saved in this browser, Reset.
- **Help** dialog with shortcuts and example voice commands, available on every screen.

| File or folder | Contents |
|---|---|
| `index.html` | The prototype (self-contained; this is all you need to run it) |
| `src/`, `build.py` | Source files and the script that builds `index.html` (`build.py` also reads `chesscom-current.html`) |
| `chesscom-current.html` | Recreation of the current Chess.com UI, used by the "Compare" link |
| `start-acchess.bat` | Optional local server so the microphone permission is asked only once |
| `MANUAL.md` | How to try every feature |
| `screenshots/` | All screens at desktop, laptop, tablet and phone sizes |

**Data stored in your browser:** accessibility preferences and the dismissed welcome card (localStorage, this device only, nothing is sent anywhere). *Reset all to defaults* in Accessibility Settings clears the preferences.

**Evaluation status:** no usability sessions with blind, low-vision or motor-impaired participants have been run, and the prototype has not been checked with real screen readers, a real microphone or real devices. It was only checked with automated tests in desktop Chrome.

## 🛠️ Technology

The project may use HTML, CSS, JavaScript, browser accessibility APIs, and other libraries or tools included in the implementation.

Refer to the repository files for the actual technologies and dependencies used.

## 🏷️ Intellectual Property and Attribution

Chess.com names, trademarks, logos, and other third-party assets remain the property of their respective owners.

Any third-party assets or libraries included in this repository remain subject to their applicable licenses and terms.

AcChess is an independent academic prototype. It does not claim ownership of third-party trademarks or assets. The project should not be interpreted as an official Chess.com application.

## 📌 Limitations

- The prototype may not implement every feature of a production chess platform.
- Accessibility behavior may vary across browsers, devices, and assistive technologies.
- Voice recognition and other browser-dependent features may be unavailable in some environments.
- Responsive behavior and accessibility must be tested on the devices and assistive technologies intended for use.
- No formal accessibility conformance is claimed without appropriate verification.

---

**AcChess — Play Without Barriers**

*An academic exploration of more inclusive chess interaction.*
