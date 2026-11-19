import crypto from 'node:crypto'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const MIXIN = [46,47,18,2,53,8,23,32,15,50,10,31,58,3,45,35,27,43,5,49,33,9,42,19,29,28,14,39,12,38,41,13,37,48,7,16,24,55,40,61,26,17,0,1,60,51,30,4,22,25,54,21,56,59,6,63,57,62,11,36,20,34,44,52]
let cookie = ''

async function nav() {
  const res = await fetch('https://api.bilibili.com/x/web-interface/nav', { headers: { 'User-Agent': UA } })
  const setCookies = res.headers.getSetCookie?.() ?? []
  cookie = setCookies.map(c => c.split(';')[0]).join('; ')
  const json = await res.json()
  const img = json.data?.wbi_img?.img_url?.split('/').pop()?.split('.')[0] ?? ''
  const sub = json.data?.wbi_img?.sub_url?.split('/').pop()?.split('.')[0] ?? ''
  if (!img || !sub) throw new Error('wbi keys not found')
  return { img, sub }
}

function sign(params, imgKey, subKey) {
  const key = MIXIN.map(i => (imgKey + subKey)[i]).slice(0, 32).join('')
  const query = Object.keys(params).sort().map(k => {
    const v = String(params[k]).replace(/[!'()*]/g, '')
    return `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
  }).join('&')
  const w_rid = crypto.createHash('md5').update(query + key).digest('hex')
  return `${query}&w_rid=${w_rid}`
}

async function search(keyword) {
  const { img, sub } = await nav()
  const params = { search_type: 'video', keyword, page: 1, page_size: 20 }
  const query = sign({ ...params, wts: Math.floor(Date.now() / 1000) }, img, sub)
  const res = await fetch(`https://api.bilibili.com/x/web-interface/wbi/search/type?${query}`, {
    headers: { 'User-Agent': UA, Referer: 'https://www.bilibili.com/', Cookie: cookie },
  })
  const json = await res.json()
  if (json.code !== 0) throw new Error(`search failed: code=${json.code} ${json.message ?? ''}`)
  return (json.data?.result ?? []).map(v => ({
    bvid: v.bvid,
    title: String(v.title).replace(/<[^>]+>/g, ''),
    author: v.author,
    duration: v.duration,
    play: v.play,
  }))
}

const keyword = process.argv.slice(2).join(' ')
if (!keyword) {
  console.error('usage: node scripts/bili-search.mjs 关键词')
  process.exit(1)
}
const results = await search(keyword)
for (const r of results) console.log(`${r.bvid}\t${r.author}\t${r.play}\t${r.title}`)
