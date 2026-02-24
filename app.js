export function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]))
}
export function norm(s){ return String(s||"").toLowerCase() }
export function qs(id){ return document.getElementById(id) }
export function getParam(name){ return new URLSearchParams(location.search).get(name) }

// -------- Data helpers (schema tolerant) --------
const safeStr = (v)=> (v == null ? "" : String(v))

function buildNameToIdFromMap(map){
  const m = new Map()
  for(const [id, obj] of map.entries()){
    if(obj && obj.name) m.set(obj.name, id)
  }
  return m
}

function buildNameToIdFromArray(arr){
  const m = new Map()
  for(const obj of (arr||[])){
    if(obj && obj.name) m.set(obj.name, obj.id)
  }
  return m
}

/**
 * Resolve vocal ids for a song.
 * Supports:
 * - song.vocalIds (preferred)
 * - song.vocalId (legacy)
 * - deriving from tags that match vocal names
 */
export function resolveVocalIds(song, vocals){
  if(!song) return []
  if(Array.isArray(song.vocalIds) && song.vocalIds.length) return song.vocalIds

  // Build a name->id map lazily (works for Map or Array)
  const isMap = vocals instanceof Map
  const key = isMap ? "_nameToIdMap" : "_nameToIdArr"
  const cache = resolveVocalIds
  const nameToId = cache[key] || (cache[key] = isMap ? buildNameToIdFromMap(vocals) : buildNameToIdFromArray(vocals))

  const ids = []
  for(const t of (song.tags || [])){
    const id = nameToId.get(t)
    if(id && !ids.includes(id)) ids.push(id)
  }
  if(ids.length) return ids

  return song.vocalId ? [song.vocalId] : []
}

export function vocalNames(song, vocals){
  const ids = resolveVocalIds(song, vocals)
  const get = (id)=> (vocals instanceof Map) ? vocals.get(id) : (vocals||[]).find(v=>v.id===id)
  return ids
    .map(get)
    .filter(Boolean)
    .map(v => v.name)
    .join("・")
}

export function vocalNameAndKanaList(song, vocals){
  const ids = resolveVocalIds(song, vocals)
  const get = (id)=> (vocals instanceof Map) ? vocals.get(id) : (vocals||[]).find(v=>v.id===id)
  return ids
    .map(get)
    .filter(Boolean)
    .map(v => ({ name: safeStr(v.name), nameKana: safeStr(v.nameKana) }))
}

export function getLinks(obj){
  // tolerate different shapes
  const links = (obj && typeof obj === "object" && obj.links && typeof obj.links === "object") ? obj.links : {}
  return {
    // producer
    youtube: safeStr(links.youtube || obj?.youtube || obj?.youtubeUrl),
    x: safeStr(links.x || links.twitter || obj?.x || obj?.twitter),
    website: safeStr(links.website || obj?.website || obj?.url),
    // vocal
    official: safeStr(links.official || obj?.official),
    wikipedia: safeStr(links.wikipedia || obj?.wikipedia),
  }
}

export function isLikelyUrl(u){
  const s = safeStr(u).trim()
  return /^https?:\/\//i.test(s)
}

export async function loadJson(path){
  const r = await fetch(path, { cache: "no-store" })
  if(!r.ok) throw new Error(`${path} ${r.status}`)
  return r.json()
}

export function headerHtml(active){
  const a = (x)=> x===active ? 'style="color:var(--text);font-weight:600;"' : ""
  return `
  <header class="header">
    <div class="wrap">
      <div class="headerRow">
        <a class="brand" href="./index.html">
          <h1 class="logo">VOCALOG</h1>
          <span class="sub">ボカロを探す辞典</span>
        </a>
        <button id="themeToggle" class="btn" type="button" aria-label="テーマ切り替え">🌙</button>
      </div>
      <nav class="nav">
        <a ${a("songs")} href="./index.html">曲</a>
        <a ${a("producers")} href="./producers.html">ボカロP</a>
        <a ${a("vocals")} href="./vocals.html">ボカロ</a>
        <a ${a("history")} href="./history.html">歴史</a>
        <a ${a("new")} href="./new.html">新着</a>
        <a ${a("recommend")} href="./recommend.html">おすすめ</a>
        <a ${a("request")} href="./request.html">リクエスト</a>
      </nav>
    </div>
  </header>
  `
}
