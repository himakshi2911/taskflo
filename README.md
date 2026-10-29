# TaskFlow — Student Productivity Dashboard

A responsive frontend project built for DecodeLabs Full Stack Development Project 1.

## Built with
- HTML5 semantic elements
- CSS3 (mobile-first layout, CSS Grid, Flexbox, media queries)
- Vanilla JavaScript
- Browser `localStorage` for task and theme persistence

No framework or backend is required.

## Run locally
1. Extract the `taskflow-project.zip` file.
2. Open the `taskflow` folder in VS Code.
3. Open `index.html` directly in a browser, or use the VS Code Live Server extension if installed.
4. Try adding, completing, searching, filtering, and deleting tasks. Refresh the page to test persistence.

The Google Fonts link is optional; the page falls back to sans-serif fonts if you are offline.

## Features
- Responsive dashboard for phone, tablet, and desktop widths
- Semantic landmarks, skip link, accessible labels, keyboard focus indicators
- Add tasks with category, priority, and due date
- Mark tasks complete/incomplete and delete tasks
- Search and filter tasks
- Dynamic totals and progress ring
- Clear completed tasks
- 25-minute focus timer with pause/resume/reset
- Dark/light theme toggle
- Saves tasks and theme in localStorage

## Suggested final audit
- Test at approximately 375px, 768px, and 1280px widths using browser developer tools.
- Test all buttons and the task form with mouse and keyboard.
- Confirm the browser console has no errors.
- Check text contrast and the accessibility tree.
- Run Lighthouse in Chrome DevTools and review Performance and Accessibility results.
- Capture screenshots of desktop and mobile layouts for your submission if requested.

## Project blueprint
**Problem hypothesis:** Students need a simple place to organize academic and personal tasks and see progress.

**Target users:** College students.

**Design direction:** Warm, grounded neutral palette with mocha, muted blue, and soft sage accents. Maximum two font families (DM Sans and Manrope) and three font weights.

**Main user flow:** Open dashboard → review tasks → add/search/filter tasks → mark complete or delete → see progress update.

**Limitations:** This is a frontend demo. Data stays in the current browser's localStorage and is not synced across devices or accounts. The sample tasks are illustrative; replace them with your own before presenting.
