# Rescue Dashboard — static pages (GitHub Pages)

Only HTML, CSS and JavaScript. No Flask, no database, no hardware needed.
The pages run on **sample data** (a snapshot of the project's data) that
`static/mock-api.js` serves in the browser. Nothing is saved; refreshing
resets the demo.

## Pages
- `index.html` — landing page (User / Admin)
- `user.html` — user view (any phone + password logs in)
- `admin.html` — admin map and alerts (any passcode works)
- `admin_analytics.html` — analytics charts

## Publish on GitHub Pages
1. Create a repo on github.com and upload everything in this folder
   (keep the `static` folder and the `.nojekyll` file).
2. Repo **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*,
   Branch = `main`, folder = `/ (root)`, then Save.
3. After a minute the site is at `https://<your-username>.github.io/<repo-name>/`.

## Notes
- The map tiles and Leaflet load from the internet, so the viewer needs a connection.
- The real system (ESP32 → LoRa → Nano → admin map) still needs the Flask app
  (`app.py`) running; these pages are only a look-and-feel preview.
- No Telegram tokens, WiFi passwords or database files are included here.
