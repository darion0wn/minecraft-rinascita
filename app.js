
const state = JSON.parse(localStorage.getItem("rinascitaState") || "{}");
state.completed = state.completed || {};
state.day = Number.isFinite(state.day) ? state.day : 1;
state.phase = state.phase || 1;
state.journal = state.journal || [];
state.currentX = state.currentX ?? "";
state.currentZ = state.currentZ ?? "";

const save = () => localStorage.setItem("rinascitaState", JSON.stringify(state));

let objectives = [];
let phases = [];
let addons = [];
let seed = null;
let activePhaseFilter = 0;

async function loadData(){
  [objectives, phases, addons, seed] = await Promise.all([
    fetch("data/objectives.json").then(r=>r.json()),
    fetch("data/phases.json").then(r=>r.json()),
    fetch("data/addons.json").then(r=>r.json()),
    fetch("data/seed.json").then(r=>r.json())
  ]);
  renderAll();
}

function phaseName(id){ return phases.find(p=>p.id===id)?.name || "—"; }
function phaseLabel(id){ const p = phases.find(x=>x.id===id); return p ? `${p.name} · ${p.range}` : "—"; }

function renderAll(){
  const phaseSelect = document.getElementById("phaseInput");
  phaseSelect.innerHTML = phases.map(p=>`<option value="${p.id}">${p.name}</option>`).join("");
  phaseSelect.value = state.phase;
  document.getElementById("dayInput").value = state.day;
  document.getElementById("dayDisplay").textContent = state.day;
  document.getElementById("phaseDisplay").textContent = phaseName(Number(state.phase));

  document.getElementById("rulesList").innerHTML = [
    "Niente Creative e niente cheat.",
    "Non rushare l'Ender Dragon.",
    "La tecnologia arriva gradualmente.",
    "La città deve avere una funzione.",
    "Pochi add-on ben scelti > dieci sistemi che fanno casino."
  ].map(x=>`<li>${x}</li>`).join("");

  renderObjectives();
  renderMap();
  renderAddons();
  renderJournal();
  updateDashboard();
  document.getElementById("currentX").value = state.currentX;
  document.getElementById("currentZ").value = state.currentZ;
}

function updateDashboard(){
  const done = objectives.filter(o=>state.completed[o.id]).length;
  const points = objectives.filter(o=>state.completed[o.id]).reduce((a,o)=>a+o.points,0);
  const total = objectives.reduce((a,o)=>a+o.points,0);
  const pct = total ? Math.round(points/total*100) : 0;
  document.getElementById("progressPct").textContent = `${pct}%`;
  document.getElementById("completedCount").textContent = `${done} / ${objectives.length}`;
  document.getElementById("pointsCount").textContent = `${points} punti`;
  const next = objectives.find(o=>!state.completed[o.id]) || objectives[objectives.length-1];
  document.getElementById("nextMissionTitle").textContent = next.title;
  document.getElementById("nextMissionDesc").textContent = next.desc;
  document.getElementById("phaseInput").value = state.phase;
  document.getElementById("dayInput").value = state.day;
}

function renderObjectives(){
  const filterBar = document.getElementById("phaseFilters");
  filterBar.innerHTML = `<button class="filter-btn ${activePhaseFilter===0?'active':''}" data-phase="0">Tutte</button>` +
    phases.map(p=>`<button class="filter-btn ${activePhaseFilter===p.id?'active':''}" data-phase="${p.id}">${p.id}. ${p.name}</button>`).join("");

  filterBar.querySelectorAll("button").forEach(btn=>{
    btn.addEventListener("click",()=>{activePhaseFilter=Number(btn.dataset.phase);renderObjectives();});
  });

  const list = document.getElementById("objectivesList");
  const filtered = objectives.filter(o=>activePhaseFilter===0 || o.phase===activePhaseFilter);
  list.innerHTML = filtered.map(o=>{
    const done = !!state.completed[o.id];
    return `<article class="objective ${done?'done':''}">
      <button class="check" data-id="${o.id}" aria-label="Segna come completato">${done?'✓':''}</button>
      <div><div class="objective-title">${o.title}</div><div class="objective-desc">${o.desc}</div></div>
      <div class="objective-meta"><div>${phaseLabel(o.phase)}</div><div>${o.points} pt</div></div>
    </article>`;
  }).join("");

  list.querySelectorAll(".check").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const id=btn.dataset.id;
      state.completed[id]=!state.completed[id];
      save(); renderObjectives(); updateDashboard();
    });
  });
}

