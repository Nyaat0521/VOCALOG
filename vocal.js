import { escapeHtml, getParam, loadJson, headerHtml } from "./app.js"

document.getElementById("header").innerHTML = headerHtml("vocals")

const content = document.getElementById("content")
const songsBox = document.getElementById("songs")

function buildVocalNameToId(vocalsArr){
  const m = new Map()
  for(const v of vocalsArr){
    if(v && v.name) m.set(v.name, v.id)
  }
  return m
}
function resolveVocalIds(song, vocalsArr){
  if(song && Array.isArray(song.vocalIds) && song.vocalIds.length) return song.vocalIds
  const nameToId = resolveVocalIds._nameToId || (resolveVocalIds._nameToId = buildVocalNameToId(vocalsArr))
  const ids = []
  for(const t of (song.tags || [])){
    const id = nameToId.get(t)
    if(id && !ids.includes(id)) ids.push(id)
  }
  if(ids.length) return ids
  return song.vocalId ? [song.vocalId] : []
}


async function main(){
  try{
    const [vocals, songs, producers] = await Promise.all([
      loadJson("./data/vocals.json"),
      loadJson("./data/songs.json"),
      loadJson("./data/producers.json"),
    ])

    const id = getParam("id")
    const v = vocals.find(x=>x.id === id)
    if(!v){ content.innerHTML = `<p>見つからなかった</p>`; return }

    document.title = `${v.name} - VOCALOG`

    const links = v.links || {}
    const linkHtml = `
      <div class="links">
        ${links.official ? `<a class="link" target="_blank" rel="noopener" href="${links.official}">公式</a>` : ""}
        ${links.wikipedia ? `<a class="link" target="_blank" rel="noopener" href="${links.wikipedia}">Wikipedia</a>` : ""}
      </div>
    `

    content.innerHTML = `
      <h2 class="title">
        ${escapeHtml(v.name)}
        ${v.nameKana ? `<span class="reading">(${escapeHtml(v.nameKana)})</span>` : ""}
      </h2>
      ${v.engine ? `<p class="muted">エンジン：${escapeHtml(v.engine)}</p>` : ""}
      ${v.summary ? `<p>${escapeHtml(v.summary)}</p>` : ""}
      ${linkHtml}
    `

    const pMap = new Map(producers.map(p=>[p.id, p.name]))

    const items = songs
      .filter(s=> resolveVocalIds(s, vocals).includes(v.id))
      .sort((a,b)=> (b.released||"").localeCompare(a.released||""))
      .slice(0,10)

    songsBox.innerHTML = items.map(s=>`
      <a class="card cardLink" href="./song.html?id=${encodeURIComponent(s.id)}">
        <h3 class="title">${escapeHtml(s.title)}</h3>
        <p class="muted">${escapeHtml(pMap.get(s.producerId) || "不明")}</p>
        ${s.released ? `<p class="muted">🗓 ${escapeHtml(s.released)}</p>` : ""}
        ${s.summary ? `<p class="muted">${escapeHtml(s.summary)}</p>` : ""}
      </a>
    `).join("") || `<p class="muted">まだ曲データがない</p>`
  }catch(err){
    content.innerHTML = `<p>読み込み失敗: ${escapeHtml(err.message)}</p>`
  }
}
main()

