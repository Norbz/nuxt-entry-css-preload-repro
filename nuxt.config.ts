export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  // Global CSS: it lands in the entry CSS file (`entry.<hash>.css`).
  css: ['~/assets/main.css'],
  // `npm run repro:control` turns the entry import map off.
  experimental: { entryImportMap: process.env.ENTRY_IMPORT_MAP !== 'false' },
})
