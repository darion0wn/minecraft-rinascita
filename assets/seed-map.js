(() => {
  const svg = document.getElementById('seedMap');
  if (!svg) return;

  const NS = 'http://www.w3.org/2000/svg';
  const XMIN = -2400, XMAX = 2400, ZMIN = -1900, ZMAX = 1700;
  const W = 1600, H = 900;
  const state = { scale: 1, tx: 0, ty: 0, dragging: false, sx: 0, sy: 0, stx: 0, sty: 0 };
  const shell = document.getElementById('seedMapShell');
  const coords = document.getElementById('mapCoords');
  const layer = document.createElementNS(NS, 'g');
  const terrain = document.createElementNS(NS, 'g');
  const grid = document.createElementNS(NS, 'g');
  const markers = document.createElementNS(NS, 'g');
  const labels = document.createElementNS(NS, 'g');
  layer.setAttribute('id', 'mapViewport');
  layer.append(terrain, grid, markers, labels);
  svg.appendChild(layer);

  const clamp = (v,a,b) => Math.max(a, Math.min(b,v));
  const mx = x => ((x-XMIN)/(XMAX-XMIN))*W;
  const mz = z => ((z-ZMIN)/(ZMAX-ZMIN))*H;
  const el = (tag, attrs={}) => { const e=document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v)); return e; };
  const txt = (str, attrs={}) => { const e=el('text',attrs); e.textContent=str; return e; };

  const defs = el('defs');
  defs.innerHTML = `
    <filter id="mshadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#001521" flood-opacity=".45"/></filter>
    <pattern id="mapGrid" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0H0V80" fill="none" stroke="#b8e4f3" stroke-opacity=".10" stroke-width="1"/></pattern>
    <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#1b87bf"/><stop offset="1" stop-color="#0a4270"/></linearGradient>
    <pattern id="grassPat" width="44" height="44" patternUnits="userSpaceOnUse"><rect width="44" height="44" fill="#62bc62"/><path d="M0 36l11-9 9 5 12-7 12 9v10H0z" fill="#53a95a" opacity=".72"/></pattern>
    <pattern id="forestPat" width="44" height="44" patternUnits="userSpaceOnUse"><rect width="44" height="44" fill="#25875a"/><path d="M22 6 37 29H7z" fill="#0f6946"/><rect x="18" y="27" width="8" height="11" fill="#76523b"/></pattern>
    <pattern id="cherryPat" width="44" height="44" patternUnits="userSpaceOnUse"><rect width="44" height="44" fill="#d88db3"/><circle cx="9" cy="10" r="4" fill="#ffd3e9"/><circle cx="28" cy="22" r="5" fill="#f7b5d6"/><circle cx="18" cy="35" r="3" fill="#ffd7ec"/></pattern>
    <pattern id="snowPat" width="50" height="50" patternUnits="userSpaceOnUse"><rect width="50" height="50" fill="#d8edf5"/><path d="M0 35l14-12 9 8 11-16 16 18v17H0z" fill="#b6d2de"/></pattern>
    <pattern id="desertPat" width="54" height="54" patternUnits="userSpaceOnUse"><rect width="54" height="54" fill="#e2bf55"/><path d="M0 14h54M0 35h54" stroke="#cba73e" stroke-width="4" opacity=".55"/></pattern>
    <style>
      .mtext{font-family:Inter,system-ui,sans-serif;fill:#eefaff}.mminor{font-family:Inter,system-ui,sans-serif;fill:#9bc3d3}.mhead{font-family:Inter,system-ui,sans-serif;fill:#dff7ff;font-size:18px;font-weight:800;letter-spacing:2px}.mgrid{font-family:Inter,system-ui,sans-serif;fill:#a9cedc;font-size:16px;font-weight:700}.mhalo{paint-order:stroke;stroke:#06203a;stroke-width:5;stroke-linejoin:round}
    </style>`;
  svg.appendChild(defs);
  svg.appendChild(el('rect',{x:0,y:0,width:W,height:H,fill:'url(#waterGrad)'}));

  // Stylized terrain based on the known region. Exact block generation remains available on Chunkbase.
  const regions = [
    ['grass', 120, 100, 450, 240, -18], ['forest', 630, 70, 360, 220, 8], ['snow', 1035, 70, 350, 235, 0],
    ['forest', 1270, 230, 300, 210, 0], ['grass', 240, 320, 1040, 360, -3], ['cherry', 470, 370, 330, 230, 12],
    ['snow', 800, 370, 290, 215, -8], ['desert', 1120, 420, 290, 190, -7], ['forest', 160, 600, 350, 190, -12],
    ['grass', 720, 640, 380, 220, 8], ['desert', 1210, 650, 280, 190, 5], ['forest', 1450, 585, 200, 170, 0]
  ];
  const fillMap = {grass:'url(#grassPat)',forest:'url(#forestPat)',cherry:'url(#cherryPat)',snow:'url(#snowPat)',desert:'url(#desertPat)'};
  regions.forEach(([type,x,y,w,h,rot]) => {
    const e=el('rect',{x,y,width:w,height:h,rx:60,fill:fillMap[type],stroke:'#16506a','stroke-width':3,filter:'url(#mshadow)',transform:`rotate(${rot} ${x+w/2} ${y+h/2})`}); terrain.appendChild(e);
  });
  // Rivers / water inlets
  const river=el('path',{d:'M70 520 C330 420 520 500 690 570 S980 760 1210 680 S1440 520 1545 590',fill:'none',stroke:'#2c9ed1','stroke-width':72,'stroke-linecap':'round','opacity':'.60'}); terrain.appendChild(river);
  terrain.appendChild(el('path',{d:'M70 520 C330 420 520 500 690 570 S980 760 1210 680 S1440 520 1545 590',fill:'none',stroke:'#4cc7eb','stroke-width':20,'stroke-linecap':'round','opacity':'.35'}));
  // islands / coast accents
  [[65,260,100,65],[1510,360,85,60],[470,160,75,55],[910,640,110,55],[310,760,85,45]].forEach(([x,y,w,h])=>terrain.appendChild(el('ellipse',{cx:x+w/2,cy:y+h/2,rx:w/2,ry:h/2,fill:'#23805c',stroke:'#16506a','stroke-width':3,opacity:.95})));

  for(let x=-2000;x<=2000;x+=500){
    const px=mx(x); grid.appendChild(el('line',{x1:px,y1:0,x2:px,y2:H,stroke:'#a9d6e4','stroke-opacity':'.16','stroke-dasharray':'6 10'})); grid.appendChild(txt(String(x),{x:px+6,y:26,class:'mgrid'}));
  }
  for(let z=-1500;z<=1500;z+=500){
    const py=mz(z); grid.appendChild(el('line',{x1:0,y1:py,x2:W,y2:py,stroke:'#a9d6e4','stroke-opacity':'.16','stroke-dasharray':'6 10'})); grid.appendChild(txt(String(z),{x:12,y:py-6,class:'mgrid'}));
  }
  grid.appendChild(el('rect',{x:0,y:0,width:W,height:H,fill:'url(#mapGrid)'}));
  grid.appendChild(txt('N',{x:W-52,y:48,class:'mhead'}));
  grid.appendChild(el('path',{d:`M${W-40} 58 L${W-28} 84 L${W-16} 58 L${W-28} 30 Z`,fill:'#e9f7ff',opacity:'.95'}));

  const points = [
    {id:'capital',x:344,z:-312,label:'CAPITALE · DA TROVARE',kind:'capital',desc:'Punto attuale di riferimento della run.'},
    {id:'cherry',x:344,z:-312,label:'Villaggio dei Ciliegi',kind:'village',desc:'Prima tappa esplorata nel Giorno 1.'},
    {id:'trial1',x:311,z:-425,label:'Trial Chamber NW',kind:'trial',desc:'Trial Chamber conosciuta del settore.'},
    {id:'portal1',x:344,z:-584,label:'Portale in rovina',kind:'portal',desc:'Rovine del portale note.'},
    {id:'trial2',x:713,z:-457,label:'Trial Chamber Est',kind:'trial',desc:'Seconda Trial Chamber nota.'},
    {id:'portal2',x:712,z:-488,label:'Portale in rovina Est',kind:'portal',desc:'Secondo portale in rovina noto.'},
    {id:'village2',x:792,z:-344,label:'Villaggio delle Pianure',kind:'village',desc:'Possibile futuro avamposto.'}
  ];
  const colors={village:'#f3b34e',trial:'#5eb1ff',portal:'#b66cff',capital:'#ff5b57'};
  function markerPoint(p){return {px: ((p.x-XMIN)/(XMAX-XMIN))*W, py: ((p.z-ZMIN)/(ZMAX-ZMIN))*H};}
  function addMarker(p){
    const {px,py}=markerPoint(p);
    const g=el('g',{class:'map-marker',tabindex:'0','data-kind':p.kind,'data-x':p.x,'data-z':p.z});
    if(p.kind==='capital'){ g.appendChild(el('circle',{cx:px,cy:py,r:28,fill:'#ff5b57',opacity:'.20'})); }
    g.appendChild(el('circle',{cx:px,cy:py,r:p.kind==='capital'?16:11,fill:colors[p.kind],stroke:'#eaf8ff','stroke-width':3,filter:'url(#mshadow)'}));
    g.appendChild(txt(p.kind==='village'?'V':p.kind==='trial'?'T':p.kind==='portal'?'P':'C',{x:px,y:py+6,'text-anchor':'middle',class:'mtext','font-size':p.kind==='capital'?17:13,'font-weight':'900'}));
    const group=el('g',{transform:`translate(${px+18} ${py-18})`});
    const bg=el('rect',{x:0,y:0,width:260,height:52,rx:10,fill:'#061a2b',stroke:colors[p.kind],'stroke-width':2,opacity:'.97'});
    const name=txt(p.label,{x:12,y:21,class:'mtext','font-size':'14','font-weight':'800'});
    const meta=txt(`X ${p.x} · Z ${p.z}`,{x:12,y:40,class:'mminor','font-size':'11'});
    group.append(bg,name,meta);
    labels.appendChild(group);
    labels.lastChild.style.display='none';
    const on = ()=>{ labels.lastChild.style.display='block'; if(coords) coords.textContent=`X ${p.x} · Z ${p.z} · ${p.label}`; };
    const off = ()=>{ labels.lastChild.style.display='none'; };
    g.addEventListener('click', e=>{e.stopPropagation();on();});
    g.addEventListener('mouseenter',on); g.addEventListener('mouseleave',off);
    markers.appendChild(g);
  }
  points.forEach(addMarker);
  const title=txt('SEED 7568542259593820684 · BEDROCK 26.44',{x:32,y:860,class:'mminor','font-size':14,'font-weight':'800','letter-spacing':'2'}); grid.appendChild(title);
  const note=txt('PANORAMICA STILIZZATA · POI REALI DELLA RUN',{x:W-32,y:860,'text-anchor':'end',class:'mminor','font-size':14,'font-weight':'800'}); grid.appendChild(note);

  function apply(){ layer.setAttribute('transform',`translate(${state.tx} ${state.ty}) scale(${state.scale})`); }
  function zoomAt(factor,cx=W/2,cy=H/2){
    const ns=clamp(state.scale*factor,.8,2.8);
    const ratio=ns/state.scale;
    state.tx = cx - (cx-state.tx)*ratio;
    state.ty = cy - (cy-state.ty)*ratio;
    state.scale=ns; apply();
  }
  document.getElementById('mapZoomIn')?.addEventListener('click',()=>zoomAt(1.22));
  document.getElementById('mapZoomOut')?.addEventListener('click',()=>zoomAt(0.82));
  document.getElementById('mapReset')?.addEventListener('click',()=>{state.scale=1;state.tx=0;state.ty=0;apply(); if(coords) coords.textContent='X 344 · Z -312';});
  shell?.addEventListener('wheel', e=>{e.preventDefault(); const r=svg.getBoundingClientRect(); const px=((e.clientX-r.left)/r.width)*W; const py=((e.clientY-r.top)/r.height)*H; zoomAt(e.deltaY<0?1.1:0.9,px,py);},{passive:false});
  shell?.addEventListener('pointerdown',e=>{state.dragging=true;state.sx=e.clientX;state.sy=e.clientY;state.stx=state.tx;state.sty=state.ty;shell.setPointerCapture(e.pointerId);});
  shell?.addEventListener('pointermove',e=>{if(!state.dragging)return; const r=svg.getBoundingClientRect(); state.tx=state.stx+(e.clientX-state.sx)*(W/r.width); state.ty=state.sty+(e.clientY-state.sy)*(H/r.height); apply();});
  shell?.addEventListener('pointerup',()=>{state.dragging=false;});
  shell?.addEventListener('pointercancel',()=>{state.dragging=false;});
  shell?.addEventListener('click',e=>{if(e.target===svg && coords) coords.textContent='Trascina la mappa · rotellina per zoom';});
  apply();
})();
