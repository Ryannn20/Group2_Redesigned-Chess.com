/* =====================================================================
   Accessible chessboard (ARIA grid, roving tabindex, markers)
   ===================================================================== */
const PAL_HC={w:{f:'#ffffff',s:'#000000',d:'#000000',sw:5},b:{f:'#000000',s:'#ffffff',d:'#ffffff',sw:5}};
const boardPal=()=>S.pieceTheme==='hc'?PAL_HC:null;

class ABoard{
  constructor(host,o={}){
    this.host=host;
    this.o=Object.assign({interactive:true,flipped:false,static:false,label:'Chessboard'},o);
    this.cur=[6,4];this.cells=new Map();this.mouse=false;this._edgeAt=0;
    this.st={g:parseFEN(START_FEN).g,last:null,sel:null,targets:new Map(),check:null,paints:{},arrows:[],badge:null,hint:null,pal:undefined};
    ABoard.all.add(this);
    this.build();this.bind();this.paint();
    if(window.ResizeObserver){new ResizeObserver(()=>host.style.setProperty('--bwpx',host.clientWidth||700)).observe(host)}
  }
  get flipped(){return this.o.flipped}
  build(){
    const h=this.host,o=this.o;
    h.innerHTML='';h.classList.add('board');h.classList.toggle('static',!!o.static);
    if(o.static){h.setAttribute('role','img')}
    else{
      h.setAttribute('role','grid');h.setAttribute('aria-rowcount','8');h.setAttribute('aria-colcount','8');
      h.setAttribute('aria-label',`${o.label}. ${o.flipped?'Black':'White'} at the bottom. Arrow keys move between squares, Enter or Space selects a piece or plays a move, Escape cancels a selection, R reads the board.`);
    }
    this.cells.clear();
    for(let vr=0;vr<8;vr++){
      const row=document.createElement('div');
      if(!o.static){row.setAttribute('role','row');row.setAttribute('aria-rowindex',vr+1)}
      for(let vc=0;vc<8;vc++){
        const r=o.flipped?7-vr:vr,f=o.flipped?7-vc:vc;
        const c=document.createElement('div');
        c.className='sq '+((r+f)%2===0?'l':'d');c.dataset.r=r;c.dataset.f=f;
        if(!o.static){c.setAttribute('role','gridcell');c.setAttribute('aria-colindex',vc+1);c.tabIndex=-1}
        c.innerHTML='<span class="pcl" aria-hidden="true"></span><span class="mk" aria-hidden="true"></span>'+
          (vc===0?`<span class="rk" aria-hidden="true">${8-r}</span>`:'')+(vr===7?`<span class="fl" aria-hidden="true">${FILES[f]}</span>`:'');
        row.appendChild(c);this.cells.set(r*8+f,c);
      }
      h.appendChild(row);
    }
    this.rove();
  }
  bind(){
    const h=this.host;
    h.addEventListener('keydown',e=>this.key(e));
    h.addEventListener('mousedown',()=>{this.mouse=true;setTimeout(()=>{this.mouse=false},400)});
    h.addEventListener('click',e=>{
      if(Date.now()-(this._lastDrag||0)<250)return;
      const c=e.target.closest('.sq');if(!c||!this.o.interactive)return;
      const r=+c.dataset.r,f=+c.dataset.f;
      this.cur=[r,f];this.rove();
      this.o.onActivate&&this.o.onActivate(r,f,'mouse');
    });
    /* optional drag-and-drop: only active when "Click-to-move mode" is switched off; clicking always works */
    h.addEventListener('pointerdown',e=>{
      if(S.clickToMove||!this.o.interactive||(e.button!==undefined&&e.button>0)||!this.o.canDrag)return;
      const c=e.target.closest('.sq');if(!c)return;
      const r=+c.dataset.r,f=+c.dataset.f;
      if(!this.o.canDrag(r,f))return;
      this._drag={r,f,x:e.clientX,y:e.clientY,ghost:null,moved:false};
    });
    const move=e=>{
      const d=this._drag;if(!d)return;
      if(!d.ghost){
        if(Math.hypot(e.clientX-d.x,e.clientY-d.y)<8)return;
        const src=this.cells.get(d.r*8+d.f),g=document.createElement('div');
        g.className='drag-ghost';g.innerHTML=src.firstChild.innerHTML;
        const w=src.getBoundingClientRect().width;g.style.width=w+'px';g.style.height=w+'px';
        document.body.appendChild(g);d.ghost=g;src.classList.add('dragsrc');d.moved=true;
      }
      d.ghost.style.left=e.clientX+'px';d.ghost.style.top=e.clientY+'px';
    };
    const up=e=>{
      const d=this._drag;if(!d)return;this._drag=null;
      const src=this.cells.get(d.r*8+d.f);if(src)src.classList.remove('dragsrc');
      if(d.ghost){d.ghost.remove()}
      if(!d.moved)return;
      this._lastDrag=Date.now();
      const el=document.elementFromPoint(e.clientX,e.clientY),t=el&&el.closest&&el.closest('.sq');
      if(t&&this.host.contains(t)){
        const r=+t.dataset.r,f=+t.dataset.f;
        this.cur=[r,f];this.rove();
        if(this.o.onDrop)this.o.onDrop([d.r,d.f],[r,f]);
      }
    };
    document.addEventListener('pointermove',move);
    document.addEventListener('pointerup',up);
    document.addEventListener('pointercancel',up);
    h.addEventListener('focusin',e=>{
      const c=e.target.closest('.sq');if(!c)return;
      const r=+c.dataset.r,f=+c.dataset.f;
      this.cur=[r,f];this.rove();
      if(!this.mouse&&!this._internal&&this.o.onFocusSquare)this.o.onFocusSquare(r,f);
    });
  }
  rove(){
    if(this.o.static)return;
    const all=!S.keyboardNav;
    this.cells.forEach((c,k)=>{const on=all||(k===this.cur[0]*8+this.cur[1]);c.tabIndex=on?0:-1;c.classList.toggle('cur',k===this.cur[0]*8+this.cur[1])});
  }
  setCursor(r,f,focus){
    this.cur=[r,f];this.rove();
    if(focus){const c=this.cells.get(r*8+f);if(c){this._internal=true;try{c.focus()}finally{this._internal=false}}}
  }
  focusBoard(){this.setCursor(this.cur[0],this.cur[1],true)}
  key(e){
    if(e.altKey||e.ctrlKey||e.metaKey)return;
    const k=e.key,fl=this.o.flipped?-1:1;let[r,f]=this.cur,nr=r,nf=f,moved=false;
    if(S.keyboardNav){
      if(k==='ArrowUp'){nr=r-fl;moved=true}
      else if(k==='ArrowDown'){nr=r+fl;moved=true}
      else if(k==='ArrowLeft'){nf=f-fl;moved=true}
      else if(k==='ArrowRight'){nf=f+fl;moved=true}
      else if(k==='Home'){nf=this.o.flipped?7:0;moved=true}
      else if(k==='End'){nf=this.o.flipped?0:7;moved=true}
    }
    if(moved){
      e.preventDefault();
      if(!inb(nr,nf)){
        const now=Date.now();
        if(now-this._edgeAt>900){this._edgeAt=now;say('Edge of the board.',{kind:'focus',live:false,speak:false})}
        return;
      }
      this.setCursor(nr,nf,true);
      if(this.o.onFocusSquare)this.o.onFocusSquare(nr,nf);
      return;
    }
    if(k==='Enter'||(k===' '&&!S.spaceTalk)){e.preventDefault();this.o.onActivate&&this.o.onActivate(r,f,'keyboard');return}
    if(k==='Escape'){if(this.o.onCancel&&this.o.onCancel()){e.preventDefault()}return}
    if(this.o.onShortcut&&this.o.onShortcut(k,e)){e.preventDefault()}
  }
  set(patch){Object.assign(this.st,patch);this.paint()}
  setFlipped(v){this.o.flipped=!!v;this.build();this.paint()}
  labelFor(r,f){
    const s=this.st,p=s.g[r][f],n=sqn(r,f);
    let t=`${n}, ${p?pname(p):'empty'}`;
    if(s.check&&eqSq(s.check,[r,f]))t+=', king in check';
    if(s.sel&&eqSq(s.sel,[r,f]))t+=', selected';
    const tg=s.targets.get(n);if(tg)t+=tg.cap?', capture available':', legal move';
    if(s.last){if(eqSq(s.last[1],[r,f]))t+=', last move destination';else if(eqSq(s.last[0],[r,f]))t+=', last move origin'}
    if(s.badge&&s.badge.sq===n)t+=`, marked ${s.badge.text}`;
    if(s.hint===n)t+=', hint';
    return t;
  }
  paint(){
    const s=this.st,pal=s.pal!==undefined?s.pal:boardPal();
    const palKey=pal===PAL_GRASS?'g':pal===PAL_HC?'h':'c';
    const letters=s.pal===undefined&&S.pieceTheme==='letters';
    this.cells.forEach((c,k)=>{
      const r=k>>3,f=k&7,p=s.g[r][f],n=sqn(r,f);
      const pk=(p?p.c+p.t:'-')+palKey+(letters?'L':'');
      if(c._pk!==pk){c.firstChild.innerHTML=p?pieceSVG(p.t,p.c,pal)+(letters?`<span class="plt ${p.c}">${p.t.toUpperCase()}</span>`:''):'';c._pk=pk}
      const isSel=s.sel&&eqSq(s.sel,[r,f]),tg=s.targets.get(n),chk=s.check&&eqSq(s.check,[r,f]);
      const lmTo=s.last&&eqSq(s.last[1],[r,f]),lmFrom=s.last&&eqSq(s.last[0],[r,f]);
      c.classList.toggle('sel',!!isSel);
      c.classList.toggle('tgt',!!tg&&!tg.cap);
      c.classList.toggle('cap',!!tg&&!!tg.cap);
      c.classList.toggle('lmt',!!lmTo);c.classList.toggle('lmf',!!lmFrom);
      c.classList.toggle('chk',!!chk);
      c.classList.toggle('hnt',s.hint===n);
      const pt=s.paints[n];
      c.classList.toggle('pt',!!pt);
      c.style.setProperty('--pt',pt||'');
      let chip='';
      if(chk)chip='CHECK';else if(isSel)chip='SELECTED';else if(s.hint===n)chip='HINT';else if(lmTo)chip='to';else if(lmFrom)chip='from';
      c.querySelector('.mk').dataset.chip=chip;
      c.querySelector('.mk').dataset.chipS={SELECTED:'SEL',CHECK:'CHK'}[chip]||chip;   // short text for small boards
      c.querySelector('.mk').innerHTML=(s.badge&&s.badge.sq===n)?`<b class="bdg">${esc(s.badge.sym)}</b>`:'';
      if(!this.o.static){
        c.setAttribute('aria-label',this.labelFor(r,f));
        c.setAttribute('aria-selected',isSel?'true':'false');
      }
    });
    // arrows overlay
    let ov=this.host.querySelector(':scope>.arrows');
    if(!s.arrows.length){if(ov)ov.remove()}
    else{
      if(!ov){ov=document.createElement('div');ov.className='arrows';ov.setAttribute('aria-hidden','true');this.host.appendChild(ov)}
      ov.innerHTML=`<svg viewBox="0 0 800 800" preserveAspectRatio="none">`+s.arrows.map(a=>this.arrowPoly(a)).join('')+`</svg>`;
    }
    if(this.o.static){
      const st=this.o.staticLabel;
      this.host.setAttribute('aria-label',st||'Chess position preview');
    }
  }
  arrowPoly({from,to,color}){
    const q=100,fl=this.o.flipped,[r1,f1]=sqp(from),[r2,f2]=sqp(to);
    const vx=f=>(fl?7-f:f),vy=r=>(fl?7-r:r);
    const x1=(vx(f1)+.5)*q,y1=(vy(r1)+.5)*q,x2=(vx(f2)+.5)*q,y2=(vy(r2)+.5)*q;
    const dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,px=-uy,py=ux;
    const w=11,hw=24,hl=42,sx=x1+ux*28,sy=y1+uy*28,tx=x2+ux*10,ty=y2+uy*10,bx=tx-ux*hl,by=ty-uy*hl;
    const pts=[[sx+px*w,sy+py*w],[bx+px*w,by+py*w],[bx+px*hw,by+py*hw],[tx,ty],[bx-px*hw,by-py*hw],[bx-px*w,by-py*w],[sx-px*w,sy-py*w]];
    return `<polygon points="${pts.map(p=>p.join(',')).join(' ')}" fill="${color||'#e8825c'}" stroke="#000" stroke-width="3" opacity=".9"/>`;
  }
}
ABoard.all=new Set();
settingSubs.push(()=>{ABoard.all.forEach(b=>{if(!b.host.isConnected){ABoard.all.delete(b);return}b.rove();b.paint()})});

