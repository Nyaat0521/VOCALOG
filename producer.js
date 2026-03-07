import { escapeHtml, getParam, loadJson, headerHtml } from "./app.js"

document.getElementById("header").innerHTML = headerHtml("producers")

const content = document.getElementById("content")
const songsBox = document.getElementById("songs")
const songsNote = document.getElementById("songsNote")
const popularBox = document.getElementById("popularSongs")
const popularNote = document.getElementById("popularNote")

const isThisWeek = (s)=> (s?.isNewWeeklyPick === true) || (s?.isWeeklyPromoted === true)

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
    const allSongs = songs.filter(s=>s.producerId === p.id)

    const repSongs = allSongs.filter(s=>s.isRepresentative === true)
    const repItems = (repSongs.length ? repSongs : allSongs)
      .sort((a,b)=>{
        const ao = (a.representativeOrder ?? 9999)
        const bo = (b.representativeOrder ?? 9999)
        if(repSongs.length && ao !== bo) return ao - bo
        const ar = (a.released || "")
        const br = (b.released || "")
        if(ar !== br) return br.localeCompare(ar)
        return (a.title || "").localeCompare(b.title || "", "ja")
      })
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
        </h3>
        <p class="muted">
        ${
          s.vocalIds?.length
            ? escapeHtml(
                s.vocalIds
                  .map(id => vMap.get(id))
                  .filter(Boolean)
                  .join(" / ")
              )
            : (s.vocalId ? escapeHtml(vMap.get(s.vocalId) || "不明") : "不明")
        }
        </p>
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

    const popularSongs = allSongs.filter(s => Number(s.popularityScore) > 0)
    const popItems = (popularSongs.length ? popularSongs : allSongs)
      .slice()
      .sort((a,b)=>{
        if(hasScore){
          const as = Number(a.popularityScore) > 0 ? Number(a.popularityScore) : -1
          const bs = Number(b.popularityScore) > 0 ? Number(b.popularityScore) : -1
          if(as !== bs) return bs - as
        }
        
        const aw = isThisWeek(a) ? 1 : 0
        const bw = isThisWeek(b) ? 1 : 0
        if(aw !== bw) return bw - aw
        const ar = (a.released || "")
        const br = (b.released || "")
        if(ar !== br) return br.localeCompare(ar)
        return (a.title || "").localeCompare(b.title || "", "ja")
      })
      .slice(0,10)

    if(popularBox){
      popularBox.innerHTML = popItems.map(s=>`
        <a class="card cardLink popularCard" href="./song.html?id=${encodeURIComponent(s.id)}">
          <h3 class="title">
            ${escapeHtml(s.title)}
          </h3>
          <p class="muted">
          ${
            s.vocalIds?.length
              ? escapeHtml(
                  s.vocalIds
                    .map(id => vMap.get(id))
                    .filter(Boolean)
                    .join(" / ")
                )
              : (s.vocalId ? escapeHtml(vMap.get(s.vocalId) || "不明") : "不明")
          }
          </p>
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