function renderMap(){
  const box=document.getElementById("mapLocations");
  box.innerHTML=seed.locations.map(l=>`
    <div class="location">
      <div class="loc-type">${l.type}</div>
      <h3>${l.name}</h3>
      <div class="coords">X ${l.x} · ${l.y!==undefined?`Y ${l.y} · `:""}Z ${l.z}</div>
      <p>${l.description}</p>
      <button class="ghost" data-loc="${l.id}">Usa coordinate</button>
    </div>`).join("");
  box.querySelectorAll("[data-loc]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const loc=seed.locations.find(x=>x.id===btn.dataset.loc);
      state.currentX=loc.x; state.currentZ=loc.z; save();
      renderAll();
      showView("world");
    });
  });
}

function renderAddons(){
  document.getElementById("addonList").innerHTML=addons.map(a=>`
    <article class="addon">
      <div class="addon-head">
        <div><h3>${a.name}</h3><div class="category">${a.category} · priorità ${a.priority}</div></div>
        <div class="addon-actions"><span class="badge ${a.priority.includes("Alt")||a.priority==="Alta"?"high":""}">${a.status}</span><a class="ghost" href="${a.official}" target="_blank" rel="noopener">Apri Marketplace ↗</a></div>
      </div>
      <p>${a.description}</p>
      <div class="note">${a.note}</div>
    </article>`).join("");
}

function renderJournal(){
  const box=document.getElementById("journalEntries");
  if(!state.journal.length){box.innerHTML=`<p>Nessuna voce ancora. La prima dovrebbe essere scritta dopo il primo tramonto.</p>`;return;}
  box.innerHTML=state.journal.slice().reverse().map(e=>`
    <div class="entry"><strong>${escapeHtml(e.title||"Senza titolo")}</strong><small>Giorno ${e.day} · ${e.date}</small><p>${escapeHtml(e.text).replace(/\n/g,"<br>")}</p></div>`).join("");
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

function showView(id){
  document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active", v.id===id));
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active", b.dataset.view===id));
  const titles={
    dashboard:"La tua run, non una checklist.",
    map:"Il mondo prima della capitale.",
    objectives:"Un percorso, non una guida.",
    world:"Lo stato del tuo mondo.",
    technology:"Dalla sopravvivenza all'industria.",
    addons:"Il loadout della run.",
    journal:"Quello che è successo davvero."
  };
  document.getElementById("viewTitle").textContent=titles[id];
  window.scrollTo({top:0,behavior:"smooth"});
}

document.getElementById("nav").addEventListener("click",e=>{
  const b=e.target.closest(".nav-btn"); if(!b) return; showView(b.dataset.view);
});
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.go)));

document.getElementById("dayInput").addEventListener("change",e=>{
  state.day=Math.max(0,Number(e.target.value)||0); save(); renderAll();
});
document.getElementById("phaseInput").addEventListener("change",e=>{
  state.phase=Number(e.target.value)||1; save(); renderAll();
});
document.getElementById("currentX").addEventListener("input",e=>{state.currentX=e.target.value;save();});
document.getElementById("currentZ").addEventListener("input",e=>{state.currentZ=e.target.value;save();});
document.getElementById("saveJournal").addEventListener("click",()=>{
  const title=document.getElementById("journalTitle").value.trim();
  const text=document.getElementById("journalText").value.trim();
  if(!title && !text)return;
  state.journal.push({title,text,day:state.day,date:new Date().toLocaleDateString("it-IT")});
  save();
  document.getElementById("journalTitle").value="";
  document.getElementById("journalText").value="";
  renderJournal();
});

loadData().catch(err=>{
  console.error(err);
  document.body.innerHTML="<main style='padding:30px;font-family:system-ui;color:white;background:#0a0f0d;min-height:100vh'><h1>Rinascita</h1><p>Apri il progetto tramite un piccolo web server locale o GitHub Pages. I browser possono bloccare fetch dei file JSON quando index.html viene aperto direttamente da file://.</p></main>";
});
