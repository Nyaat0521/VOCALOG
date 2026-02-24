import { escapeHtml, qs, loadJson, headerHtml, getParam, vocalNames } from "./app.js"

document.getElementById("header").innerHTML = headerHtml("new")

const sub = qs("sub")
const weeklyPicksEl = qs("weeklyPicks")
const weekListEl = qs("weekList")
const weekCountEl = qs("weekCount")
const archiveEl = qs("archive")

let songs = []
let producers = new Map()
let vocals = new Map()

const safe = (v)=> v == null ? "" : String(v)


function goTag(e){
  const tEl = e.target.closest(".tag")
  if(!tEl || tEl.classList.contains("more")) return
  e.preventDefault()
  e.stopPropagation()
  const tag = (tEl.dataset.tag || tEl.textContent || "").trim()
  if(!tag) return
  location.href = `./index.html?tag=${encodeURIComponent(tag)}`
}

function renderTags(tags, max=2){
  const arr = (tags || []).filter(Boolean)
  if(arr.length === 0) return ""
  const shown = arr.slice(0, max)
  const more = arr.length - shown.length
  const chips = [
    ...shown.map(t=>`<span class="tag" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</span>`),
    ...(more>0 ? [`<span class="tag more">+${more}</span>`] : [])
  ].join("")
  return `<div class="tags">${chips}</div>`
}



function card(s){
  const pObj = producers.get(s.producerId) || {}
  const badge = s.isWeeklyPick ? `<span class="badge">おすすめ</span>` : ""
  const tagsHtml = renderTags(s.tags, 2)
  return `
    <a class="card cardLink" href="./song.html?id=${encodeURIComponent(s.id)}">
      <h2 class="title">
        ${escapeHtml(s.title)}
        ${s.titleKana ? `<span class="reading">(${escapeHtml(s.titleKana)})</span>` : ""}
        ${typeof badge !== "undefined" ? badge : ""}
      </h2>
      <p class="muted">${escapeHtml(pObj.name||"不明")} / ${escapeHtml(vocalNames(s, vocals)||"不明")}</p>
      ${s.addedWeek ? `<p class="muted">🆕 ${escapeHtml(s.addedWeek)}</p>` : (s.addedAt ? `<p class="muted">🆕 ${escapeHtml(s.addedAt)}</p>` : "")}
      ${tagsHtml}
    </a>
  `
}

function sortByReleasedDesc(items){
  const copy = [...items]
  copy.sort((a,b)=> safe(b.released).localeCompare(safe(a.released)))
  return copy
}

function pickCurrentWeek(){
  const weeks = Array.from(new Set(songs.map(s=>s.addedWeek).filter(Boolean)))
  weeks.sort((a,b)=> b.localeCompare(a))
  return weeks[0] || ""
}

function groupByWeek(){
  const map = new Map()
  for(const s of songs){
    const wk = s.addedWeek || ""
    if(!wk) continue
    if(!map.has(wk)) map.set(wk, [])
    map.get(wk).push(s)
  }
  const weeks = Array.from(map.keys()).sort((a,b)=> b.localeCompare(a))
  return { map, weeks }
}

function renderArchive(weeks, map, selectedWeek){
  if(weeks.length === 0){
    archiveEl.innerHTML = `<div class="muted">まだ新着履歴がありません。曲データに addedWeek を入れると週ごとに残せます。</div>`
    return
  }
  archiveEl.innerHTML = weeks.map(wk=>{
    const n = (map.get(wk)||[]).length
    const isActive = wk === selectedWeek
    return `
      <a class="archiveItem ${isActive ? "active" : ""}" href="./new.html?week=${encodeURIComponent(wk)}">
        <div class="archiveTitle">${escapeHtml(wk)}</div>
        <div class="muted">${n}曲</div>
      </a>
    `
  }).join("")
}

function renderWeek(selectedWeek){
  const weekSongs = songs.filter(s=> (s.addedWeek||"") === selectedWeek)
  const picks = weekSongs.filter(s=>s.isWeeklyPick).slice(0,3)

  sub.textContent = selectedWeek ? `表示中: ${selectedWeek}` : ""
  weeklyPicksEl.innerHTML = picks.length ? picks.map(card).join("") : `<p class="muted">今週おすすめがまだ選ばれていません（isWeeklyPick: true を3曲につける）</p>`
  weekCountEl.textContent = `${weekSongs.length} 曲`
  weekListEl.innerHTML = sortByReleasedDesc(weekSongs).map(card).join("")
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

  const weekParam = getParam("week")
  const currentWeek = pickCurrentWeek()
  const selectedWeek = weekParam || currentWeek

  const { map, weeks } = groupByWeek()
  renderArchive(weeks, map, selectedWeek)

  if(!selectedWeek){
    sub.textContent = "曲データに addedWeek を入れると「今週追加」が表示されます"
    weeklyPicksEl.innerHTML = ""
    weekListEl.innerHTML = ""
    weekCountEl.textContent = ""
    return
  }
  renderWeek(selectedWeek)
}

main()

// タグタップで曲一覧へ（カード遷移を止める）
weeklyPicksEl.addEventListener("click", goTag, true)
weekListEl.addEventListener("click", goTag, true)
archiveEl.addEventListener("click", goTag, true)
