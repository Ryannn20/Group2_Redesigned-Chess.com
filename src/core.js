/* =====================================================================
   AcChess core — helpers, settings, announcer, feedback, rules engine
   ===================================================================== */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const FILES='abcdefgh';
const START_FEN='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const NAMES={p:'pawn',n:'knight',b:'bishop',r:'rook',q:'queen',k:'king'};
const PLURAL={p:'pawns',n:'knights',b:'bishops',r:'rooks',q:'queens',k:'kings'};
const ORDER=['k','q','r','b','n','p'];
const VAL={p:1,n:3,b:3,r:5,q:9,k:0};
const sqn=(r,f)=>FILES[f]+(8-r);
const sqp=n=>[8-(+n[1]),FILES.indexOf(n[0])];
const inb=(r,f)=>r>=0&&r<8&&f>=0&&f<8;
const other=c=>c==='w'?'b':'w';
const cname=c=>c==='w'?'White':'Black';
const cap1=s=>s.charAt(0).toUpperCase()+s.slice(1);
const pname=p=>`${p.c==='w'?'white':'black'} ${NAMES[p.t]}`;
const joinList=a=>a.length<=1?a.join(''):a.slice(0,-1).join(', ')+' and '+a[a.length-1];
const eqSq=(a,b)=>a&&b&&a[0]===b[0]&&a[1]===b[1];

/* ---------------------------------------------------------------------
   Settings (kept for the browser session, shared by every screen)
   --------------------------------------------------------------------- */
const REDUCED_OS=(()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}})();
const DEFAULTS={
  screenReader:false, voice:false, keyboardNav:true,
  contrast:false, boardTheme:'classic', boardSize:100, textSize:100, strongFocus:false, markers:true, reduceMotion:REDUCED_OS,
  sound:true, speech:false, speakBoard:false, rate:1, verbosity:'standard',
  haptic:false, volume:80,
  pieceTheme:'classic', clickToMove:true, largeTargets:false, confirmActions:true, untimed:false, continuousListen:false,
  spaceTalk:true, lowTime:true, lowTimeAt:60
};
/* Preferences are saved in the browser (localStorage; falls back to sessionStorage, then to memory).
   Nothing leaves the device. "Reset to defaults" in Accessibility Settings clears them. */
const Store={
  mem:{},
  get(k){try{const v=localStorage.getItem(k);if(v!==null)return v}catch(e){}try{const v=sessionStorage.getItem(k);if(v!==null)return v}catch(e){}return k in this.mem?this.mem[k]:null},
  set(k,v){this.mem[k]=v;try{localStorage.setItem(k,v);return true}catch(e){}try{sessionStorage.setItem(k,v)}catch(e2){}return false},
  del(k){delete this.mem[k];try{localStorage.removeItem(k)}catch(e){}try{sessionStorage.removeItem(k)}catch(e){}},
  get persistent(){try{localStorage.setItem('__t','1');localStorage.removeItem('__t');return true}catch(e){return false}}
};
let S=Object.assign({},DEFAULTS);
try{const raw=Store.get('acchess.settings');if(raw)S=Object.assign({},DEFAULTS,JSON.parse(raw))}catch(e){}
const settingSubs=[];
function saveSettings(){Store.set('acchess.settings',JSON.stringify(S))}
function applySettings(){
  const h=document.documentElement;
  h.dataset.contrast=S.contrast?'high':'normal';
  h.dataset.board=S.boardTheme;
  h.dataset.focus=S.strongFocus?'strong':'normal';
  h.dataset.motion=S.reduceMotion?'reduced':'full';
  h.dataset.markers=S.markers?'enhanced':'basic';
  h.dataset.targets=S.largeTargets?'large':'normal';
  h.dataset.pieces=S.pieceTheme;
  h.dataset.click=S.clickToMove?'click':'drag';
  h.dataset.text=S.textSize>=130?'large':'normal';
  h.style.setProperty('--ts',S.textSize/100);
  h.style.setProperty('--bs',S.boardSize/100);
  h.dataset.bigboard=S.boardSize>130?'on':'off';
}
function setSetting(k,v){S[k]=v;saveSettings();applySettings();settingSubs.forEach(fn=>fn(k,v))}
function resetSettings(){S=Object.assign({},DEFAULTS);saveSettings();applySettings();settingSubs.forEach(fn=>fn('*',null))}

/* ---------------------------------------------------------------------
   Announcer: ARIA live regions + optional speech + visible transcript
   --------------------------------------------------------------------- */
