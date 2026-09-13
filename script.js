const API = "https://api.jikan.moe/v4";
const grid = document.querySelector("#animeGrid");
const watchGrid = document.querySelector("#watchGrid");
const searchInput = document.querySelector("#searchInput");
const genreFilter = document.querySelector("#genreFilter");
const resultCount = document.querySelector("#resultCount");
const emptyState = document.querySelector("#emptyState");
const watchEmpty = document.querySelector("#watchEmpty");
const modal = document.querySelector("#animeModal");
const modalContent = document.querySelector("#modalContent");
const watchCount = document.querySelector("#watchCount");
let current = [];
let watchlist = JSON.parse(localStorage.getItem("animeverse-watchlist") || "[]");

function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function isSaved(id){return watchlist.some(a=>a.mal_id===id);}
function saveWatchlist(){localStorage.setItem("animeverse-watchlist",JSON.stringify(watchlist)); updateWatchlist();}
function card(a,i=""){
  const img=a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || "";
  const genres=(a.genres||[]).slice(0,3).map(g=>`<span class="badge">${esc(g.name)}</span>`).join("");
  return `<article class="card" data-id="${a.mal_id}">
    <div class="poster"><img loading="lazy" src="${img}" alt="${esc(a.title)} poster"><span class="rank">${i?`#${i}`:"★"}</span></div>
    <div class="card-body"><button class="heart ${isSaved(a.mal_id)?"saved":""}" data-save="${a.mal_id}" aria-label="Save ${esc(a.title)}">♥</button>
    <h3>${esc(a.title)}</h3><div class="meta">⭐ ${a.score ?? "N/A"} · ${a.year ?? "—"} · ${esc(a.type ?? "Anime")}</div>
    <div class="badges">${genres}</div></div>
  </article>`;
}
function bindCards(){
  document.querySelectorAll(".card").forEach(c=>c.addEventListener("click",e=>{
    if(e.target.closest("[data-save]")) return;
    const a=current.find(x=>x.mal_id==c.dataset.id) || watchlist.find(x=>x.mal_id==c.dataset.id);
    if(a) openModal(a);
  }));
  document.querySelectorAll("[data-save]").forEach(b=>b.addEventListener("click",e=>{
    e.stopPropagation(); const id=Number(b.dataset.save); const a=current.find(x=>x.mal_id===id)||watchlist.find(x=>x.mal_id===id);
    if(!a)return; if(isSaved(id)) watchlist=watchlist.filter(x=>x.mal_id!==id); else watchlist.push(a); saveWatchlist(); renderCurrent();
  }));
}
function renderCurrent(){
  grid.innerHTML=current.map((a,i)=>card(a,i+1)).join("");
  resultCount.textContent=`${current.length} result${current.length===1?"":"s"}`;
  emptyState.hidden=current.length!==0; bindCards();
}
function updateWatchlist(){
  watchCount.textContent=watchlist.length;
  watchGrid.innerHTML=watchlist.map(a=>card(a)).join("");
  watchEmpty.hidden=watchlist.length!==0;
  document.querySelectorAll("#watchlist [data-save]").forEach(b=>b.addEventListener("click",e=>{
    e.stopPropagation(); const id=Number(b.dataset.save); watchlist=watchlist.filter(x=>x.mal_id!==id); saveWatchlist();
  }));
  document.querySelectorAll("#watchlist .card").forEach(c=>c.addEventListener("click",()=>{const a=watchlist.find(x=>x.mal_id==c.dataset.id);if(a)openModal(a);}));
}
async function loadTop(){
  grid.innerHTML='<div class="loading">Loading trending anime…</div>';
  try{
    const r=await fetch(`${API}/top/anime?limit=20`);
    const d=await r.json(); current=d.data||[]; renderCurrent();
  }catch(err){grid.innerHTML='<div class="loading">Could not load anime right now. Refresh and try again.</div>';resultCount.textContent="";}
}
async function searchAnime(){
  const q=searchInput.value.trim(); const g=genreFilter.value;
  if(!q && !g){await loadTop();return;}
  grid.innerHTML='<div class="loading">Searching…</div>';
  try{
    let url=q?`${API}/anime?q=${encodeURIComponent(q)}&limit=20`: `${API}/anime?limit=25`;
    const r=await fetch(url); const d=await r.json();
    current=(d.data||[]).filter(a=>!g || (a.genres||[]).some(x=>x.name===g));
    renderCurrent();
  }catch(e){grid.innerHTML='<div class="loading">Search failed. Please try again.</div>';}
}
async function openModal(a){
  modal.classList.add("show"); modal.setAttribute("aria-hidden","false");
  modalContent.innerHTML='<div class="loading">Loading details…</div>';
  try{
    const r=await fetch(`${API}/anime/${a.mal_id}/full`); const d=await r.json(); const x=d.data||a;
    const img=x.images?.jpg?.large_image_url||x.images?.jpg?.image_url||"";
    const genres=(x.genres||[]).map(g=>`<span class="badge">${esc(g.name)}</span>`).join("");
    const synopsis=x.synopsis?x.synopsis.replace(/\[Written by MAL Rewrite\]/g,"").trim():"No synopsis available.";
    modalContent.innerHTML=`<div class="modal-layout"><img class="modal-poster" src="${img}" alt="${esc(x.title)} poster"><div>
      <span class="section-kicker">${esc(x.status||"ANIME")}</span><h2>${esc(x.title)}</h2>
      <div class="modal-tags">${genres}</div><p><strong>⭐ ${x.score??"N/A"}</strong> · ${x.year??"—"} · ${x.episodes??"?"} episodes</p>
      <p>${esc(synopsis)}</p>
      <div class="modal-actions"><button class="add" id="modalSave">${isSaved(x.mal_id)?"✓ Saved":"♥ Add to watchlist"}</button>${x.url?`<a class="modal-actions button" href="${x.url}" target="_blank" rel="noopener">View source</a>`:""}</div>
      </div></div>`;
    document.querySelector("#modalSave").addEventListener("click",()=>{if(isSaved(x.mal_id))watchlist=watchlist.filter(y=>y.mal_id!==x.mal_id);else watchlist.push(x);saveWatchlist();document.querySelector("#modalSave").textContent=isSaved(x.mal_id)?"✓ Saved":"♥ Add to watchlist";renderCurrent();});
  }catch(e){modalContent.innerHTML='<p>Could not load details. Please try again.</p>';}
}
function closeModal(){modal.classList.remove("show");modal.setAttribute("aria-hidden","true");}
document.querySelector("#searchBtn").addEventListener("click",searchAnime);
searchInput.addEventListener("keydown",e=>{if(e.key==="Enter")searchAnime();});
genreFilter.addEventListener("change",searchAnime);
document.querySelector("#closeModal").addEventListener("click",closeModal);
modal.addEventListener("click",e=>{if(e.target===modal)closeModal();});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});
document.querySelector("#themeBtn").addEventListener("click",()=>{document.body.classList.toggle("light");document.querySelector("#themeBtn").textContent=document.body.classList.contains("light")?"🌙":"☀️";});
updateWatchlist(); loadTop();
