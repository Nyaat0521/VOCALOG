import { escapeHtml, getParam, loadJson, headerHtml } from "./app.js"

document.getElementById("header").innerHTML = headerHtml("songs")
const content = document.getElementById("content")

async function main(){
  try{
    const [songs, producers, vocals] = await Promise.all([
      loadJson("./data/songs.json"),
      loadJson("./data/producers.json"),
      loadJson("./data/vocals.json"),
    ])

    const id = getParam("id")
    const s = songs.find(x=>x.id === id)
    if(!s){ content.innerHTML = `<p>曲が見つからなかった</p>`; return }

    const p = producers.find(x=>x.id === s.producerId)
    const v = vocals.find(x=>x.id === s.vocalId)

    document.title = `${s.title} - VOCALOG`

    content.innerHTML = `
      <h2 class="title">
        ${escapeHtml(s.title)}
        ${s.titleKana ? `<span class="reading">(${escapeHtml(s.titleKana)})</span>` : ""}
      </h2>
      <p class="muted">
        ${p ? `<a class="link" href="./producer.html?id=${encodeURIComponent(p.id)}">${escapeHtml(p.name)}</a>` : "不明"}
        /
        ${v ? `<a class="link" href="./vocal.html?id=${encodeURIComponent(v.id)}">${escapeHtml(v.name)}</a>` : "不明"}
      </p>

      ${s.released ? `<p class="muted">🗓 ${escapeHtml(s.released)}</p>` : ""}
      ${s.summary ? `<p>${escapeHtml(s.summary)}</p>` : ""}

      <div class="links">
        ${s.youtubeId ? `<a class="link" target="_blank" rel="noopener" href="https://www.youtube.com/watch?v=${encodeURIComponent(s.youtubeId)}">YouTube</a>` : ""}
        ${s.lyricsLink ? `<a class="link" target="_blank" rel="noopener" href="${s.lyricsLink}">歌詞</a>` : ""}
        ${s.streamingLink ? `<a class="link" target="_blank" rel="noopener" href="${s.streamingLink}">配信</a>` : ""}
        ${s.karaokeLink ? `<a class="link" target="_blank" rel="noopener" href="${s.karaokeLink}">カラオケ</a>` : ""}
      </div>

      <div class="tags">${(s.tags||[]).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>

      ${s.youtubeId ? `
      <div style="margin-top:12px;">
        <iframe
          src="https://www.youtube.com/embed/${encodeURIComponent(s.youtubeId)}"
          title="${escapeHtml(s.title)}"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen></iframe>
      </div>` : `<p class="muted">YouTube ID が未設定</p>`}

      ${s.niconicoId ? `
  <div style="margin-top:12px;">
    <iframe
      src="https://embed.nicovideo.jp/watch/${encodeURIComponent(
        (String(s.niconicoId).match(/(sm\d+)/) || [])[1] || ""
      )}"
      title="niconico"
      loading="lazy"
      allowfullscreen>
    </iframe>
  </div>
` : ""}
    `
  }catch(err){
    content.innerHTML = `<p>読み込み失敗: ${escapeHtml(err.message)}</p>`
  }
}
main()