const Ann={log:[],subs:new Set(),last:'',lastAt:0,noted:{}};
function liveSay(text,urgent){
  const el=document.getElementById(urgent?'live-assertive':'live-polite');
  if(!el)return;
  el.textContent='';
  setTimeout(()=>{el.textContent=text},40);
}
const speechSupported=()=>('speechSynthesis' in window)&&('SpeechSynthesisUtterance' in window);
/* spoken board descriptions (focus announcements) need "speakBoard";
   spoken game announcements need "speech"; answers to explicit questions use either */
function speakAllowed(kind){
  if(kind==='focus')return S.speakBoard;
  if(kind==='cmd')return S.speakBoard||S.speech;
  return S.speech;
}
function speak(text,urgent,kind,done){
  if(!speakAllowed(kind))return false;
  if(!speechSupported()){
    if(!Ann.noted.speech){Ann.noted.speech=1;pushLog('Speech synthesis is not supported in this browser, so announcements are shown as text only.','info',false)}
    return false;
  }
  try{
    const ss=window.speechSynthesis;
    if(urgent||ss.pending)ss.cancel();
    const u=new SpeechSynthesisUtterance(text);u.rate=S.rate;u.lang='en-US';u.volume=Math.max(0,Math.min(1,S.volume/100));
    let fired=false;const fin=()=>{if(!fired){fired=true;done&&done()}};
    const ttsEnd=()=>{if(typeof Voice!=='undefined'){Voice.ttsBusy=false;Voice.ttsUntil=Date.now()+900}fin()};
    u.onstart=()=>{if(typeof Voice!=='undefined')Voice.ttsBusy=true};
    u.onend=ttsEnd;u.onerror=ttsEnd;
    if(done)setTimeout(fin,Math.max(2200,text.length*110));
    ss.speak(u);return true;
  }catch(e){return false}
}
function pushLog(text,kind,spoken,urgent){
  const entry={t:new Date(),text,kind:kind||'info',spoken:!!spoken,urgent:!!urgent};
  const lastE=Ann.log[Ann.log.length-1];
  if(kind==='focus'&&lastE&&lastE.kind==='focus')Ann.log[Ann.log.length-1]=entry;else Ann.log.push(entry);
  if(Ann.log.length>150)Ann.log.shift();
  Ann.subs.forEach(fn=>fn(entry));
  return entry;
}
/* say(): o.kind = game|cmd|info|alert|focus|fx ; o.urgent -> assertive + cancels older speech */
function say(text,o={}){
  const now=Date.now();
  if(!o.force&&text===Ann.last&&now-Ann.lastAt<1200)return;
  Ann.last=text;Ann.lastAt=now;
  const spoken=o.speak===false?false:speak(text,o.urgent,o.kind,o.done);
  if(!spoken&&o.done)o.done();
  if(o.live!==false&&o.kind!=='focus'&&o.kind!=='fx')liveSay(text,o.urgent);
  pushLog(text,o.kind||'info',spoken,o.urgent);
}
function stopSpeaking(){try{if(speechSupported())window.speechSynthesis.cancel()}catch(e){}}

/* ---------------------------------------------------------------------
   Audio + haptic feedback (never on page load; only after user actions)
   --------------------------------------------------------------------- */
