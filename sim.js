/* Energo University — жалпы симуляция кітапханасы (Three.js r128 + өз графиктері). Барлық мәтін қазақ тілінде. */
(function(){
const Sim={};
window.Sim=Sim;
const $=(s,r)=> (r||document).querySelector(s);
const fmt=(v,d)=>{ if(!isFinite(v)) return '—'; const a=Math.abs(v); if(a!==0&&(a>=1e5||a<1e-3)) return v.toExponential(2).replace('e','·10^').replace('+',''); return v.toFixed(d==null?2:d); };
Sim.fmt=fmt;

/* ---------- Графиктер ---------- */
function Plot(canvas,opt){
  this.c=canvas; this.opt=opt; this.ctx=canvas.getContext('2d');
}
Plot.prototype.draw=function(d){
  const c=this.c, dpr=window.devicePixelRatio||1, w=c.clientWidth, h=c.clientHeight;
  if(!w||!h) return;
  if(c.width!==Math.round(w*dpr)){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);}
  const g=this.ctx; g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,w,h);
  const L=46,R=10,T=22,B=34, pw=w-L-R, ph=h-T-B;
  let xmin=d.xmin,xmax=d.xmax,ymin=d.ymin,ymax=d.ymax;
  const S=d.series||[];
  if(xmin==null||xmax==null||ymin==null||ymax==null){
    let a=1e300,b=-1e300,cc=1e300,e=-1e300;
    S.forEach(s=>{ for(let i=0;i<s.x.length;i++){const X=s.x[i],Y=s.y[i]; if(X<a)a=X; if(X>b)b=X; if(Y<cc)cc=Y; if(Y>e)e=Y;} });
    if(xmin==null)xmin=a; if(xmax==null)xmax=b; if(ymin==null)ymin=cc; if(ymax==null)ymax=e;
    if(ymax-ymin<1e-12){ymax+=1;ymin-=1;} const pad=(ymax-ymin)*0.08; if(d.ymin==null)ymin-=pad; if(d.ymax==null)ymax+=pad;
  }
  if(xmax-xmin<1e-12) xmax=xmin+1;
  const X=x=>L+(x-xmin)/(xmax-xmin)*pw, Y=y=>T+ph-(y-ymin)/(ymax-ymin)*ph;
  g.font='11px Segoe UI,Arial'; g.fillStyle='#14233a'; g.strokeStyle='#e3ebf4'; g.lineWidth=1;
  const nt=5;
  for(let i=0;i<=nt;i++){
    const xv=xmin+(xmax-xmin)*i/nt, yv=ymin+(ymax-ymin)*i/nt;
    g.beginPath(); g.moveTo(X(xv),T); g.lineTo(X(xv),T+ph); g.moveTo(L,Y(yv)); g.lineTo(L+pw,Y(yv)); g.stroke();
    g.textAlign='center'; g.fillText(this.tick(xv,xmax-xmin),X(xv),T+ph+13);
    g.textAlign='right'; g.fillText(this.tick(yv,ymax-ymin),L-4,Y(yv)+4);
  }
  g.strokeStyle='#9fb2c8'; g.beginPath(); g.rect(L,T,pw,ph); g.stroke();
  if(ymin<0&&ymax>0){ g.strokeStyle='#7c8da3'; g.beginPath(); g.moveTo(L,Y(0)); g.lineTo(L+pw,Y(0)); g.stroke(); }
  g.save(); g.beginPath(); g.rect(L,T,pw,ph); g.clip();
  S.forEach(s=>{
    g.strokeStyle=s.color||'#0072c6'; g.lineWidth=s.w||2; g.setLineDash(s.dash||[]);
    g.beginPath(); for(let i=0;i<s.x.length;i++){ const px=X(s.x[i]),py=Y(s.y[i]); i?g.lineTo(px,py):g.moveTo(px,py);} g.stroke();
  });
  g.setLineDash([]);
  (d.markers||[]).forEach(m=>{ g.fillStyle=m.color||'#d6232a'; g.beginPath(); g.arc(X(m.x),Y(m.y),4.5,0,7); g.fill(); });
  (d.vlines||[]).forEach(m=>{ g.strokeStyle=m.color||'#d6232a'; g.setLineDash([5,4]); g.beginPath(); g.moveTo(X(m.x),T); g.lineTo(X(m.x),T+ph); g.stroke(); g.setLineDash([]); });
  g.restore();
  g.fillStyle='#00509a'; g.font='bold 12px Segoe UI,Arial'; g.textAlign='left'; g.fillText(this.opt.title||'',L,13);
  g.fillStyle='#14233a'; g.font='11px Segoe UI,Arial'; g.textAlign='center'; g.fillText(this.opt.xlabel||'',L+pw/2,h-4);
  g.save(); g.translate(11,T+ph/2); g.rotate(-Math.PI/2); g.fillText(this.opt.ylabel||'',0,0); g.restore();
  // аңыз
  let lx=L+pw; g.textAlign='right';
  S.slice().reverse().forEach(s=>{ if(!s.label) return; g.fillStyle=s.color||'#0072c6'; g.fillText('■ '+s.label,lx,13); lx-=g.measureText('■ '+s.label).width+10; });
};
Plot.prototype.tick=function(v,span){ const a=Math.abs(v); if(a!==0&&(a>=1e5||a<1e-3)) return v.toExponential(0); const dg=span>=50?0:span>=5?1:span>=0.5?2:span>=0.05?3:4; return (+v.toFixed(dg)).toString(); };

