import { escapeHtml, norm, qs, loadJson, headerHtml } from "./app.js"

document.getElementById("header").innerHTML = headerHtml("vocals")

const q = qs("q")
const list = qs("list")
const count = qs("count")

let vocals = []
const safe = (v)=> v==null ? "" : String(v)

function render(items){
  count.textContent = `${items.length} 件`
  list.innerHTML = items.map(v=>`
    <a class="card cardLink" href="./vocal.html?id=${encodeURIComponent(v.id)}">
      <h2 class="title">
        ${escapeHtml(v.name)}
        ${v.nameKana ? `<span class="reading">(${escapeHtml(v.nameKana)})</span>` : ""}
      </h2>
      <p class="muted">${escapeHtml(v.engine||"")}</p>
    </a>
  `).join("")
}

function filter(){
  const word = norm(q.value.trim())
  const items = vocals
    .filter(v=>{
      const target = norm([v.name,v.nameKana,v.engine,v.summary].map(safe).join(" "))
      return word ? target.includes(word) : true
    })
    .sort((a,b)=> safe(a.nameKana||a.name).localeCompare(safe(b.nameKana||b.name),"ja"))

  render(items)
}

async function main(){
  vocals = await loadJson("./data/vocals.json")
  filter()
}

main()
q.addEventListener("input", filter)