const Sfx={
  ctx:null,
  ensure(){
    const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;
    if(!this.ctx){try{this.ctx=new C()}catch(e){return null}}
    if(this.ctx.state==='suspended')try{this.ctx.resume()}catch(e){}
    return this.ctx;
  },
  PATTERNS:{
    select:[[880,.05,'sine']],
    move:[[196,.09,'triangle'],[147,.1,'triangle']],
    opponent:[[330,.08,'triangle'],[262,.12,'triangle']],
    invalid:[[130,.18,'square']],
    check:[[587,.1,'sawtooth'],[784,.16,'sawtooth']],
    mate:[[523,.14,'triangle'],[415,.14,'triangle'],[330,.14,'triangle'],[262,.3,'triangle']],
    test:[[660,.1,'sine'],[880,.14,'sine']],
    lowtime:[[880,.1,'square'],[1175,.1,'square'],[880,.1,'square'],[1175,.18,'square']],
    tick:[[1320,.035,'square']]
  },
  play(kind){
    if(!S.sound)return null;
    const c=this.ensure();if(!c)return false;
    if(c.state!=='running')return false;
    let t=c.currentTime+.01;
    (this.PATTERNS[kind]||this.PATTERNS.select).forEach(([f,d,type])=>{
      const o=c.createOscillator(),g=c.createGain();
      o.type=type;o.frequency.value=f;
      const peak=Math.max(.0002,.15*(S.volume/100));
      g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);
      o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+d+.02);t+=d*.9;
    });
    return true;
  }
};
const Haptics={
  PATTERNS:{select:[20],move:[40],opponent:[30,60,30],invalid:[90,50,90],check:[60,40,60,40,140],mate:[220,80,220,80,320],test:[100,60,100],lowtime:[120,60,120,60,240]},
  supported:()=>typeof navigator!=='undefined'&&typeof navigator.vibrate==='function',
  fire(kind){
    if(!S.haptic)return null;
    const p=this.PATTERNS[kind]||this.PATTERNS.select;
    if(this.supported()){
      let ok=false;try{ok=navigator.vibrate(p)}catch(e){}
      return {real:!!ok,demo:false};
    }
    return {real:false,demo:true};
  }
};
const FX_LABEL={select:'Piece selected',move:'Move played',opponent:'Opponent moved',invalid:'Illegal move',check:'Check',mate:'Checkmate',test:'Test',lowtime:'Low time'};
const fxSubs=new Set();
function fx(kind){
  const parts=[];
  if(S.sound){const r=Sfx.play(kind);parts.push(r?'sound played':'sound unavailable')}
  const h=Haptics.fire(kind);
  if(h)parts.push(h.real?'vibration sent':(h.demo?'vibration unsupported, visual demo shown':'vibration request ignored by the device'));
  if(parts.length){
    const text=`Feedback — ${FX_LABEL[kind]||kind}: ${parts.join(', ')}.`;
    pushLog(text,'fx',false);
  }
  fxSubs.forEach(fn=>fn(kind,h));
}

/* =====================================================================
   Chess rules engine — legal move generation, check, mate, castling,
   en passant, promotion, draws by stalemate / 50 moves / material
   ===================================================================== */
