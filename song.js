import { escapeHtml, getParam, loadJson, headerHtml, resolveVocalIds, isLikelyUrl } from "./app.js"

document.getElementById("header").innerHTML = headerHtml("songs")
const content = document.getElementById("content")

function vocalLinks(song, vocalsArr){
  const vMap = new Map(vocalsArr.map(v=>[v.id, v]))
  return resolveVocalIds(song, vocalsArr)
    .map(id => vMap.get(id))
    .filter(Boolean)
    .map(v => `<a class="link" href="./vocal.html?id=${encodeURIComponent(v.id)}">${escapeHtml(v.name)}</a>`)
    .join("・")
}

function niconicoWatchId(raw){
  const s = String(raw || "").trim()
  const m = s.match(/(sm\d+|so\d+|nm\d+|lv\d+)/)
  return m ? m[1] : ""
}


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

    document.title = `${s.title} - VOCALOG`

    content.innerHTML = `
      <h2 class="title">
        ${escapeHtml(s.title)}
        ${s.isRepresentative ? `<span class="pill">代表曲</span>` : ""}
        ${s.isWeeklyPick ? `<span class="pill">今週</span>` : ""}
        ${typeof s.popularityScore === "number" && isFinite(s.popularityScore) && s.popularityScore > 0 ? `<span class="pill">人気</span>` : ""}
        ${s.titleKana ? `<span class="reading">(${escapeHtml(s.titleKana)})</span>` : ""}
      </h2>
      <p class="muted">
        ${p ? `<a class="link" href="./producer.html?id=${encodeURIComponent(p.id)}">${escapeHtml(p.name)}</a>` : "不明"}
        /
        ${(vocalLinks(s, vocals) || "不明")}
      </p>

      ${s.released ? `<p class="muted dateLabel">公開：${escapeHtml(s.released)}</p>` : ""}
      ${s.summary ? `<p>${escapeHtml(s.summary)}</p>` : ""}

      <div class="links">
        ${s.youtubeId ? `<a class="link" target="_blank" rel="noopener" href="https://www.youtube.com/watch?v=${encodeURIComponent(s.youtubeId)}">YouTube</a>` : ""}
        ${isLikelyUrl(s.lyricsLink) ? `<a class="link" target="_blank" rel="noopener" href="${s.lyricsLink}">歌詞</a>` : ""}
        ${isLikelyUrl(s.streamingLink) ? `<a class="link" target="_blank" rel="noopener" href="${s.streamingLink}">配信</a>` : ""}
        ${isLikelyUrl(s.karaokeLink) ? `<a class="link" target="_blank" rel="noopener" href="${s.karaokeLink}">カラオケ</a>` : ""}
        ${niconicoWatchId(s.niconicoId) ? `<a class="link" target="_blank" rel="noopener" href="https://www.nicovideo.jp/watch/${encodeURIComponent(niconicoWatchId(s.niconicoId))}">niconico</a>` : ""}
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

      ${niconicoWatchId(s.niconicoId) ? `
        <div style="margin-top:12px;">
          <iframe
            src="https://embed.nicovideo.jp/watch/${encodeURIComponent(niconicoWatchId(s.niconicoId))}"
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