/* a small helper for non-interactive previews (cards on the home screen) */
function previewBoard(host,fen,label,pal){
  const b=new ABoard(host,{static:true,staticLabel:label,interactive:false});
  b.set({g:parseFEN(fen).g,pal});
  return b;
}
function fenSummary(fen){
  const s=parseFEN(fen);
  const parts=[];
  for(const c of['w','b']){
    const pcs=[];for(const t of ORDER)for(let f=0;f<8;f++)for(let r=7;r>=0;r--){const p=s.g[r][f];if(p&&p.c===c&&p.t===t)pcs.push(`${NAMES[t]} ${sqn(r,f)}`)}
    if(pcs.length)parts.push(`${cname(c)}: ${joinList(pcs)}`);
  }
  return parts.join('. ');
}

/* =====================================================================
   GameController — shared by Play, Puzzle and the Play-menu preview board
   ===================================================================== */
class GameController{
  constructor(o){
    Object.assign(this,{opponent:false,human:'w',puzzle:null,vi:null,sel:null,timer:null,lastError:null,hints:0,solved:false,
      thinking:false,drawOffers:0,onChange:()=>{},onEnd:()=>{},name:'play',label:'Chessboard',hintSq:null},o);
    this.board=new ABoard(this.host,{label:this.label,
      canDrag:(r,f)=>{const p=this.state.g[r][f];return !!p&&p.c===this.game.turn&&this.atLatest&&!this.game.status().over&&this.canMove()},
      onDrop:(from,to)=>this.drop(from,to),
      onActivate:(r,f,src)=>this.activate(r,f,src),
      onCancel:()=>this.cancel('keyboard'),
      onShortcut:(k,e)=>this.shortcut(k,e),
      onFocusSquare:(r,f)=>this.focusSq(r,f)});
    this.sync();
  }
  /* ----- derived state ----- */
  get latest(){return this.game.states.length-1}
  get idx(){return this.vi==null?this.latest:this.vi}
  get atLatest(){return this.idx===this.latest}
  get state(){return this.game.states[this.idx]}
  get verb(){return S.verbosity}
  get status(){return this.atLatest?this.game.status():{over:false,check:inCheck(this.state.g,this.state.turn)}}
  canMove(){return !this.opponent||this.game.turn===this.human}
  destroy(){clearTimeout(this.timer);ABoard.all.delete(this.board)}
  sync(){
    const s=this.state,i=this.idx;
    let last=null;if(i>0){const m=this.game.moves[i-1].m;last=[m.from,m.to]}
    else if(this.puzzle&&this.puzzle.preLast)last=this.puzzle.preLast;
    const targets=new Map();
    if(this.sel&&this.atLatest){for(const m of this.game.legal(this.sel[0],this.sel[1])){targets.set(sqn(...m.to),{cap:!!m.cap})}}
    const st=this.status;
    this.board.set({g:s.g,last,sel:this.atLatest?this.sel:null,targets,check:st.check?kingPos(s.g,s.turn):null,hint:this.hintSq});
    this.onChange(this);
  }
  /* ----- announcements ----- */
  focusSq(r,f){
    if(!S.screenReader)return;
    const s=this.state,p=s.g[r][f],n=sqn(r,f);
    let t;
    if(this.verb==='minimal')t=`${n}, ${p?pname(p):'empty'}`;
    else{
      t=describeSquare(s,n).replace(/\.$/,'');
      if(this.sel&&eqSq(this.sel,[r,f]))t+=', selected';
      const tg=this.board.st.targets.get(n);if(tg)t+=tg.cap?', capture available':', legal destination';
      if(this.verb==='detailed'&&p&&p.c===s.turn&&this.atLatest){const c=this.game.legal(r,f).length;t+=`. ${c} legal move${c===1?'':'s'}`}
    }
    say(t+'.',{kind:'focus'});
  }
  describe(n){const t=describeSquare(this.state,n);say(t,{kind:'cmd'});return t}
  readBoard(){const t=describeBoard(this.state,this.status);say((this.atLatest?'':`Position after move ${this.idx}. `)+t,{kind:'cmd'});return t}
  turn(){const t=turnText(this.state,this.status);say(t,{kind:'cmd'});return t}
  lastMove(){
    const i=this.idx;
    if(i===0){say('No moves have been played yet.',{kind:'cmd'});return null}
    const rec=this.game.moves[i-1],t=`Last move: move ${Math.ceil(i/2)}, ${moveWords(rec,this.verb==='minimal'?'standard':this.verb)}`;
    say(t+(rec.san.match(/[+#]/)?` (${rec.san})`:` (${rec.san})`),{kind:'cmd'});return t;
  }
  legalMoves(n){
    const name=n||(this.sel?sqn(...this.sel):null);
    if(!this.atLatest){say('Legal moves are only available in the latest position.',{kind:'alert',urgent:true});return}
    if(this.status.over){say('The game is over. There are no legal moves.',{kind:'cmd'});return}
    const t=legalText(this.state,name);say(t,{kind:'cmd'});return t;
  }
  /* ----- interaction ----- */
  guard(){
    if(!this.atLatest){this.error('You are viewing an earlier position. Go to the latest move to continue playing.');return false}
    const st=this.game.status();
    if(st.over){this.error(this.puzzle&&this.solved?'This puzzle is solved. Choose Try again to play it once more.':'The game is over. Start a new game to play again.');return false}
    if(!this.canMove()){this.error(this.thinking?'The opponent is thinking. Please wait for their move.':`It is ${cname(this.game.turn)}'s turn.`);return false}
    return true;
  }
  error(text){
    this.lastError=text;say(text,{kind:'alert',urgent:true});fx('invalid');
    const h=this.host;h.classList.remove('shake');void h.offsetWidth;if(!S.reduceMotion)h.classList.add('shake');
    this.onChange(this);
  }
  activate(r,f,src){
    const n=sqn(r,f),p=this.state.g[r][f];
    this.lastError=null;
    if(!this.atLatest||this.game.status().over||!this.canMove()){
      if(!p){this.describe(n);return}
      if(!this.guard())return;
    }
    if(this.sel){
      if(eqSq(this.sel,[r,f])){this.cancel(src);return}
      const hit=this.game.legal(this.sel[0],this.sel[1]).filter(m=>eqSq(m.to,[r,f]));
      if(hit.length){this.move(this.sel,[r,f],null,src);return}
      if(p&&p.c===this.game.turn){this.select(r,f);return}
      this.error(explainIllegal(this.game,this.sel,[r,f]));return;
    }
    if(p&&p.c===this.game.turn){this.select(r,f);return}
    if(p&&p.c!==this.game.turn&&this.canMove()){say(`That is a ${pname(p)}. Select one of your ${cname(this.game.turn).toLowerCase()} pieces first.`,{kind:'alert'});fx('invalid');return}
    this.describe(n);
  }
  drop(from,to){
    if(eqSq(from,to))return;
    if(!this.sel||!eqSq(this.sel,from)){if(!this.select(from[0],from[1]))return}
    this.activate(to[0],to[1],'drag');
  }
  select(r,f){
    if(!this.guard())return false;
    const p=this.state.g[r][f],n=sqn(r,f);
    if(!p||p.c!==this.game.turn){this.error(p?`That is a ${pname(p)}. It is ${cname(this.game.turn)}'s turn.`:`There is no piece on ${n}.`);return false}
    const mv=this.game.legal(r,f);
    if(!mv.length){this.error(`The ${pname(p)} on ${n} has no legal moves.`);return false}
    this.sel=[r,f];this.hintSq=null;fx('select');
    const dests=[...new Set(mv.map(m=>sqn(...m.to)))];
    let t;
    if(this.verb==='minimal')t=`${n} selected. ${dests.length} moves.`;
    else if(this.verb==='standard')t=`Selected ${pname(p)} on ${n}. ${dests.length} legal move${dests.length===1?'':'s'}.`;
    else t=`Selected ${pname(p)} on ${n}. Legal moves: ${joinList(dests)}.`;
    say(t,{kind:'game'});
    this.sync();return true;
  }
  cancel(src){
    if(!this.sel){if(src==='keyboard')return false;say('Nothing is selected. Use Undo last move to take back a completed move.',{kind:'cmd'});return false}
    const n=sqn(...this.sel);this.sel=null;
    say(`Selection cancelled. ${n} is no longer selected. No move was played.`,{kind:'game'});
    this.sync();return true;
  }
  move(from,to,promo,src){
    if(!this.guard())return false;
    const cands=this.game.legal(from[0],from[1]).filter(m=>eqSq(m.to,to));
    if(!cands.length){this.error(explainIllegal(this.game,from,to));return false}
    let m=cands[0];
    if(cands.length>1){
      if(promo){m=cands.find(x=>x.promo===promo)}
      else{this.askPromotion(from,to,src);return 'ask'}
    }
    const rec=this.game.play(m);
    this.sel=null;this.hintSq=null;this.lastError=null;this.vi=null;
    this.afterPlay(rec,'you');
    return true;
  }
  askPromotion(from,to,src){
    const opts=[['q','Queen'],['r','Rook'],['b','Bishop'],['n','Knight']];
    say('Promotion. Choose a piece: queen, rook, bishop or knight.',{kind:'game',urgent:true});
    openDialog({title:'Promote your pawn',alert:true,promo:true,
      body:'<p>Choose the piece the pawn becomes.</p>',
      actions:opts.map(([k,l],i)=>({label:l,primary:i===0,onClick:()=>{this.move(from,to,k,src)}})),
      cancelLabel:'Cancel move'});
  }
  afterPlay(rec,who){
    const st=this.game.status(),s=this.game.s;
    if(this.puzzle){this.afterPuzzle(rec,st);return}
    this.startClock&&this.startClock();
    let mw=moveWords(rec,this.verb);if(!/[.]$/.test(mw))mw+='.';
    let t=(who==='opp'?'Opponent moved. ':'Move completed. ')+mw;
    if(this.verb==='detailed'&&!st.over)t+=` ${cname(s.turn)} to move.`;
    let kind=who==='opp'?'opponent':'move',urgent=false;
    if(st.over){t+=' '+resultText(st);kind=st.result==='checkmate'?'mate':'move';urgent=true}
    else if(st.check){t+=` Check! ${cname(s.turn)} king is in check.`;kind='check';urgent=true}
    say(t,{kind:'game',urgent});fx(kind);
    this.sync();
    if(st.over){this.onEnd(st);return}
    this.scheduleOpponent();
  }
  scheduleOpponent(){
    if(!this.opponent||this.game.status().over||this.game.turn===this.human)return;
    this.thinking=true;this.onChange(this);
    this.timer=setTimeout(()=>this.opponentMove(),S.reduceMotion?250:900);
  }
  opponentMove(){
    this.thinking=false;
    if(this.game.status().over||this.game.turn===this.human)return;
    const m=opponentPick(this.game);if(!m)return;
    const rec=this.game.play(m);
    if(this.vi!=null&&this.vi===this.latest-1)this.vi=null;
    this.afterPlay(rec,'opp');
  }
  undo(){
    if(this.puzzle){this.resetPuzzle();return}
    if(!this.game.moves.length){say('There are no moves to undo.',{kind:'cmd'});return false}
    clearTimeout(this.timer);this.thinking=false;
    let n=1;const last=this.game.moves[this.game.moves.length-1];
    if(this.opponent&&last.c!==this.human&&this.game.moves.length>=2)n=2;
    else if(this.opponent&&last.c!==this.human)n=1;
    const undone=this.game.moves.slice(-n).map(r=>r.san);
    this.game.undo(n);this.sel=null;this.vi=null;this.lastError=null;
    say(`Undid ${n===1?'move':'moves'} ${undone.join(', ')}. ${turnText(this.game.s,this.game.status())} This takes back a completed move; it is different from cancelling a selection.`,{kind:'game'});
    fx('select');this.sync();
    if(this.opponent)this.scheduleOpponent();
    return true;
  }
  reset(){
    clearTimeout(this.timer);this.thinking=false;
    this.game.reset();this.sel=null;this.vi=null;this.lastError=null;this.drawOffers=0;this.hintSq=null;
    this.resetClock&&this.resetClock();
    say(this.name==='menu'?'Preview board reset. White to move.':'New game started. You are White. It is White\'s turn.',{kind:'game'});
    this.sync();
  }
  goto(i){
    i=Math.max(0,Math.min(this.latest,i));
    this.vi=i===this.latest?null:i;this.sel=null;this.sync();
    if(i===0)say('Viewing the starting position.',{kind:'game'});
    else{const rec=this.game.moves[i-1];say(`${i===this.latest?'Latest position. ':''}After move ${Math.ceil(i/2)}, ${moveWords(rec,'standard')}`,{kind:'game'})}
  }
  resign(){
    const st={result:'resigned',loser:this.human,winner:other(this.human)};
    this.game.ended=st;this.sel=null;clearTimeout(this.timer);this.thinking=false;
    say(resultText(st),{kind:'game',urgent:true});fx('mate');this.sync();this.onEnd(this.game.status());
  }
  offerDraw(){
    this.drawOffers++;
    say('Draw offered to the simulated opponent…',{kind:'game'});
    setTimeout(()=>{
      if(this.game.status().over)return;
      if(this.drawOffers>=2){
        this.game.ended={result:'draw-agreed'};clearTimeout(this.timer);this.thinking=false;
        say('Simulated opponent accepted the draw. '+resultText(this.game.status()),{kind:'game',urgent:true});
        fx('move');this.sync();this.onEnd(this.game.status());
      }else{
        say('Simulated opponent declined the draw offer. The game continues. (This is a scripted demonstration: the first offer is declined, a second offer is accepted.)',{kind:'game',urgent:true});
        fx('opponent');this.sync();
      }
    },S.reduceMotion?200:1100);
  }
  /* ----- puzzle ----- */
  afterPuzzle(rec,st){
    const P=this.puzzle,key=sqn(...rec.m.from)+sqn(...rec.m.to);
    const ok=st.result==='checkmate'||P.solution.includes(key);
    if(ok){
      this.solved=true;
      say(`Correct! ${rec.san} ${st.result==='checkmate'?'is checkmate. ':''}Puzzle solved.`,{kind:'game',urgent:true});
      fx('mate');this.sync();this.onEnd({result:'puzzle-solved'});
    }else{
      this.wrong=(this.wrong||0)+1;
      this.lastError=`${rec.san} is not the solution.`;
      say(`${rec.san} is not the solution. The move was taken back. Try again.`,{kind:'alert',urgent:true});
      fx('invalid');this.sync();
      this.timer=setTimeout(()=>{this.game.undo(1);this.vi=null;this.sync()},S.reduceMotion?200:800);
    }
  }
  resetPuzzle(){
    clearTimeout(this.timer);this.game.reset();this.solved=false;this.sel=null;this.vi=null;this.lastError=null;this.hints=0;this.hintSq=null;this.wrong=0;
    say('Puzzle reset. White to move. Find the winning move.',{kind:'game'});this.sync();
  }
  hint(){
    if(!this.puzzle)return;
    if(this.solved){say('This puzzle is already solved.',{kind:'cmd'});return}
    const H=this.puzzle.hints,i=Math.min(this.hints,H.length-1);this.hints++;
    if(i===0){this.hintSq=this.puzzle.hintSq}
    say(`Hint ${i+1} of ${H.length}: ${H[i]}`,{kind:'game'});
    fx('select');this.sync();
  }
  /* ----- keyboard shortcuts on the board ----- */
  shortcut(k){
    switch(k.toLowerCase()){
      case'r':this.readBoard();return true;
      case't':this.turn();return true;
      case'l':this.lastMove();return true;
      case'm':this.legalMoves(this.sel?null:sqn(...this.board.cur));return true;
      case'd':this.describe(sqn(...this.board.cur));return true;
      case'h':if(this.puzzle){this.hint();return true}return false;
      case'?':case'/':showKeyHelp();return true;
      case'pageup':this.goto(this.idx-1);return true;
      case'pagedown':this.goto(this.idx+1);return true;
    }
    return false;
  }
  /* ----- summary for the status panel ----- */
  summary(){
    const st=this.status,s=this.state;
    return {
      turn:turnText(s,st),over:st.over,check:!!st.check,
      selected:this.sel?`${sqn(...this.sel)} (${pname(this.state.g[this.sel[0]][this.sel[1]])})`:'None',
      legalCount:this.atLatest&&!st.over?legalMoves(this.game.s).length:0,
      last:this.idx>0?`${Math.ceil(this.idx/2)}${this.game.moves[this.idx-1].c==='w'?'.':'…'} ${this.game.moves[this.idx-1].san}`:'None yet',
      viewing:!this.atLatest?this.idx:null,error:this.lastError,thinking:this.thinking
    };
  }
}

/* =====================================================================
   ReviewController — step through a stored sample game (no engine)
   ===================================================================== */
class ReviewController{
  constructor(o){
    Object.assign(this,{i:o.data.start,onChange:()=>{}},o);
    this.game=new Chess();
    for(const[a,b]of this.data.moves){
      const m=this.game.legal(...sqp(a)).find(x=>sqn(...x.to)===b&&(!x.promo||x.promo==='q'));
      this.game.play(m);
    }
    this.n=this.game.moves.length;
    this.board=new ABoard(this.host,{label:'Game review board (read-only)',
      onActivate:(r,f)=>this.describe(sqn(r,f)),
      onShortcut:(k)=>this.shortcut(k),
      onFocusSquare:(r,f)=>{if(S.screenReader)say(describeSquare(this.game.states[this.i],sqn(r,f)),{kind:'focus'})}});
    this.sync();
  }
  note(i){return i>0?this.data.notes[i-1]:null}
  sync(){
    const s=this.game.states[this.i],rec=this.i>0?this.game.moves[this.i-1]:null,nt=this.note(this.i);
    const paints={},arrows=[];let badge=null;
    if(rec){paints[sqn(...rec.m.from)]=nt&&nt.tone?nt.tone[0]:'';paints[sqn(...rec.m.to)]=nt&&nt.tone?nt.tone[1]:'';
      if(!nt||!nt.tone){delete paints[sqn(...rec.m.from)];delete paints[sqn(...rec.m.to)]}
      if(nt&&nt.sym)badge={sq:sqn(...rec.m.to),sym:nt.sym,text:nt.cls.toLowerCase()}}
    if(nt&&nt.best){arrows.push({from:nt.best[0],to:nt.best[1],color:'#e8825c'});paints[nt.best[1]]='#c9a21d'}
    this.board.set({g:s.g,last:rec?[rec.m.from,rec.m.to]:null,check:inCheck(s.g,s.turn)?kingPos(s.g,s.turn):null,paints,arrows,badge});
    this.onChange(this);
  }
  visualText(i=this.i){
    const rec=i>0?this.game.moves[i-1]:null,nt=this.note(i),s=this.game.states[i],out=[];
    if(!rec)return 'No move highlighted. This is the starting position.';
    out.push(`Highlighted squares: ${sqn(...rec.m.from)} is where the piece started and ${sqn(...rec.m.to)} is where it landed.`);
    if(nt&&nt.sym)out.push(`A ${nt.cls.toLowerCase()} marker (${nt.sym}) sits on ${sqn(...rec.m.to)}.`);
    if(nt&&nt.best){
      const p=s.g[sqp(nt.best[0])[0]][sqp(nt.best[0])[1]];
      out.push(`An arrow points from ${nt.best[0]} to ${nt.best[1]}: the sample best continuation, ${p?pname(p):'a piece'} to ${nt.best[1]}${nt.bestSan?` (${nt.bestSan})`:''}.`);
    }
    return out.join(' ');
  }
  summaryText(){
    const i=this.i,rec=i>0?this.game.moves[i-1]:null,nt=this.note(i);
    if(!rec)return `Starting position. Move 0 of ${this.n}. ${turnText(this.game.states[0])}`;
    let t=`Move ${i} of ${this.n}. ${cname(rec.c)} played ${NAMES[rec.m.p]} from ${sqn(...rec.m.from)} to ${sqn(...rec.m.to)}${rec.m.cap?', capturing':''} (${rec.san}).`;
    if(nt)t+=` Sample review mark: ${nt.cls}. ${nt.text}`;
    return t;
  }
  go(i,announce=true){
    i=Math.max(0,Math.min(this.n,i));
    if(i===this.i&&announce){say(i===0?'This is the first position.':'This is the last position.',{kind:'cmd'});return}
    this.i=i;this.sync();
    if(announce)say(this.summaryText()+' '+this.visualText(),{kind:'game'});
  }
  describe(n){const t=describeSquare(this.game.states[this.i],n);say(t,{kind:'cmd'});return t}
  readBoard(){const t=`Position after move ${this.i}. `+describeBoard(this.game.states[this.i],gameStatus(this.game.states[this.i]));say(t,{kind:'cmd'});return t}
  turn(){const t=turnText(this.game.states[this.i],gameStatus(this.game.states[this.i]));say(t,{kind:'cmd'});return t}
  lastMove(){
    if(this.i===0){const t='No moves have been played yet in this position.';say(t,{kind:'cmd'});return t}
    const rec=this.game.moves[this.i-1],t=`Reviewed move: ${moveWords(rec,'standard')} (${rec.san})`;say(t,{kind:'cmd'});return t;
  }
  shortcut(k){
    switch(k.toLowerCase()){
      case'r':this.readBoard();return true;
      case't':this.turn();return true;
      case'l':this.lastMove();return true;
      case'd':this.describe(sqn(...this.board.cur));return true;
      case'v':say(this.visualText(),{kind:'cmd'});return true;
      case'pagedown':case'n':this.go(this.i+1);return true;
      case'pageup':case'p':this.go(this.i-1);return true;
      case'?':case'/':showKeyHelp();return true;
    }
    return false;
  }
  destroy(){ABoard.all.delete(this.board)}
}