const KN=[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
const KG=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
const ORTH=[[1,0],[-1,0],[0,1],[0,-1]],DIAG=[[1,1],[1,-1],[-1,1],[-1,-1]];
const cloneG=g=>g.map(r=>r.map(p=>p?{t:p.t,c:p.c}:null));
function parseFEN(fen){
  const [pl,turn='w',cas='-',ep='-',half='0',full='1']=fen.trim().split(/\s+/);
  const g=pl.split('/').map(row=>{const a=[];for(const ch of row){
    if(/\d/.test(ch))for(let i=0;i<+ch;i++)a.push(null);
    else a.push({t:ch.toLowerCase(),c:ch===ch.toUpperCase()?'w':'b'})}return a});
  return {g,turn,castle:{K:cas.includes('K'),Q:cas.includes('Q'),k:cas.includes('k'),q:cas.includes('q')},
    ep:ep==='-'?null:sqp(ep),half:+half,full:+full};
}
function attacked(g,r,f,by){
  const pr=r+(by==='w'?1:-1);
  for(const df of[-1,1]){if(inb(pr,f+df)){const p=g[pr][f+df];if(p&&p.c===by&&p.t==='p')return true}}
  for(const[a,b]of KN){const rr=r+a,ff=f+b;if(inb(rr,ff)){const p=g[rr][ff];if(p&&p.c===by&&p.t==='n')return true}}
  for(const[a,b]of KG){const rr=r+a,ff=f+b;if(inb(rr,ff)){const p=g[rr][ff];if(p&&p.c===by&&p.t==='k')return true}}
  for(const[a,b]of KG){
    let rr=r+a,ff=f+b;
    while(inb(rr,ff)){
      const p=g[rr][ff];
      if(p){if(p.c===by){const diag=a!==0&&b!==0;if(p.t==='q'||(diag&&p.t==='b')||(!diag&&p.t==='r'))return true}break}
      rr+=a;ff+=b;
    }
  }
  return false;
}
function kingPos(g,c){for(let r=0;r<8;r++)for(let f=0;f<8;f++){const p=g[r][f];if(p&&p.t==='k'&&p.c===c)return [r,f]}return null}
function inCheck(g,c){const k=kingPos(g,c);return k?attacked(g,k[0],k[1],other(c)):false}
function pseudo(s,r,f){
  const g=s.g,p=g[r][f],out=[];if(!p)return out;
  const add=(a,b,x)=>out.push(Object.assign({from:[r,f],to:[a,b],p:p.t,c:p.c,cap:g[a][b]?g[a][b].t:null},x||{}));
  if(p.t==='p'){
    const d=p.c==='w'?-1:1,st=p.c==='w'?6:1,pr=p.c==='w'?0:7,a=r+d;
    const addP=(b,x)=>{if(a===pr){for(const q of'qrbn')add(a,b,Object.assign({promo:q},x||{}))}else add(a,b,x)};
    if(inb(a,f)&&!g[a][f]){addP(f);if(r===st&&!g[r+2*d][f])add(r+2*d,f,{double:true})}
    for(const df of[-1,1]){
      const b=f+df;if(!inb(a,b))continue;
      if(g[a][b]&&g[a][b].c!==p.c)addP(b);
      else if(!g[a][b]&&s.ep&&s.ep[0]===a&&s.ep[1]===b)add(a,b,{ep:true,cap:'p'});
    }
  }else if(p.t==='n'){
    for(const[a,b]of KN){const rr=r+a,ff=f+b;if(inb(rr,ff)&&(!g[rr][ff]||g[rr][ff].c!==p.c))add(rr,ff)}
  }else if(p.t==='k'){
    for(const[a,b]of KG){const rr=r+a,ff=f+b;if(inb(rr,ff)&&(!g[rr][ff]||g[rr][ff].c!==p.c))add(rr,ff)}
    const home=p.c==='w'?7:0,en=other(p.c);
    if(r===home&&f===4&&!attacked(g,home,4,en)){
      const ks=p.c==='w'?'K':'k',qs=p.c==='w'?'Q':'q';
      const rk=x=>g[home][x]&&g[home][x].t==='r'&&g[home][x].c===p.c;
      if(s.castle[ks]&&!g[home][5]&&!g[home][6]&&rk(7)&&!attacked(g,home,5,en)&&!attacked(g,home,6,en))add(home,6,{castle:'K'});
      if(s.castle[qs]&&!g[home][3]&&!g[home][2]&&!g[home][1]&&rk(0)&&!attacked(g,home,3,en)&&!attacked(g,home,2,en))add(home,2,{castle:'Q'});
    }
  }else{
    const dirs=p.t==='b'?DIAG:p.t==='r'?ORTH:KG;
    for(const[a,b]of dirs){
      let rr=r+a,ff=f+b;
      while(inb(rr,ff)){
        const q=g[rr][ff];
        if(!q)add(rr,ff);else{if(q.c!==p.c)add(rr,ff);break}
        rr+=a;ff+=b;
      }
    }
  }
  return out;
}
function applyMove(s,m){
  const g=cloneG(s.g),p=g[m.from[0]][m.from[1]];
  g[m.from[0]][m.from[1]]=null;
  if(m.ep)g[m.from[0]][m.to[1]]=null;
  g[m.to[0]][m.to[1]]=m.promo?{t:m.promo,c:p.c}:p;
  if(m.castle){const rk=m.from[0];if(m.castle==='K'){g[rk][5]=g[rk][7];g[rk][7]=null}else{g[rk][3]=g[rk][0];g[rk][0]=null}}
  const castle=Object.assign({},s.castle);
  if(p.t==='k'){if(p.c==='w'){castle.K=castle.Q=false}else{castle.k=castle.q=false}}
  for(const q of[m.from,m.to]){const n=sqn(q[0],q[1]);
    if(n==='a1')castle.Q=false;if(n==='h1')castle.K=false;if(n==='a8')castle.q=false;if(n==='h8')castle.k=false}
  return {g,turn:other(s.turn),castle,ep:m.double?[(m.from[0]+m.to[0])/2,m.from[1]]:null,
    half:(p.t==='p'||m.cap)?0:s.half+1,full:s.full+(s.turn==='b'?1:0)};
}
function legalMoves(s,r,f){
  const res=[];
  const scan=(rr,ff)=>{const p=s.g[rr][ff];if(!p||p.c!==s.turn)return;
    for(const m of pseudo(s,rr,ff)){const ns=applyMove(s,m);if(!inCheck(ns.g,s.turn))res.push(m)}};
  if(r!==undefined)scan(r,f);else for(let a=0;a<8;a++)for(let b=0;b<8;b++)scan(a,b);
  return res;
}
function insufficient(g){
  const rest=[];for(const row of g)for(const p of row)if(p&&p.t!=='k')rest.push(p);
  if(!rest.length)return true;
  if(rest.length===1&&(rest[0].t==='b'||rest[0].t==='n'))return true;
  return false;
}
function gameStatus(s){
  const moves=legalMoves(s),chk=inCheck(s.g,s.turn);
  if(!moves.length)return chk?{over:true,result:'checkmate',winner:other(s.turn),loser:s.turn,check:true}:{over:true,result:'stalemate'};
  if(insufficient(s.g))return {over:true,result:'draw',reason:'insufficient material'};
  if(s.half>=100)return {over:true,result:'draw',reason:'the fifty-move rule'};
  return {over:false,check:chk};
}
function toSAN(s,m,legal){
  let base;
  if(m.castle)base=m.castle==='K'?'O-O':'O-O-O';
  else{
    let str='';
    if(m.p!=='p'){
      str+=m.p.toUpperCase();
      const o=legal.filter(x=>x.p===m.p&&eqSq(x.to,m.to)&&!eqSq(x.from,m.from));
      if(o.length){
        if(!o.some(x=>x.from[1]===m.from[1]))str+=FILES[m.from[1]];
        else if(!o.some(x=>x.from[0]===m.from[0]))str+=(8-m.from[0]);
        else str+=sqn(m.from[0],m.from[1]);
      }
    }else if(m.cap)str+=FILES[m.from[1]];
    if(m.cap)str+='x';
    str+=sqn(m.to[0],m.to[1]);
    if(m.promo)str+='='+m.promo.toUpperCase();
    base=str;
  }
  const st=gameStatus(applyMove(s,m));
  return base+(st.result==='checkmate'?'#':st.check?'+':'');
}
class Chess{
  constructor(fen=START_FEN){this.startFen=fen;this.reset()}
  reset(fen){if(fen)this.startFen=fen;this.states=[parseFEN(this.startFen)];this.moves=[];this.ended=null}
  get s(){return this.states[this.states.length-1]}
  get turn(){return this.s.turn}
  legal(r,f){return legalMoves(this.s,r,f)}
  status(){return this.ended?Object.assign({over:true},this.ended):gameStatus(this.s)}
  play(m){
    const san=toSAN(this.s,m,legalMoves(this.s));
    const rec={m,san,c:this.s.turn,before:this.s};
    this.moves.push(rec);this.states.push(applyMove(this.s,m));return rec;
  }
  undo(n=1){for(let i=0;i<n&&this.moves.length;i++){this.moves.pop();this.states.pop()}this.ended=null}
}
function opponentPick(game){
  const s=game.s,moves=legalMoves(s);if(!moves.length)return null;
  let seed=(game.moves.length+3)*7919+17;
  const rnd=()=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff};
  let best=null,bs=-1e9;
  for(const m of moves){
    const ns=applyMove(s,m),st=gameStatus(ns);
    let sc=rnd()*2;
    if(st.result==='checkmate')sc+=1000;
    if(st.check)sc+=3;
    if(m.cap)sc+=VAL[m.cap]*10-VAL[m.p];
    if(m.promo)sc+=8;
    if(m.castle)sc+=4;
    if(attacked(ns.g,m.to[0],m.to[1],other(m.c)))sc-=VAL[m.p]*6;
    if(sc>bs){bs=sc;best=m}
  }
  return best;
}

