import { escapeHtml, getParam, loadJson, headerHtml } from "./app.js"

document.getElementById("header").innerHTML = headerHtml("vocals")

const content = document.getElementById("content")
const songsBox = document.getElementById("songs")
const songsNote = document.getElementById("songsNote")
const popularBox = document.getElementById("popularSongs")
const popularNote = document.getElementById("popularNote")

// --- Multi-vocal support (duet etc.) ---
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
    const vMap = new Map(vocals.map(v=>[v.id, v.name]))

    const allSongs = songs.filter(s=> resolveVocalIds(s, vocals).includes(v.id))

    // --- Representative songs ---
    const repSongs = allSongs.filter(s=> s.isRepresentative === true)
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
        ? "代表曲を表示中（songs.json の isRepresentative: true）"
        : "代表曲は現在準備中（代わりに新着順を表示）"
    }

    songsBox.innerHTML = repItems.map(s=>`
      <a class="card cardLink repCard" href="./song.html?id=${encodeURIComponent(s.id)}">
        <h3 class="title">${escapeHtml(s.title)}<span class="badge">代表曲</span>${s.isWeeklyPick ? `<span class="badge">今週</span>` : ``}</h3>
        <p class="muted">${escapeHtml(pMap.get(s.producerId) || "不明")}</p>
        ${(() => {
          const names = resolveVocalIds(s, vocals).map(id=>vMap.get(id)).filter(Boolean)
          if(names.length <= 1) return ""
          return '<p class="muted">ボカロ：' + escapeHtml(names.join("・")) + '</p>'
        })()}
        ${s.released ? `<p class="muted dateLabel">公開：${escapeHtml(s.released)}</p>` : ""}
        ${s.summary ? `<p class="muted">${escapeHtml(s.summary)}</p>` : ""}
      </a>
    `).join("") || `<p class="muted">まだ曲データがない</p>`

    // --- Popular songs ---
    const hasScore = allSongs.some(s=> typeof s.popularityScore === "number" && isFinite(s.popularityScore))
    const popItems = allSongs
      .slice()
      .sort((a,b)=>{
        const as = (typeof a.popularityScore === "number" && isFinite(a.popularityScore)) ? a.popularityScore : -1
        const bs = (typeof b.popularityScore === "number" && isFinite(b.popularityScore)) ? b.popularityScore : -1
        if(hasScore && as !== bs) return bs - as
        const aw = a.isWeeklyPick ? 1 : 0
        const bw = b.isWeeklyPick ? 1 : 0
        if(aw !== bw) return bw - aw
        const ar = (a.released || "")
        const br = (b.released || "")
        if(ar !== br) return br.localeCompare(ar)
        return (a.title || "").localeCompare(b.title || "", "ja")
      })
      .slice(0,10)

    if(popularNote){
      popularNote.textContent = hasScore
        ? "人気曲を表示中（songs.json の popularityScore が高い順）"
        : "人気度スコア未設定のため、今週ピック / 新着順で表示中"
    }

    if(popularBox){
      popularBox.innerHTML = popItems.map(s=>`
        <a class="card cardLink popularCard" href="./song.html?id=${encodeURIComponent(s.id)}">
          <h3 class="title">${escapeHtml(s.title)}<span class="badge">人気</span>${s.isWeeklyPick ? `<span class="badge">今週</span>` : ``}</h3>
          <p class="muted">${escapeHtml(pMap.get(s.producerId) || "不明")}</p>
          ${(() => {
            const names = resolveVocalIds(s, vocals).map(id=>vMap.get(id)).filter(Boolean)
            if(names.length <= 1) return ""
            return '<p class="muted">ボカロ：' + escapeHtml(names.join("・")) + '</p>'
          })()}
          ${s.released ? `<p class="muted dateLabel">公開：${escapeHtml(s.released)}</p>` : ""}
          ${hasScore && typeof s.popularityScore === "number" ? `<p class="muted">人気度：${escapeHtml(String(s.popularityScore))}</p>` : ""}
        </a>
      `).join("") || `<p class="muted">まだ曲データがない</p>`
    }
  }catch(err){
    content.innerHTML = `<p>読み込み失敗: ${escapeHtml(err.message)}</p>`
  }
}
main()

