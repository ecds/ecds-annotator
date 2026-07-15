# ecds-annotator

React component for annotating IIIF images. Supports drawing shapes over images and highlighting OCR text, both backed by a W3C Web Annotation server.

## Requirements

- Node 18+
- The [readux](../readux) Django app (for local integration)

---

## Local development with readux

The annotator is consumed by readux directly from source — readux's Vite build resolves `ecds-annotator` to `../ecds-annotator/src/index.jsx` via an alias, so no build step is needed here.

**First-time setup**

```bash
# In this repo — build generates dist/style.css, which readux's postinstall copies
npm install
npm run build

# In readux
cd ../readux
npm install          # postinstall copies dist/style.css → apps/static/css/ecds-annotator.min.css
```

`dist/` is git-ignored. Re-run `npm run build` here any time you change CSS; JS changes are picked up from source automatically.

**HTTPS certificate (one-time)**

readux requires HTTPS. Use [`mkcert`](https://github.com/FiloSottile/mkcert) to create a locally-trusted certificate — this avoids browser warnings without any per-request confirmation.

```bash
# Install mkcert (macOS)
brew install mkcert
mkcert -install          # installs the local CA into the system trust store

# Generate certs in the readux directory
cd ../readux
mkcert localhost          # creates localhost.pem and localhost-key.pem
```

The cert files are already present in the readux repo if a teammate generated them — `mkcert -install` is still required on each new machine to trust the CA.

**Running the dev server**

Start readux's watch build, then the Django HTTPS server:

```bash
# Terminal 1 — rebuilds main.js on every source change
cd ../readux
npm run dev

# Terminal 2 — Django dev server over HTTPS (via django-extensions)
cd ../readux
python manage.py runserver_plus --cert-file localhost.pem --key-file localhost-key.pem
```

Open `https://localhost:8000`. Changes to any file under `src/` are picked up automatically by the `--watch` build — reload the browser after it finishes.

**Standalone Vite dev server** (optional — useful for isolated UI work without Django)

```bash
npm run dev
# opens http://localhost:3000
```

Edit `index.html` at the repo root to point at a real IIIF manifest URL.

---

## Preparing a build for deploy

Production builds are handled automatically by readux's GitHub Actions workflow (`.github/workflows/depoly.yml`). No manual build step is required here — push to `main` or `develop` in readux and the pipeline takes care of everything.

**How it works**

1. The GH Actions workflow checks out both readux *and* this repo (into `ecds-annotator/` inside the readux workspace) before building the Docker image.
2. The Docker `js-builder` stage installs and builds ecds-annotator first, generating `dist/style.css`.
3. readux's `npm install` runs next — its `postinstall` script copies `dist/style.css` into Django's static directory, and the Vite alias points at the ecds-annotator source for the JS build.
4. `npm run build` compiles everything into `apps/static/js/main.js`.
5. The production stage copies the built assets from `js-builder` and runs `collectstatic` at startup via `entrypoint.sh`.

**If you need to verify the production build locally**

```bash
# From the readux repo root — requires ecds-annotator checked out as a sibling
cd ../readux
docker build --target js-builder -t readux-js-test .
```

This only runs the JS build stage and lets you inspect `apps/static/js/main.js` without standing up the full container.

---

## Architecture notes

- **Vite lib mode** — `vite build` here outputs ES and UMD bundles to `dist/`. Only the CSS is used by readux in production; the JS bundles exist if the component is ever consumed standalone.
- **Source alias in readux** — `readux/vite.config.mjs` aliases `ecds-annotator` → `../ecds-annotator/src/index.jsx`. This lets Rollup tree-shake and compile everything together, avoiding CJS interop issues from double-bundling a pre-built package.
- **IIFE output** — readux's Vite outputs `main.js` as an IIFE so Django can load it with a plain `<script>` tag (no `type="module"` required).
- **react-draggable stub** — `react-draggable` is aliased to a no-op passthrough in readux's Vite config. The upstream package calls `ReactDOM.findDOMNode`, which is absent from the React 18 production bundle. The editor popup is fixed-position rather than draggable as a result.
