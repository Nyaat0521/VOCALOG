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

function buildVocalNameToId(vocalsMap){
  const m = new Map()
  for(const [id, v] of vocalsMap.entries()){
    if(v && v.name) m.set(v.name, id)
  }
  return m
}
function resolveVocalIds(song, vocalsMap){
  if(song && Array.isArray(song.vocalIds) && song.vocalIds.length) return song.vocalIds
  const nameToId = resolveVocalIds._nameToId || (resolveVocalIds._nameToId = buildVocalNameToId(vocalsMap))
  const ids = []
  for(const t of (song.tags || [])){
    const id = nameToId.get(t)
    if(id && !ids.includes(id)) ids.push(id)
  }
  if(ids.length) return ids
  return song.vocalId ? [song.vocalId] : []
}
function vocalNames(song, vocalsMap){
  return resolveVocalIds(song, vocalsMap)
    .map(id => vocalsMap.get(id))
    .filter(Boolean)
    .map(v => v.name)
    .join("・")
}


function card(s){
  const pObj = producers.get(s.producerId) || {}
  const badge = s.isWeeklyPick ? `<span class="badge">今週</span>` : ""
  return `
    <a class="card cardLink" href="./song.html?id=${encodeURIComponent(s.id)}">
      <h2 class="title">
        ${escapeHtml(s.title)}
        ${s.titleKana ? `<span class="reading">(${escapeHtml(s.titleKana)})</span>` : ""}
        ${badge}
      </h2>
      <p class="muted">${escapeHtml(pObj.name||"不明")} / ${escapeHtml(vocalNames(s, vocals)||"不明")}</p>
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
