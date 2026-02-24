import { escapeHtml, qs, loadJson, headerHtml, vocalNames } from "./app.js"

document.getElementById("header").innerHTML = headerHtml("recommend")

const weeklyPicksEl = qs("weeklyPicks")
const recTagSel = qs("recTag")
const tagListEl = qs("tagList")
const tagHint = qs("tagHint")

let songs = []
let producers = new Map()
let vocals = new Map()

const safe = (v)=> v == null ? "" : String(v)


function onTagTap(e){
  const tEl = e.target.closest(".tag")
  if(!tEl || tEl.classList.contains("more")) return
  e.preventDefault()
  e.stopPropagation()
  const tag = (tEl.dataset.tag || tEl.textContent || "").trim()
  if(!tag) return
  recTagSel.value = (recTagSel.value === tag) ? "" : tag
  render()
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
  const badge = s.isWeeklyPick ? `<span class="badge">今週</span>` : ""
  const tagsHtml = renderTags(s.tags, 2)
  return `
    <a class="card cardLink" href="./song.html?id=${encodeURIComponent(s.id)}">
      <h2 class="title">
        ${escapeHtml(s.title)}
        ${s.titleKana ? `<span class="reading">(${escapeHtml(s.titleKana)})</span>` : ""}
        ${typeof badge !== "undefined" ? badge : ""}
      </h2>
      <p class="muted">${escapeHtml(pObj.name||"不明")} / ${escapeHtml(vocalNames(s, vocals)||"不明")}</p>
      ${tagsHtml}
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
  
  recTagSel.innerHTML =
    `<option value="" disabled selected hidden>タグを選択</option>` +
    tags.map(t=>`<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("")

  if(!tags.length){
    tagHint.textContent = "まだ全体おすすめタグがありません（recommendTags を曲データに追加）"
    tagListEl.innerHTML = ""
    return
  }

  recTagSel.value = tags[0]
  renderTag(tags[0])
}

function renderWeeklyPicks(){
  const wk = pickCurrentWeek()
  const weekSongs = songs.filter(s=> (s.addedWeek||"") === wk)
  const picks = weekSongs.filter(s=>s.isWeeklyPick).slice(0,3)
  weeklyPicksEl.innerHTML = picks.length ? picks.map(card).join("") : `<p class="muted">今週おすすめがまだ選ばれていません（新着の中から isWeeklyPick: true を3曲）</p>`
}

function renderTag(tag){
  if(!tag){
    tagHint.textContent = "タグを選択してください"
    tagListEl.innerHTML = `<p class="muted">上の「タグを選択」からおすすめタグを選んでね</p>`
    return
  }
  const items = songs.filter(s=> (s.recommendTags||[]).includes(tag))
  const top10 = sortByReleasedDesc(items).slice(0,10)
  
  tagHint.textContent = `「${tag}」おすすめ：全${items.length}曲（上位${top10.length}曲表示）`
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

// タグタップで絞り込み（カード遷移を止める）
weeklyPicksEl.addEventListener("click", onTagTap, true)
tagListEl.addEventListener("click", onTagTap, true)
