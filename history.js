import { escapeHtml, norm, qs, loadJson, headerHtml } from "./app.js"

document.getElementById("header").innerHTML = headerHtml("history")

const yearSel = qs("year")
const q = qs("q")
const list = qs("list")
const count = qs("count")

let items = []

function buildYears(){
  const years = Array.from(new Set(items.map(x=>x.year))).sort((a,b)=>b-a)
  for(const y of years){
    const opt = document.createElement("option")
    opt.value = String(y)
    opt.textContent = String(y)
    yearSel.appendChild(opt)
  }
}

function render(rows){
  count.textContent = `${rows.length} 件`
  list.innerHTML = rows.map(x=>`
    <div class="card">
      <h2 class="title">${escapeHtml(String(x.year))} - ${escapeHtml(x.title)}</h2>
      <p class="muted">${escapeHtml(x.summary || "")}</p>
      ${(x.links||[]).filter(Boolean).length
        ? `<div class="links">${(x.links||[]).filter(Boolean).map(u=>`<a class="link" target="_blank" rel="noopener" href="${u}">参考</a>`).join(" ")}</div>`
        : ""}
    </div>
  `).join("")
}

function filter(){
  const y = yearSel.value
  const word = norm(q.value.trim())

  const rows = items.filter(x=>{
    const hitYear = y ? String(x.year) === y : true
    const target = norm(`${x.year} ${x.title} ${x.summary||""}`)
    const hitWord = word ? target.includes(word) : true
    return hitYear && hitWord
  }).sort((a,b)=> b.year - a.year)

  render(rows)
}

async function main(){
  try{
    items = await loadJson("./data/history.json")
    buildYears()
    filter()
  }catch(err){
    document.body.innerHTML = `<div style="padding:16px;font-family:sans-serif;">読み込み失敗: ${escapeHtml(err.message)}</div>`
  }
}
main()

yearSel.addEventListener("change", filter)
q.addEventListener("input", filter)
