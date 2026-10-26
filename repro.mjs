// Builds the app twice, changing only the color in app/assets/main.css (the
// entry CSS), then lists the client files that keep their name across both
// builds while their content differs.
import { execSync } from 'node:child_process'
import { cp, readFile, readdir, rm, writeFile } from 'node:fs/promises'

const css = 'app/assets/main.css'
const original = await readFile(css, 'utf8')

async function buildWith(color, copyTo) {
  await writeFile(css, `body {\n  color: ${color};\n}\n`)
  execSync('npx nuxi build', { stdio: 'ignore' })
  await rm(copyTo, { recursive: true, force: true })
  await cp('.output/public/_nuxt', copyTo, { recursive: true })
}

try {
  await buildWith('red', 'build-a')
  await buildWith('blue', 'build-b')
} finally {
  await writeFile(css, original)
}

const js = async (dir) => (await readdir(dir)).filter((file) => file.endsWith('.js'))
const a = await js('build-a')
const b = new Set(await js('build-b'))

let stale = 0
for (const file of a) {
  if (!b.has(file)) continue
  const [before, after] = await Promise.all([readFile(`build-a/${file}`, 'utf8'), readFile(`build-b/${file}`, 'utf8')])
  if (before === after) continue
  stale++
  console.log(`Same name, different content: ${file}`)
  console.log('  build A:', before.match(/m\.f=\[[^\]]*\]/)?.[0])
  console.log('  build B:', after.match(/m\.f=\[[^\]]*\]/)?.[0])
}
console.log(stale ? `\n${stale} file(s) changed without changing name.` : 'Every changed file got a new name.')
process.exitCode = stale ? 1 : 0