/* ---------- Орбиталық камера ---------- */
function Orbit(camera,dom,cfg){
  const o=this; o.cam=camera; o.r=cfg.r||10; o.th=cfg.th==null?0.9:cfg.th; o.ph=cfg.ph==null?0.7:cfg.ph; o.t=new THREE.Vector3(...(cfg.target||[0,0,0]));
  o.apply=function(){ o.th=Math.max(0.05,Math.min(Math.PI-0.05,o.th)); o.r=Math.max(1,Math.min(80,o.r));
    camera.position.set(o.t.x+o.r*Math.sin(o.th)*Math.sin(o.ph),o.t.y+o.r*Math.cos(o.th),o.t.z+o.r*Math.sin(o.th)*Math.cos(o.ph)); camera.lookAt(o.t); };
  let down=false,lx=0,ly=0,pts={},pd=0;
  dom.addEventListener('pointerdown',e=>{pts[e.pointerId]=[e.clientX,e.clientY];down=true;lx=e.clientX;ly=e.clientY;dom.setPointerCapture(e.pointerId);dom.style.cursor='grabbing';});
  dom.addEventListener('pointerup',e=>{delete pts[e.pointerId];down=false;dom.style.cursor='grab';});
  dom.addEventListener('pointermove',e=>{
    if(!pts[e.pointerId])return; const ids=Object.keys(pts);
    if(ids.length===2){ pts[e.pointerId]=[e.clientX,e.clientY]; const a=pts[ids[0]],b=pts[ids[1]]; const d=Math.hypot(a[0]-b[0],a[1]-b[1]); if(pd) o.r*=pd/d; pd=d; o.apply(); return; }
    pd=0; o.ph-=(e.clientX-lx)*0.008; o.th-=(e.clientY-ly)*0.008; lx=e.clientX; ly=e.clientY; pts[e.pointerId]=[e.clientX,e.clientY]; o.apply(); });
  dom.addEventListener('wheel',e=>{e.preventDefault(); o.r*=Math.exp(e.deltaY*0.001); o.apply();},{passive:false});
  o.apply();
}

