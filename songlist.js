import { escapeHtml, norm, qs, loadJson, headerHtml } from "./app.js"

document.getElementById("header").innerHTML = headerHtml("songs")

const q = qs("q")
const list = qs("list")
const count = qs("count")
const sortSel = qs("sort")
const tagSel = qs("tag")

let songs = []
let producers = new Map()
let vocals = new Map()

const safe = (v)=> v == null ? "" : String(v)

function buildTagOptions(){
  const set = new Set()
  for(const s of songs){
    for(const t of (s.tags || [])) set.add(t)
  }
  const tags = Array.from(set).sort((a,b)=>a.localeCompare(b,"ja"))
  for(const t of tags){
    const opt = document.createElement("option")
    opt.value = t
    opt.textContent = t
    tagSel.appendChild(opt)
  }

  // かな順追加
  if(!Array.from(sortSel.options).some(o=>o.value==="kana")){
    const opt = document.createElement("option")
    opt.value = "kana"
    opt.textContent = "かな順"
    sortSel.appendChild(opt)
  }
}

function sortSongs(items){
  const mode = sortSel.value
  const copy = [...items]

  if(mode === "kana"){
    copy.sort((a,b)=>{
      const ak = safe(a.titleKana || a.title)
      const bk = safe(b.titleKana || b.title)
      return ak.localeCompare(bk,"ja")
    })
  }else if(mode === "az"){
    copy.sort((a,b)=> safe(a.title).localeCompare(safe(b.title),"ja"))
  }else if(mode === "old"){
    copy.sort((a,b)=> safe(a.released).localeCompare(safe(b.released)))
  }else{
    copy.sort((a,b)=> safe(b.released).localeCompare(safe(a.released)))
  }
  return copy
}

function card(s){
  const pObj = producers.get(s.producerId) || {}
  const vObj = vocals.get(s.vocalId) || {}

  return `
    <a class="card cardLink" href="./song.html?id=${encodeURIComponent(s.id)}">
      <h2 class="title">
        ${escapeHtml(s.title)}
        ${s.titleKana ? `<span class="reading">(${escapeHtml(s.titleKana)})</span>` : ""}
      </h2>
      <p class="muted">${escapeHtml(pObj.name||"不明")} / ${escapeHtml(vObj.name||"不明")}</p>
      ${s.released ? `<p class="muted">🗓 ${escapeHtml(s.released)}</p>` : ""}
      ${s.summary ? `<p class="muted">${escapeHtml(s.summary)}</p>` : ""}
    </a>
  `
}

function render(items){
  count.textContent = `${items.length} 件`
  list.innerHTML = items.map(card).join("")
}

function filter(){
  const word = norm(q.value.trim())
  const tag = tagSel.value

  let items = songs.filter(s=>{
    const p = producers.get(s.producerId) || {}
    const v = vocals.get(s.vocalId) || {}

    const target = norm([
      s.title, s.titleKana,
      p.name, p.nameKana,
      v.name, v.nameKana,
      ...(s.tags||[]),
      s.released, s.summary
    ].map(safe).join(" "))

    const hitWord = word ? target.includes(word) : true
    const hitTag = tag ? (s.tags||[]).includes(tag) : true
    return hitWord && hitTag
  })

  items = sortSongs(items)
  render(items)
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

  buildTagOptions()
  filter()
}

main()
q.addEventListener("input", filter)
sortSel.addEventListener("change", filter)
tagSel.addEventListener("change", filter)

