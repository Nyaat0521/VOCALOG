import { escapeHtml, getParam, loadJson, headerHtml } from "./app.js"

document.getElementById("header").innerHTML = headerHtml("producers")

const content = document.getElementById("content")
const songsBox = document.getElementById("songs")

async function main(){
  try{
    const [producers, songs, vocals] = await Promise.all([
      loadJson("./data/producers.json"),
      loadJson("./data/songs.json"),
      loadJson("./data/vocals.json"),
    ])

    const id = getParam("id")
    const p = producers.find(x=>x.id === id)
    if(!p){ content.innerHTML = `<p>見つからなかった</p>`; return }

    document.title = `${p.name} - VOCALOG`

    const links = p.links || {}
    const linkHtml = `
      <div class="links">
        ${links.youtube ? `<a class="link" target="_blank" rel="noopener" href="${links.youtube}">YouTube</a>` : ""}
        ${links.x ? `<a class="link" target="_blank" rel="noopener" href="${links.x}">X</a>` : ""}
        ${links.website ? `<a class="link" target="_blank" rel="noopener" href="${links.website}">Web</a>` : ""}
      </div>
    `

    content.innerHTML = `
      <h2 class="title">
        ${escapeHtml(p.name)}
        ${p.nameKana ? `<span class="reading">(${escapeHtml(p.nameKana)})</span>` : ""}
      </h2>
      ${p.activeYears ? `<p class="muted">活動：${escapeHtml(p.activeYears)}</p>` : ""}
      ${p.aliases?.length ? `<p class="muted">別名：${p.aliases.map(escapeHtml).join(" / ")}</p>` : ""}
      ${p.summary ? `<p>${escapeHtml(p.summary)}</p>` : ""}
      ${linkHtml}
    `

    const vMap = new Map(vocals.map(v=>[v.id, v.name]))

    const items = songs
      .filter(s=>s.producerId === p.id)
      .sort((a,b)=> (b.released||"").localeCompare(a.released||""))
      .slice(0,10)

    songsBox.innerHTML = items.map(s=>`
      <a class="card cardLink" href="./song.html?id=${encodeURIComponent(s.id)}">
        <h3 class="title">${escapeHtml(s.title)}</h3>
        <p class="muted">${escapeHtml(vMap.get(s.vocalId) || "不明")}</p>
        ${s.released ? `<p class="muted">🗓 ${escapeHtml(s.released)}</p>` : ""}
        ${s.summary ? `<p class="muted">${escapeHtml(s.summary)}</p>` : ""}
      </a>
    `).join("") || `<p class="muted">まだ曲データがない</p>`
  }catch(err){
    content.innerHTML = `<p>読み込み失敗: ${escapeHtml(err.message)}</p>`
  }
}
main()