/* ---------- Көмекші: жазу (спрайт) ---------- */
Sim.label=function(text,opt){
  opt=opt||{}; const c=document.createElement('canvas'); c.width=256; c.height=64; const g=c.getContext('2d');
  g.font='bold 30px Segoe UI,Arial'; g.fillStyle=opt.color||'#ffffff'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(text,128,34);
  const t=new THREE.CanvasTexture(c); const m=new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false});
  const s=new THREE.Sprite(m); const k=opt.size||1.6; s.scale.set(k*4,k,1); return s;
};
Sim.wavelengthRGB=function(nm){ let r=0,g=0,b=0;
  if(nm>=380&&nm<440){r=-(nm-440)/60;b=1;} else if(nm<490){g=(nm-440)/50;b=1;} else if(nm<510){g=1;b=-(nm-510)/20;}
  else if(nm<580){r=(nm-510)/70;g=1;} else if(nm<645){r=1;g=-(nm-645)/65;} else if(nm<=780){r=1;}
  let f=1; if(nm<420)f=0.3+0.7*(nm-380)/40; else if(nm>700)f=0.3+0.7*(780-nm)/80; if(nm<380||nm>780){return [0.55,0.35,0.8];}
  return [Math.pow(r*f,0.8),Math.pow(g*f,0.8),Math.pow(b*f,0.8)]; };
Sim.arrow=function(color,len,headL,headW){ const a=new THREE.ArrowHelper(new THREE.Vector3(1,0,0),new THREE.Vector3(),len||1,color,headL,headW); return a; };

/* ---------- Серіппе (спираль) ---------- */
Sim.spring=function(color,turns){
  const N=160, geo=new THREE.BufferGeometry(); const pos=new Float32Array(N*3); geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const line=new THREE.Line(geo,new THREE.LineBasicMaterial({color:color||0xffd24a}));
  line.set=function(ax,ay,az,bx,by,bz,rad){ // A -> B арасындағы спираль
    const dx=bx-ax,dy=by-ay,dz=bz-az, L=Math.hypot(dx,dy,dz)||1e-6; const u=new THREE.Vector3(dx,dy,dz).normalize();
    let p=Math.abs(u.y)<0.9?new THREE.Vector3(0,1,0):new THREE.Vector3(1,0,0); const v=new THREE.Vector3().crossVectors(u,p).normalize(); const w=new THREE.Vector3().crossVectors(u,v);
    for(let i=0;i<N;i++){ const s=i/(N-1); const lead=(s<0.06||s>0.94)?0:1; const a=s*2*Math.PI*(turns||12);
      const rr=rad*lead; pos[i*3]=ax+dx*s+(v.x*Math.cos(a)+w.x*Math.sin(a))*rr; pos[i*3+1]=ay+dy*s+(v.y*Math.cos(a)+w.y*Math.sin(a))*rr; pos[i*3+2]=az+dz*s+(v.z*Math.cos(a)+w.z*Math.sin(a))*rr; }
    geo.attributes.position.needsUpdate=true; };
  line.frustumCulled=false; return line; };
Sim.grid=function(size,y,color){ const g=new THREE.GridHelper(size,size,color||0x3b6ea5,0x244a78); g.position.y=y||0; return g; };

