import { escapeHtml, norm, qs, loadJson, headerHtml } from "./app.js"

document.getElementById("header").innerHTML = headerHtml("producers")

const q = qs("q")
const list = qs("list")
const count = qs("count")

let producers = []
const safe = (v)=> v==null ? "" : String(v)

function render(items){
  count.textContent = `${items.length} 人`
  list.innerHTML = items.map(p=>`
    <a class="card cardLink" href="./producer.html?id=${encodeURIComponent(p.id)}">
      <h2 class="title">
        ${escapeHtml(p.name)}
        ${p.nameKana ? `<span class="reading">(${escapeHtml(p.nameKana)})</span>` : ""}
      </h2>
      ${p.summary ? `<p class="muted">${escapeHtml(p.summary)}</p>` : ""}
    </a>
  `).join("")
}

function filter(){
  const word = norm(q.value.trim())
  const items = producers
    .filter(p=>{
      const target = norm([p.name,p.nameKana,...(p.aliases||[]),p.summary].map(safe).join(" "))
      return word ? target.includes(word) : true
    })
    .sort((a,b)=> safe(a.nameKana||a.name).localeCompare(safe(b.nameKana||b.name),"ja"))

  render(items)
}

async function main(){
  producers = await loadJson("./data/producers.json")
  filter()
}

main()
q.addEventListener("input", filter)

