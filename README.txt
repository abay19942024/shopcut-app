ShopCut (Full) — Static Web App
================================
This is the full working version of ShopCut: a local-first ledger for shop cuts.
It runs entirely in the browser (no backend). Data persists to localStorage.

Files
-----
- index.html — UI layout and modals
- style.css — dark/light theme, purple stencil collage background
- app.js — all logic (people, ledger, filters, weekly, export/import, theme)
- assets/tattoo-machine.svg — icon
- shopcut-sample.csv — example data for import

Run Locally
-----------
1) Open index.html in a modern browser (Chrome, Edge, Safari).
2) Add people and entries; data saves to your browser on this device.
3) Export CSV to move data; Import CSV to load it on another device.

Deploy to Vercel (from GitHub)
------------------------------
1) Create a GitHub repo (e.g. shopcut-app) and upload these files (not the zip).
2) In Vercel → New Project → Import Git Repository → pick that repo → Deploy.
3) Vercel gives you a link like https://shopcut-<yourname>.vercel.app
4) On iPhone, open the link and Add to Home Screen for an app-like icon.

Notes
-----
- Percent mode: toggle “Percent is Shop” if the saved % is the shop’s cut.
  If off, % is treated as the artist’s cut (shop gets the remainder).
- Weekly Report: choose a week start, click Build, then Email or Copy.
- Theme: pick font/mode/accent; background density controls the purple collage.
