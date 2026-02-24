const root = document.documentElement
const key = "vocalog-theme"

function setIcon() {
  const btn = document.getElementById("themeToggle")
  if (!btn) return
  const theme = root.getAttribute("data-theme") || "light"
  btn.textContent = (theme === "dark") ? "☀️" : "🌙"
}

function applyTheme(t){
  root.setAttribute("data-theme", t)
  localStorage.setItem(key, t)
  setIcon()
}

document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem(key)
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
  const initial = saved || (prefersDark ? "dark" : "light")
  root.setAttribute("data-theme", initial)
  setIcon()
})

document.addEventListener("click", (e)=>{
  if(e.target && e.target.id === "themeToggle"){
    const now = root.getAttribute("data-theme") || "light"
    applyTheme(now === "dark" ? "light" : "dark")
  }
})
