const btn=document.getElementById("themeToggle");
btn.addEventListener("click",()=>{
  const current=document.documentElement.getAttribute("data-theme");
  const next=current==="dark"?"light":"dark";
  document.documentElement.setAttribute("data-theme",next);
  localStorage.setItem("theme",next);
});