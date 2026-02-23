# Plate Quiz (Lightweight Frontend)

A minimal frontend quiz game where each question asks:

**"Which state does this nickname belong to?"**

Users get 4 multiple-choice state options. Correct answers play a short happy tune, wrong answers play a short sad tune.

## Tech Choices

- Frontend: Plain `HTML + CSS + JavaScript` (no framework, no build step)
- Excel parsing: [`SheetJS/xlsx`](https://github.com/SheetJS/sheetjs) via CDN
- Audio feedback: Web Audio API (generated tones, no media files)
- Deployment: Vercel static site
- Versioning: Git

This is intentionally lightweight so you can add backend complexity later.

## Bundled Dataset

The project includes your file:

- `US_States_License_Plate_Nicknames.xlsx`

It auto-loads on app startup. Users can still upload a different file at runtime.

## Expected Excel Format

Upload `.xlsx`, `.xls`, or `.csv` with columns containing:

- `state`
- `nickname`

Column names are flexible; the app tries to detect matching fields.

Example rows:

| state | nickname |
|---|---|
| California | The Golden State |
| Texas | The Lone Star State |

## Run Locally

Because this is static, you can open `index.html` directly.

Or run a tiny local server:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo in Vercel.
3. Framework preset: `Other`.
4. Build command: *(leave empty)*.
5. Output directory: *(leave empty)*.

Vercel will serve the static files directly.

## Git Quick Start

```bash
git init
git add .
git commit -m "feat: initial lightweight plate quiz frontend"
```