/* =====================================================================
   Text descriptions — always generated from the real board state
   ===================================================================== */
function describeSquare(s,name){
  const [r,f]=sqp(name),p=s.g[r][f];
  return p?`${cap1(pname(p))} on ${name}.`:`Square ${name} is empty.`;
}
function describeBoard(s,st){
  const out=[];
  for(const c of['w','b'])for(const t of ORDER){
    const sq=[];
    for(let f=0;f<8;f++)for(let r=7;r>=0;r--){const p=s.g[r][f];if(p&&p.c===c&&p.t===t)sq.push(sqn(r,f))}
    if(!sq.length)continue;
    out.push(sq.length===1?`${cname(c)} ${NAMES[t]} on ${sq[0]}.`:`${cname(c)} ${PLURAL[t]} on ${joinList(sq)}.`);
  }
  out.push(turnText(s,st));
  return out.join(' ');
}
function resultText(st){
  switch(st.result){
    case'checkmate':return `Checkmate. ${cname(st.winner)} wins.`;
    case'stalemate':return 'Stalemate. The game is a draw.';
    case'draw':return `The game is a draw by ${st.reason}.`;
    case'draw-agreed':return 'The game is a draw by agreement.';
    case'resigned':return `${cname(st.loser)} resigned. ${cname(st.winner)} wins.`;
    case'timeout':return `${cname(st.loser)} ran out of time. ${cname(st.winner)} wins.`;
    case'aborted':return 'The game was aborted.';
  }
  return 'The game is over.';
}
function turnText(s,st){
  if(st&&st.over)return resultText(st);
  return `It is ${cname(s.turn)}'s turn.`+(st&&st.check?` ${cname(s.turn)} is in check.`:'');
}
function moveWords(rec,level){
  const m=rec.m,to=sqn(...m.to),from=sqn(...m.from);
  if(level==='minimal')return rec.san;
  let t;
  if(m.castle)t=`${cname(rec.c)} castled ${m.castle==='K'?'kingside':'queenside'}`;
  else{
    const who=`${cname(rec.c)} ${NAMES[m.p]}`;
    const victim=m.ep?{t:'p',c:other(rec.c)}:rec.before.g[m.to[0]][m.to[1]];
    t=`${who} moved from ${from} to ${to}`;
    if(victim)t+=`, capturing ${pname(victim)}`;
    if(m.promo)t+=`, promoting to ${NAMES[m.promo]}`;
  }
  return t+'.';
}
function legalText(s,name){
  if(name){
    const [r,f]=sqp(name),p=s.g[r][f];
    if(!p)return `There is no piece on ${name}.`;
    if(p.c!==s.turn)return `The ${pname(p)} on ${name} is not on move. It is ${cname(s.turn)}'s turn.`;
    const mv=legalMoves(s,r,f);
    if(!mv.length)return `The ${pname(p)} on ${name} has no legal moves.`;
    const dest=[...new Set(mv.map(m=>sqn(...m.to)+(m.cap?' capturing':'')+(m.promo&&m.promo!=='q'?'':'')))];
    const names=[...new Set(mv.map(m=>sqn(...m.to)))].map(n=>{
      const cm=mv.find(m=>sqn(...m.to)===n&&m.cap);
      const victim=cm?(cm.ep?'pawn':NAMES[cm.cap]):null;
      return victim?`${n} (captures ${victim})`:n;
    });
    return `The ${pname(p)} on ${name} can move to ${joinList(names)}.`;
  }
  const all=legalMoves(s);
  if(!all.length)return 'There are no legal moves.';
  const by={};
  for(const m of all){const k=NAMES[m.p]+' '+sqn(...m.from);(by[k]=by[k]||new Set()).add(sqn(...m.to))}
  return `${all.length} legal moves for ${cname(s.turn)}. `+Object.entries(by).map(([k,v])=>`${cap1(k)}: ${joinList([...v])}.`).join(' ');
}
function explainIllegal(game,from,to){
  const s=game.s,fn=sqn(...from),tn=sqn(...to),p=s.g[from[0]][from[1]];
  if(game.status().over)return 'The game is over. No more moves can be made.';
  if(!p)return `There is no piece on ${fn}.`;
  if(p.c!==s.turn)return `That is a ${pname(p)}. It is ${cname(s.turn)}'s turn.`;
  if(eqSq(from,to))return 'The origin and destination are the same square.';
  const ps=pseudo(s,from[0],from[1]).filter(m=>eqSq(m.to,to));
  if(ps.length)return inCheck(s.g,s.turn)
    ? `Illegal move. You are in check and ${fn} to ${tn} does not resolve it.`
    : `Illegal move. ${fn} to ${tn} would leave your king in check.`;
  const target=s.g[to[0]][to[1]];
  if(target&&target.c===p.c)return `Illegal move. Your own ${NAMES[target.t]} is on ${tn}.`;
  if('rbq'.includes(p.t)){
    const dr=Math.sign(to[0]-from[0]),df=Math.sign(to[1]-from[1]),ar=Math.abs(to[0]-from[0]),af=Math.abs(to[1]-from[1]);
    const line=(dr===0||df===0)?p.t!=='b':(ar===af&&p.t!=='r');
    if(line){
      let r=from[0]+dr,f=from[1]+df;
      while((r!==to[0]||f!==to[1])&&inb(r,f)){const b=s.g[r][f];if(b)return `Illegal move. The path from ${fn} to ${tn} is blocked by the ${pname(b)} on ${sqn(r,f)}.`;r+=dr;f+=df}
    }
  }
  return `Illegal move. A ${pname(p)} cannot move from ${fn} to ${tn}.`;
}
