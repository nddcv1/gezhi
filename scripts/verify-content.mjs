import { readFileSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const file = new URL('../src/data/content.json', import.meta.url)
const data = JSON.parse(readFileSync(file, 'utf8'))
const sleep = ms => new Promise(r => setTimeout(r, ms))

let errors = 0
for (const item of data.items) {
  if (!item.bvid) {
    console.log(`SKIP  ${item.id}  (no bvid)`)
    continue
  }
  if (!/^BV[0-9A-Za-z]{10}$/.test(item.bvid)) {
    console.log(`BAD   ${item.id}  invalid bvid format: ${item.bvid}`)
    errors++
    continue
  }
  if (item.id !== item.bvid.toLowerCase()) {
    console.log(`BAD   ${item.id}  id must equal bvid.toLowerCase()`)
    errors++
  }
  try {
    const res = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${item.bvid}`, {
      headers: { 'User-Agent': UA, Referer: 'https://www.bilibili.com/' },
    })
    const json = await res.json()
    if (json.code !== 0) {
      console.log(`DEAD  ${item.bvid}  code=${json.code}  ${item.title}`)
      errors++
    } else {
      console.log(`OK    ${item.bvid}  ${json.data.title}`)
    }
  } catch (err) {
    console.log(`ERR   ${item.bvid}  ${err.message}`)
    errors++
  }
  await sleep(1200)
}

console.log(`\n${data.items.length} items, ${errors} error(s)`)
process.exit(errors > 0 ? 1 : 0)
