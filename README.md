# Nuxt: a chunk keeps its name when the entry CSS changes

With `experimental.entryImportMap` (on by default), a client chunk that holds a
dynamic import keeps its file name when only the entry CSS changes, although
its content changes. The chunk lists `entry.<hash>.css` among the files to
preload before the import (`__vite__mapDeps`), and that hash is part of the
content but not of the file name.

Tracked in [nuxt/nuxt#36136](https://github.com/nuxt/nuxt/issues/36136).

## Reproduction

```bash
npm install
npm run repro
```

`repro.mjs` builds the app twice, changing only the color in
`app/assets/main.css`, and compares `.output/public/_nuxt` between both builds.

Actual output (Nuxt 4.6.2, Vite 8.3.5, Node 24):

```
Same name, different content: D2u7XsRH.js
  build A: m.f=["./_OYD1JLE.js","./entry.W1erjkBN.css","./Panel.DBBZvA4U.css"]
  build B: m.f=["./_OYD1JLE.js","./entry.CV0MLID1.css","./Panel.DBBZvA4U.css"]

1 file(s) changed without changing name.
```

`D2u7XsRH.js` is the chunk of `pages/index.vue`, which renders
`<LazyPanel>`. Expected: every file whose content changes gets a new name.

Control, with `entryImportMap: false`:

```bash
npm run repro:control
```

```
Every changed file got a new name.
```

## Cause

The `nuxt:stable-entry` plugin of `@nuxt/vite-builder` rewrites the imports of
the entry chunk to `#entry` in `renderChunk`, so that a chunk importing the
entry keeps its hash when the entry changes. Its `resolveDependencies` drops the
entry JS from the preloaded dependencies, but keeps the entry CSS. Vite writes
those dependencies into the chunk in `generateBundle`, after the file names are
final, so the new `entry.<hash>.css` changes the content of a chunk whose name
was computed without it.

The entry CSS is already linked by the server-rendered HTML, so dropping it from
the preloaded dependencies as well looks like a possible fix.

## Impact

`/_nuxt/` files are served with `immutable` and a one-year `max-age`. After a
deploy that changes only the global CSS, a browser or a CDN keeps serving the
previous content under the same name:

- With Subresource Integrity (for example through `nuxt-security`), the HTML
  carries the hash of the new content, the browser blocks the cached file and
  the page fails with `Failed to fetch dynamically imported module`.
- Without SRI, the stale chunk preloads the previous `entry.<hash>.css`, which
  is either served from a cache and applied over the new styles, or missing
  after the deploy.
