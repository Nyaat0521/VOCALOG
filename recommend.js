import { escapeHtml, qs, loadJson, headerHtml } from "./app.js"

document.getElementById("header").innerHTML = headerHtml("recommend")

const weeklyPicksEl = qs("weeklyPicks")
const recTagSel = qs("recTag")
const tagListEl = qs("tagList")
const tagHint = qs("tagHint")

let songs = []
let producers = new Map()
let vocals = new Map()

const safe = (v)=> v == null ? "" : String(v)

function card(s){
  const pObj = producers.get(s.producerId) || {}
  const vObj = vocals.get(s.vocalId) || {}
  const badge = s.isWeeklyPick ? `<span class="badge">今週</span>` : ""
  return `
    <a class="card cardLink" href="./song.html?id=${encodeURIComponent(s.id)}">
      <h2 class="title">
        ${escapeHtml(s.title)}
        ${s.titleKana ? `<span class="reading">(${escapeHtml(s.titleKana)})</span>` : ""}
        ${badge}
      </h2>
      <p class="muted">${escapeHtml(pObj.name||"不明")} / ${escapeHtml(vObj.name||"不明")}</p>
      ${s.released ? `<p class="muted">🗓 ${escapeHtml(s.released)}</p>` : ""}
      ${s.summary ? `<p class="muted">${escapeHtml(s.summary)}</p>` : ""}
    </a>
  `
}

function pickCurrentWeek(){
  const weeks = Array.from(new Set(songs.map(s=>s.addedWeek).filter(Boolean)))
  weeks.sort((a,b)=> b.localeCompare(a))
  return weeks[0] || ""
}

function sortByReleasedDesc(items){
  const copy = [...items]
  copy.sort((a,b)=> safe(b.released).localeCompare(safe(a.released)))
  return copy
}

function buildRecTagOptions(){
  const set = new Set()
  for(const s of songs){
    for(const t of (s.recommendTags || [])) set.add(t)
  }
  const tags = Array.from(set).sort((a,b)=>a.localeCompare(b,"ja"))
  recTagSel.innerHTML = `<option value="">タグを選択</option>` + tags.map(t=>`<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("")
  if(tags.length){
    recTagSel.value = tags[0]
    renderTag(tags[0])
  }else{
    tagHint.textContent = "まだ全体おすすめタグがありません（recommendTags を曲データに追加）"
  }
}

function renderWeeklyPicks(){
  const wk = pickCurrentWeek()
  const weekSongs = songs.filter(s=> (s.addedWeek||"") === wk)
  const picks = weekSongs.filter(s=>s.isWeeklyPick).slice(0,3)
  weeklyPicksEl.innerHTML = picks.length ? picks.map(card).join("") : `<p class="muted">今週おすすめがまだ選ばれていません（新着の中から isWeeklyPick: true を3曲）</p>`
}

function renderTag(tag){
  if(!tag){
    tagListEl.innerHTML = ""
    return
  }
  const items = songs.filter(s=> (s.recommendTags||[]).includes(tag))
  const top10 = sortByReleasedDesc(items).slice(0,10)
  tagHint.textContent = `「${tag}」おすすめ：${Math.min(10, items.length)} / ${items.length}曲`
  tagListEl.innerHTML = top10.map(card).join("") || `<p class="muted">このタグの曲がまだありません</p>`
}

async function main(){
  const [sData,pData,vData] = await Promise.all([
    loadJson("./data/songs.json"),
    loadJson("./data/producers.json"),
    loadJson("./data/vocals.json")
  ])
  songs = sData
  producers = new Map(pData.map(p=>[p.id,p]))
  vocals = new Map(vData.map(v=>[v.id,v]))

  renderWeeklyPicks()
  buildRecTagOptions()
}

main()
recTagSel.addEventListener("change", ()=> renderTag(recTagSel.value))