/* ---------- Негізгі іске қосу ---------- */
Sim.init=function(cfg){
  const root=document.getElementById('app');
  const embed=/[?&]embed=1/.test(location.search);
  if(embed) document.body.classList.add('embed');
  root.innerHTML=`
  <div class="wrap">
   <header class="top"><span class="badge">${cfg.lecture||'Физика 2'}</span><h1>${cfg.title}</h1>
     <div class="uni">Ғұмарбек Дәукеев атындағы<br>Алматы энергетика және байланыс университеті</div></header>
   <div class="grid">
     <div>
      <div class="card" id="view"><div class="tag" id="tag"></div><div class="hint">Тінтуірмен айналдыру · дөңгелекпен жақындату · екі саусақпен масштабтау</div></div>
      <div class="plots" id="plots"></div>
     </div>
     <div>
      <div class="card">
        <h2>Басқару</h2>
        <div class="btns"><button id="bStart">Бастау</button><button class="sec" id="bStop">Тоқтату</button><button class="sec" id="bReset">Қайта бастау</button></div>
        <div id="ctls"></div>
      </div>
      <div class="card" style="margin-top:12px"><h2>Нәтижені бақылау</h2><div class="ro" id="ro"></div></div>
      <div class="card" style="margin-top:12px"><h2>Формулалар</h2>${(cfg.formulas||[]).map(f=>`<div class="formula">${f}</div>`).join('')}${cfg.symbols?`<p>${cfg.symbols}</p>`:''}</div>
     </div>
   </div>
   <div class="card theory"><h2>Түсініктеме</h2><div class="cols"><div>${cfg.theory||''}</div><div><div class="note">${cfg.result||''}</div></div></div></div>
  </div>`;
  const S={params:{},running:true,t:0,cfg,ro:{},plots:{}};
  window.__sim=S;
  // басқару элементтері
  const ctls=$('#ctls');
  (cfg.controls||[]).forEach(c=>{
    const d=document.createElement('div'); d.className='ctl';
    if(c.type==='select'){
      d.innerHTML=`<label>${c.label}</label><select id="c_${c.id}">${c.options.map(o=>`<option value="${o[0]}">${o[1]}</option>`).join('')}</select>`;
      ctls.appendChild(d); const el=d.querySelector('select'); el.value=c.value; S.params[c.id]=c.value;
      el.addEventListener('change',()=>{S.params[c.id]=el.value; S.changed(c.id);});
    } else {
      d.innerHTML=`<label for="c_${c.id}">${c.label}</label><output id="o_${c.id}"></output><input type="range" id="c_${c.id}" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.value}">`;
      ctls.appendChild(d); const el=d.querySelector('input'), out=d.querySelector('output');
      const upd=()=>{ S.params[c.id]=parseFloat(el.value); out.textContent=fmt(S.params[c.id],c.dec==null?(c.step<1?2:0):c.dec)+(c.unit?' '+c.unit:''); };
      upd(); el.addEventListener('input',()=>{upd(); S.changed(c.id);});
    }
  });
  S.setControl=function(id,v){ const el=$('#c_'+id); el.value=v; el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input')); };
  // көрсеткіштер
  const ro=$('#ro'); (cfg.readouts||[]).forEach(r=>{ const d=document.createElement('div'); d.innerHTML=`${r.label}<b id="r_${r.id}">—</b>`; ro.appendChild(d); S.ro[r.id]=d.querySelector('b'); });
  S.setRO=(id,txt)=>{ if(S.ro[id]) S.ro[id].textContent=txt; };
  S.tag=txt=>{ $('#tag').textContent=txt; };
  // графиктер
  (cfg.plots||[]).forEach(p=>{ const cv=document.createElement('canvas'); cv.className='plot'; $('#plots').appendChild(cv); S.plots[p.id]=new Plot(cv,p); });
  // 3D
  const view=$('#view'); const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
  view.appendChild(renderer.domElement);
  const scene=new THREE.Scene(); const camera=new THREE.PerspectiveCamera(45,1,0.1,300);
  scene.add(new THREE.AmbientLight(0xffffff,0.65)); const dl=new THREE.DirectionalLight(0xffffff,0.8); dl.position.set(5,10,7); scene.add(dl);
  const orbit=new Orbit(camera,renderer.domElement,cfg.camera||{});
  const resize=()=>{ const w=view.clientWidth,h=view.clientHeight; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); };
  window.addEventListener('resize',resize); resize();
  const ctx={S,scene,camera,renderer,THREE,orbit,params:S.params};
  S.ctx=ctx;
  S.changed=function(id){ if(cfg.onChange) cfg.onChange(ctx,id); };
  S.reset=function(){ S.t=0; if(cfg.reset) cfg.reset(ctx); S.running=true; syncBtns(); };
  function syncBtns(){ $('#bStart').classList.toggle('active',S.running); $('#bStop').classList.toggle('active',!S.running); }
  $('#bStart').onclick=()=>{S.running=true;syncBtns();}; $('#bStop').onclick=()=>{S.running=false;syncBtns();}; $('#bReset').onclick=()=>S.reset();
  if(cfg.setup) cfg.setup(ctx);
  S.reset();
  let last=performance.now();
  function loop(now){
    const dt=Math.min(0.05,(now-last)/1000); last=now;
    if(cfg.frame) cfg.frame(dt,ctx,S.running);
    renderer.render(scene,camera); requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  return S;
};
})();
