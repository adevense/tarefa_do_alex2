# Frontend Mentor - Typing Speed Test

## Table of contents

- [Overview](#overview)
  - [The challenge](#the-challenge)
  - [Screenshot](#screenshot)
  - [Links](#links)
- [My process](#my-process)
  - [Built with](#built-with)
  - [What I learned](#what-i-learned)
  - [Continued development](#continued-development)
- [Author](#author)

## Overview

### The challenge

Users should be able to:

- Choose a difficulty (Easy, Medium, Hard) and a mode (Timed 60s or Passage) before starting
- Type a randomly selected passage and see live feedback: correct characters in green, incorrect characters underlined in red, and the current character highlighted
- See live stats while typing: words per minute (WPM), accuracy and elapsed/remaining time
- See a results summary at the end of the test: final WPM, accuracy and correct/incorrect character count
- Beat their personal best, persisted between sessions via `localStorage`
- Restart the test at any point, or start a new attempt from the results screen
- View the optimal layout depending on their device's screen size
- Navigate the whole interface using only the keyboard

### Screenshot

![Typing Speed Test screenshot](./design/desktop-started.jpg)

### Links

- Live Site URL: _add your deployed URL here_
- Repository URL: _add your repository URL here_

## My process

### Built with

- Semantic HTML5 (`header`, `main`, `footer`, `fieldset`/`legend`, `dl`)
- CSS custom properties for a single source of truth for colors, radii and motion tokens
- CSS Grid/Flexbox with fluid sizing (`rem`, `clamp()`) — no fixed pixel widths
- Vanilla JavaScript (ES2020+), no frameworks or build tools
- `fetch` + `data.json` to decouple passage content from markup/logic
- `localStorage` for persisting the personal best across sessions
- Mobile-first responsive workflow

### What I learned

- **Accessible custom radio groups**: instead of building a "button group" with `role="radiogroup"` and manual keyboard handling in JS, I used native `<input type="radio">` elements visually hidden and styled their `<label>` as the visible button (`.option-input:checked + .option-btn`). This gives keyboard navigation, focus management and state (`:checked`) for free from the browser.
- **Keeping ARIA noise low on purpose**: the passage re-renders a `<span>` per keystroke, so I deliberately marked it `aria-hidden="true"` and drive all typing through a real, labelled `<input>` instead. The final result panel uses `role="status" aria-live="polite"` so it is announced exactly once, when the test ends.
- **CSS custom properties as the single source of truth**: centralizing colors/radii in `:root` means a palette change is now a one-line edit instead of touching dozens of declarations.
- **`rem` instead of `px` for typography**: respects the user's browser font-size setting, a real accessibility requirement.

### Continued development

- Add a small on-screen keyboard visualization highlighting the next key to press.
- Persist personal bests per difficulty/mode combination instead of a single global value.
- Add unit tests for the WPM/accuracy calculation (`computeStats`), since it is a pure function.
- Consider a `<select>`-based fallback for the option groups on very small viewports.

## Author

- Frontend Mentor - [@yourusername](https://www.frontendmentor.io/profile/yourusername)

## Acknowledgments

Challenge provided by [Frontend Mentor](https://www.frontendmentor.io?ref=challenge).