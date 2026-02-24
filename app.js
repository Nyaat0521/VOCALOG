export function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]))
}
export function norm(s){ return String(s||"").toLowerCase() }
export function qs(id){ return document.getElementById(id) }
export function getParam(name){ return new URLSearchParams(location.search).get(name) }

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
        <button id="themeToggle" class="btn">🌙</button>
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
