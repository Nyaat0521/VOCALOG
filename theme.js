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
  const saved = localStorage.getItem(key) || "light"
  root.setAttribute("data-theme", saved)
  setIcon()
})

document.addEventListener("click", (e)=>{
  if(e.target && e.target.id === "themeToggle"){
    const now = root.getAttribute("data-theme") || "light"
    applyTheme(now === "dark" ? "light" : "dark")
  }
})
