import { escapeHtml, getParam, loadJson, headerHtml } from "./app.js"

document.getElementById("header").innerHTML = headerHtml("vocals")

const content = document.getElementById("content")
const songsBox = document.getElementById("songs")
const songsNote = document.getElementById("songsNote")
const popularBox = document.getElementById("popularSongs")
const popularNote = document.getElementById("popularNote")

const isThisWeek = (s)=> (s?.isNewWeeklyPick === true) || (s?.isWeeklyPromoted === true)
const safe = (v)=> v == null ? "" : String(v)

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
      ${v.released ? `<p class="muted">発売：${escapeHtml(v.released)}</p>` : ""}
      ${v.developer ? `<p class="muted">開発：${escapeHtml(v.developer)}</p>` : ""}
      ${v.voiceProvider ? `<p class="muted">声：${escapeHtml(v.voiceProvider)}</p>` : ""}
      ${v.summary ? `<p>${escapeHtml(v.summary)}</p>` : ""}
      ${linkHtml}
    `

    const pMap = new Map(producers.map(p=>[p.id, p.name]))

    const allSongs = songs.filter(s=>{
      if(s.vocalIds?.length) return s.vocalIds.includes(v.id)
      if(s.vocalId) return s.vocalId === v.id
      
      return (s.tags || []).includes(v.name)
    })

    const repSongs = allSongs.filter(s=>s.isRepresentative === true)
    const repItems = (repSongs.length ? repSongs : allSongs)
      .sort((a,b)=> safe(b.released).localeCompare(safe(a.released)) || safe(a.title).localeCompare(safe(b.title),"ja"))
      .slice(0,10)

    if(songsNote){
      songsNote.textContent = repSongs.length
        ? ""
        : "代表曲未設定のため、最新曲を表示中"
    }

    songsBox.innerHTML = repItems.map(s=>`
      <a class="card cardLink repCard" href="./song.html?id=${encodeURIComponent(s.id)}">
        <h3 class="title">
          ${escapeHtml(s.title)}
          <span class="badge">代表</span>
          ${isThisWeek(s) ? `<span class="badge">今週</span>` : ``}
        </h3>
        <p class="muted">${escapeHtml(pMap.get(s.producerId) || "不明")}</p>
        ${s.released ? `<p class="muted dateLabel">公開：${escapeHtml(s.released)}</p>` : ""}
        ${s.summary ? `<p class="muted">${escapeHtml(s.summary)}</p>` : ""}
      </a>
    `).join("") || `<p class="muted">まだ曲データがない</p>`

    const hasScore = allSongs.some(s=> Number(s.popularityScore) > 0)

    if(popularNote){
      popularNote.textContent = hasScore
        ? ""
        : "人気曲未設定のため、最新曲を表示中"
    }

    const popItems = allSongs
      .slice()
      .sort((a,b)=>{
        if(hasScore){
          const as = Number(a.popularityScore) > 0 ? Number(a.popularityScore) : -1
          const bs = Number(b.popularityScore) > 0 ? Number(b.popularityScore) : -1
          if(as != bs) return bs - as
        }
        const aw = isThisWeek(a) ? 1 : 0
        const bw = isThisWeek(b) ? 1 : 0
        if(aw !== bw) return bw - aw
        return safe(b.released).localeCompare(safe(a.released)) || safe(a.title).localeCompare(safe(b.title),"ja")
      })
      .slice(0,10)

    if(popularBox){
      
      popularBox.innerHTML = popItems.map(s=>`
        <a class="card cardLink popularCard" href="./song.html?id=${encodeURIComponent(s.id)}">
          <h3 class="title">
            ${escapeHtml(s.title)}
            <span class="badge">人気</span>
            ${isThisWeek(s) ? `<span class="badge">今週</span>` : ``}
          </h3>
          <p class="muted">${escapeHtml(pMap.get(s.producerId) || "不明")}</p>
          ${s.released ? `<p class="muted dateLabel">公開：${escapeHtml(s.released)}</p>` : ""}
          ${s.summary ? `<p class="muted">${escapeHtml(s.summary)}</p>` : ""}
        </a>
      `).join("") || `<p class="muted">まだ曲データがない</p>`
    }
  }catch(err){
    content.innerHTML = `<p>読み込み失敗: ${escapeHtml(err.message)}</p>`
  }
}
main()
