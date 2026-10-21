/* =====================================================================
   Session state shared across screens
   ===================================================================== */
const PUZZLES=[
  {title:'Back-rank checkmate',fen:'7k/6pp/8/8/8/8/8/5R1K w - - 0 1',solution:['f1f8'],hintSq:'f1',preLast:[[0,6],[0,7]],
   hints:['Look at your rook on f1. Which check could it deliver?',
          'The black king on h8 is boxed in by its own pawns on g7 and h7, so a check along the back rank would be checkmate.',
          'Move the rook from f1 to f8.'],
   intro:'White to move. Find the one-move checkmate.'},
  {title:'Another back-rank mate',fen:'6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1',solution:['a1a8'],hintSq:'a1',preLast:null,
   hints:['Look at your rook on a1 and the black king on g8.',
          'The black pawns on f7, g7 and h7 block every escape square, so a check on the back rank is mate.',
          'Move the rook from a1 to a8.'],
   intro:'White to move. Find the one-move checkmate.'}
];
const REVIEW={
  start:3,
  moves:[['f2','f3'],['e7','e5'],['g2','g4'],['d8','h4']],
  notes:[
    {cls:'Book',sym:'',text:'A known opening move (sample label written for this demonstration).'},
    {cls:'Book',sym:'',text:'A known reply (sample label).'},
    {cls:'Blunder',sym:'??',tone:['#b8693f','#f29a84'],best:['d8','h4'],bestSan:'Qh4#',
     text:'This move allows checkmate in one move. (Sample label written for this demonstration, not engine output.)'},
    {cls:'Great',sym:'!',text:'Queen to h4 delivers checkmate. (Sample label.)'}
  ],
  evals:[
    {v:.05,t:'roughly equal'},{v:.1,t:'roughly equal'},{v:.0,t:'roughly equal'},{v:-.85,t:'Black can force checkmate'},{v:-1,t:'checkmate for Black'}
  ]
};
const REV_ROWS=['Great','Book','Brilliant','Best','Excellent','Good','Inaccuracy','Mistake','Miss','Blunder'];
const REV_COL={Great:'#8db4da',Book:'#c4a07a',Brilliant:'#26c2a3',Best:'#81b64c',Excellent:'#81b64c',Good:'#a3c585',Inaccuracy:'#f7c631',Mistake:'#ffa459',Miss:'#ff8a7a',Blunder:'#ff8573'};
const G={
  tc:{label:'10 min',sec:600},
  play:{game:new Chess(),clock:{w:600,b:600,started:false}},
  menu:{game:new Chess()},
  puzzle:{idx:0,games:PUZZLES.map(p=>new Chess(p.fen)),solved:[false,false]},
  review:{started:false},
  recDismissed:false,prev:null,
  ui:{movesOpen:false}
};
function resetPlayClock(){G.play.clock={w:G.tc.sec||0,b:G.tc.sec||0,started:false,warn:{w:{},b:{}}}}
function paintStrip(sm,id){
  const el=$('#'+(id||'statusStrip'));if(!el)return;
  const state=sm.over?'over':sm.error?'error':sm.check?'check':sm.thinking?'wait':'';
  el.className='statusstrip'+(state?' ss-'+state:'');
  el.innerHTML=`<span class="ss-main"><span class="ss-ic" aria-hidden="true">${sm.over?'■':sm.error?'✖':sm.check?'⚠':sm.thinking?'◔':'●'}</span> ${esc(sm.turn)}${sm.thinking?' <em>Opponent is thinking…</em>':''}</span>`+
    `<span class="ss-sub">Last move: ${esc(sm.last)}${sm.selected&&sm.selected!=='None'?' · Selected: '+esc(sm.selected):''}</span>`+
    (sm.viewing!=null?`<span class="ss-warn">Viewing an earlier position (move ${sm.viewing}). Choose Latest position to keep playing.</span>`:'')+
    (sm.check&&!sm.over?'<span class="ss-bad">⚠ Check: the king is attacked and must be protected.</span>':'')+
    (sm.error&&!sm.over?`<span class="ss-bad">✖ ${esc(sm.error)} Pick another square or press Cancel selection.</span>`:'');
}
function syncBoardbar(c){
  $$('.js-cancel').forEach(b=>{b.disabled=!c.sel});
  $$('.js-undo').forEach(b=>{b.disabled=!c.game.moves.length});
}
const mmss=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
const ratingRow=(name,rating,side,bars,extra='')=>
  `${avatar(50)}<div class="pinfo"><span class="pn">${name}</span> <span class="pr">(${rating})</span> ${flagEl}${bars?barsEl(bars):''}<span class="who">${side}</span>${extra}</div>`;

/* =====================================================================
   SCREEN 1 — Home / Dashboard   (one next action, three grouped activities)
   ===================================================================== */
const REVIEW_END_FEN='rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3';
function homeResume(){
  const g=G.play.game,st=g.status(),n=g.moves.length;
  return {inProgress:n>0&&!st.over,over:st.over,n,turn:g.turn,clock:G.play.clock};
}
function homeRender(){
  const R=homeResume();
  const tcs=[['10 min',600],['5 min',300],['1 min',60],['3 days',null]];
  const solved=G.puzzle.solved.filter(Boolean).length;
  const heroSub=R.inProgress
    ?`Move ${Math.ceil(R.n/2)} · ${cname(R.turn)} to move${G.tc.sec!=null&&!S.untimed?` · ${mmss(R.clock[R.turn]||G.tc.sec)} left on that clock`:''}. Your game is saved until you close this tab.`
    :`A ${G.tc.label==='3 days'?'3 days per move':G.tc.label} game against a simulated opponent. You play White. Change the time control in the Play Chess card below.`;
  return `<div class="home">
    <header class="home-head">${avatar(44)}<div class="hh-t"><h1 tabindex="-1">Welcome back, Player1</h1>
      <p class="hh-s">Play with touch, mouse, keyboard or voice.</p></div>
      <div class="streak">${I.flame(30)}<span>0 day streak</span></div></header>

    <div id="welcomeSlot"></div>

    <section class="hero-card" aria-labelledby="hero-h">
      <div class="hero-tx"><p class="eyebrow">${R.inProgress?'Game in progress':'Next step'}</p>
        <h2 id="hero-h">${R.inProgress?'Continue your game':'Start playing'}</h2>
        <p class="hero-sub" id="heroSub">${esc(heroSub)}</p></div>
      <div class="hero-act">
        <button type="button" class="gbtn hero" id="playHero">${I.play(26)}<span>${R.inProgress?'Continue game':'Start playing'}</span></button>
        ${R.inProgress||R.over?'<button type="button" class="btn" id="newGame">Start a new game</button>':''}
      </div>
    </section>

    <section aria-labelledby="feat-h">
      <h2 id="feat-h" class="sec-title">Choose an activity</h2>
      <div class="cards3">
        <article class="card" aria-labelledby="c1-h"><div class="mini" id="hbPlay" role="img" aria-label="Chess starting position"></div>
          <div class="ctext"><h3 id="c1-h">Play Chess</h3><p>Choose a time control, then start a game.</p>
            <div class="tc" role="group" aria-label="Time control">${tcs.map(([l])=>`<button type="button" data-tc="${l}" aria-pressed="${G.tc.label===l}">${l}</button>`).join('')}</div></div>
          <button type="button" class="mbtn" data-go="menu">More ways to play</button></article>
        <article class="card" aria-labelledby="c2-h"><div class="mini" id="hbPuz" role="img" aria-label="Puzzle preview"></div>
          <div class="ctext"><h3 id="c2-h">Puzzles</h3><p>${solved} of ${PUZZLES.length} solved. One clear task at a time, with hints.</p></div>
          <button type="button" class="mbtn" data-go="puzzle">Solve puzzles</button></article>
        <article class="card" aria-labelledby="c3-h"><div class="mini" id="hbRev" role="img" aria-label="Game review preview"></div>
          <div class="ctext"><h3 id="c3-h">Game Review</h3><p>Step through a sample game with plain-language notes.</p></div>
          <button type="button" class="mbtn" data-go="review">Review sample game</button></article>
      </div>
    </section>

    <details class="more-info">
      <summary>More: sample game, daily puzzle and what is not available</summary>
      <div class="more-grid">
        <div class="rm"><div><h3>Sample game history</h3><p class="sub">Player1 vs RivalSample · 4 moves · review available</p>
          <button type="button" class="btn" data-go="review">Review game</button></div></div>
        <div class="rm"><div class="mini" id="hbDaily" role="img" aria-label="Daily puzzle preview"></div>
          <div><h3>Daily puzzle</h3><p class="sub">White to move and win.</p><button type="button" class="btn" data-go="puzzle">Solve daily puzzle</button></div></div>
        <div class="rm"><div><h3>Not available here</h3>
          <p class="sub">Online play, friends, bots, coach, lessons and tournaments need servers. This prototype is offline and uses a simulated opponent.</p></div></div>
      </div>
    </details>
  </div>`;
}
function homeMount(main,dispose){
  previewBoard($('#hbPlay'),START_FEN,'Chess starting position with all pieces.');
  previewBoard($('#hbPuz'),'6k1/6pp/8/8/8/8/8/5R1K w - - 0 1','Puzzle preview. '+fenSummary('6k1/6pp/8/8/8/8/8/5R1K'));
  previewBoard($('#hbRev'),REVIEW_END_FEN,'Game review preview: the final position of the sample game.');
  previewBoard($('#hbDaily'),'8/6q1/6b1/4p2k/P2R4/8/8/6K1 w - - 0 1','Daily puzzle preview. '+fenSummary('8/6q1/6b1/4p2k/P2R4/8/8/6K1'));
  main.addEventListener('click',e=>{
    const t=e.target.closest('[data-tc]');
    if(t){
      const l=t.dataset.tc;G.tc=l==='3 days'?{label:l,sec:null}:{label:l,sec:l==='5 min'?300:l==='1 min'?60:600};
      if(!G.play.game.moves.length)resetPlayClock();
      $$('[data-tc]',main).forEach(b=>b.setAttribute('aria-pressed',String(b===t)));
      const sub=$('#heroSub');if(sub&&!homeResume().inProgress)sub.textContent=`A ${l==='3 days'?'3 days per move':l} game against a simulated opponent. You play White. Change the time control in the Play Chess card below.`;
      say(`Time control set to ${l}.${homeResume().inProgress?' It applies to your next new game.':''}`,{kind:'info'});return;
    }
    if(e.target.closest('#playHero')){
      if(!G.play.game.moves.length)resetPlayClock();
      navigate('play');return;
    }
    if(e.target.closest('#newGame')){
      confirmAction({title:'Start a new game?',message:'Your current game and its move history will be cleared.',confirmLabel:'Start new game',always:homeResume().inProgress,
        onConfirm:()=>{G.play.game.reset();G.play.game.ended=null;resetPlayClock();say('New game ready. You are White.',{kind:'game'});navigate('play')}});
    }
  });
}

/* =====================================================================
   SCREEN 2 — Playing   (board first; status above, controls under, history beside)
   ===================================================================== */
function playRender(){
  return `<div class="lay">
    <section class="bcol" aria-label="Game board and players">
      <h1 class="sr-only" tabindex="-1">Playing a game against SpainSample</h1>
      <div class="statusstrip" id="statusStrip" role="group" aria-label="Game status"></div>
      <div class="prow">${ratingRow('SpainSample',194,'Black · simulated opponent',4)}
        <div class="clock" id="ckB" role="timer">—</div></div>
      <div class="bwrap"><div id="board"></div></div>
      <div class="prow">${ratingRow('Player1',217,'White · you',3)}
        <div class="clock" id="ckW" role="timer">—</div></div>
      ${boardbarHTML('play')}
      <p class="kbhint">Keyboard: <kbd>←↑↓→</kbd> move · <kbd>Enter</kbd> select / move · <kbd>Esc</kbd> cancel · <kbd>R</kbd> read board · <kbd>?</kbd> all keys</p>
    </section>
    <section class="gpanel pnl" aria-label="Game panel">
      <button type="button" class="gp-toggle m-only" id="gpToggle" aria-expanded="false" aria-controls="gpCollapse">
        <span>Move history and game info</span><span class="gp-count" id="gpCount"></span><span class="gp-chev" aria-hidden="true">${I.chev(18,'currentColor')}</span></button>
      <div class="gp-collapse" id="gpCollapse" data-open="false">
      <div class="subtabs" role="tablist" aria-label="Game information">
        <button type="button" role="tab" id="tabMoves" aria-selected="true" aria-controls="pMoves">Moves</button>
        <button type="button" role="tab" id="tabInfo" aria-selected="false" aria-controls="pInfo" tabindex="-1">Game info</button>
      </div>
      <div class="tabpanel" id="pMoves" role="tabpanel" aria-labelledby="tabMoves">
        <ol class="movelist" id="moves" aria-label="Move history"></ol>
      </div>
      <div class="tabpanel" id="pInfo" role="tabpanel" aria-labelledby="tabInfo" hidden>
        <dl class="info-dl pad" id="infoDl"></dl></div>
      </div>
      <div class="result" id="resultBar" hidden role="status"></div>
      <div class="gbottom">
        <div class="ctrls" role="group" aria-label="Move navigation: look back through the game">
          <button type="button" id="cFirst" aria-label="First position">${I.first()}</button>
          <button type="button" id="cPrev" aria-label="Previous move">${I.prev()}</button>
          <button type="button" id="cPlay" class="big" aria-label="Replay moves">${I.playbtn()}</button>
          <button type="button" id="cNext" aria-label="Next move">${I.next()}</button>
          <button type="button" id="cLast" aria-label="Latest position">${I.last()}</button>
        </div>
        <div class="gfoot" role="group" aria-label="Game actions">
          <button type="button" id="bDraw">½ Offer draw</button>
          <button type="button" id="bResign">${I.flag(20)}<span id="resignL">Abort</span></button>
          <button type="button" id="bFlip" class="flip" aria-label="Flip board">${I.flip()}<span class="blabel2">Flip</span></button>
        </div>
      </div>
    </section>
    ${dockHTML('play')}
  </div>`;
}
function playMount(main,dispose){
  const st=G.play,clk=st.clock;
  let ready=false,lowDemoUntil=0;
  const ctrl=new GameController({host:$('#board'),game:st.game,opponent:true,human:'w',name:'play',label:'Chessboard, game against SpainSample',
    startClock(){clk.started=true},
    resetClock(){resetPlayClock();G.play.clock;Object.assign(clk,G.play.clock)},
    onChange:c=>{if(ready)update(c)},onEnd:()=>{}});
  Ctx.kind='play';Ctx.ctrl=ctrl;
  dispose.push(()=>ctrl.destroy());
  function paintClocks(){
    const over=ctrl.game.status().over,run=ctrl.game.turn,timed=G.tc.sec!=null&&!S.untimed;
    for(const c of['w','b']){
      const el=$(c==='w'?'#ckW':'#ckB');
      if(!el)return;
      const txt=timed?mmss(clk[c]):(S.untimed?'No limit':'3 days');
      const active=timed&&!over&&clk.started&&run===c;
      const demo=c==='w'&&Date.now()<lowDemoUntil;
      const crit=timed&&S.lowTime&&!over&&clk[c]>0&&clk[c]<=Math.min(10,S.lowTimeAt);
      const low=demo||(timed&&S.lowTime&&!over&&clk[c]>0&&clk[c]<=S.lowTimeAt);
      el.innerHTML=(active?I.clock(22):'')+`<span>${txt}</span>`+(low?`<span class="lt-chip">⚠ ${crit&&!demo?'TIME!':'LOW TIME'}</span>`:'');
      el.classList.toggle('active',active);
      el.classList.toggle('low',low);el.classList.toggle('crit',crit&&!demo);
      el.setAttribute('aria-label',`${cname(c)} clock: ${timed?mmss(clk[c]):(S.untimed?'untimed play, no time limit':'3 days per move')}${active?', running':''}${low?', low time warning':''}`);
    }
  }
  function renderMoves(c){
    const mv=c.game.moves;let html='';
    for(let i=0;i<mv.length;i+=2){
      const cell=(r,ply)=>{
        if(!r)return '<span class="m empty"></span>';
        const L=r.san[0],fig=/[NBRQK]/.test(L);
        const label=`Move ${Math.ceil(ply/2)}, ${cname(r.c)}: ${moveWords(r,'standard').replace(/\.$/,'')}${/[+#]/.test(r.san)?(r.san.includes('#')?', checkmate':', check'):''}`;
        return `<button type="button" class="m${c.idx===ply?' cur':''}" data-ply="${ply}" aria-label="${esc(label)}" ${c.idx===ply?'aria-current="true"':''}>${fig?`<span class="fig" aria-hidden="true">${pieceSVG(L.toLowerCase(),r.c,boardPal())}</span>${esc(r.san.slice(1))}`:esc(r.san)}</button>`;
      };
      html+=`<li class="mrow"><span class="n">${i/2+1}.</span>${cell(mv[i],i+1)}${cell(mv[i+1],i+2)}</li>`;
    }
    if(!mv.length)html='<li class="empty-note">No moves yet. Select a white piece to begin.</li>';
    const movesEl=$('#moves');
    movesEl.innerHTML=html;
    const cur=movesEl.querySelector('.cur');
    if(cur){const t=cur.offsetTop-movesEl.clientHeight+cur.offsetHeight*2;movesEl.scrollTop=Math.max(0,t)}else movesEl.scrollTop=movesEl.scrollHeight;
  }
  function infoRows(){
    $('#infoDl').innerHTML=statusRowsHTML([
      ['Players','Player1 (217) · White — you<br>SpainSample (194) · Black — simulated opponent'],['Time control',esc(G.tc.label)+(S.untimed?' (untimed play is on)':'')],
      ['Rules','Built-in engine: legal moves, check, checkmate, castling, en passant, promotion, stalemate'],
      ['Opponent','Scripted replies (prefers mate, captures, checks). Not a chess engine and not a real player.']]);
  }
  function update(c){
    renderMoves(c);paintClocks();
    const sm=c.summary(),over=sm.over;
    $('#resignL').textContent=c.game.moves.length?'Resign':'Abort';
    $('#cFirst').disabled=$('#cPrev').disabled=c.idx===0;
    $('#cNext').disabled=$('#cLast').disabled=c.atLatest;
    $('#cPlay').disabled=c.atLatest;
    $('#bDraw').disabled=over||!c.game.moves.length;
    $('#bResign').disabled=over;
    syncBoardbar(c);paintStrip(sm);
    $('#gpCount').textContent=c.game.moves.length?`${c.game.moves.length} move${c.game.moves.length===1?'':'s'}`:'no moves yet';
    infoRows();
    const rb=$('#resultBar');
    if(over){rb.hidden=false;rb.innerHTML=`<b>${esc(resultText(c.game.status()))}</b> <button type="button" class="btn sm primary" id="bNew">New game</button>`}
    else rb.hidden=true;
    const ds=$('#dkStatus');
    if(ds)ds.innerHTML=statusRowsHTML([
      ['Turn',esc(sm.turn)+(sm.thinking?' <em>Opponent is thinking…</em>':'')],
      ['Selected',esc(sm.selected)],
      ['Last move',esc(sm.last)],
      ['Legal moves',over?'—':String(sm.legalCount)],
      ...(sm.viewing!=null?[['Viewing',`position after move ${sm.viewing}. Go to the latest to move.`,'warn']]:[]),
      ...(sm.check&&!over?[['Alert','⚠ Check: the king is attacked','bad']]:[]),
      ...(sm.error?[['Error','✖ '+esc(sm.error),'bad']]:[])
    ]);
  }
  ready=true;update(ctrl);
  {
    const gpt=$('#gpToggle'),gpc=$('#gpCollapse');
    const setOpen=o=>{G.ui.movesOpen=o;gpc.dataset.open=String(o);gpt.setAttribute('aria-expanded',String(o))};
    setOpen(G.ui.movesOpen);
    gpt.addEventListener('click',()=>setOpen(!G.ui.movesOpen));
  }
  settingSubs.push(()=>{if($('#ckW'))paintClocks()});
  const iv=setInterval(()=>{
    if(!clk.started||ctrl.game.status().over||G.tc.sec==null||S.untimed)return;
    const run=ctrl.game.turn;clk[run]=Math.max(0,clk[run]-1);paintClocks();
    lowTimeCheck(run);
    if(clk[run]===0){
      ctrl.game.ended={result:'timeout',loser:run,winner:other(run)};ctrl.sel=null;
      say(resultText(ctrl.game.status()),{kind:'game',urgent:true});fx('mate');ctrl.sync();
    }
  },1000);
  dispose.push(()=>clearInterval(iv));
  /* low-time warning: visual marker (paintClocks), announcement, alarm, vibration, final-seconds tick */
  function lowTimeCheck(side){
    if(!S.lowTime||G.tc.sec==null||S.untimed)return;
    const warn=(clk.warn=clk.warn||{w:{},b:{}})[side],t=clk[side],thr=S.lowTimeAt,mine=side===ctrl.human;
    if(t<=0)return;
    const once=(k,fn)=>{if(!warn[k]){warn[k]=1;fn()}};
    const words=n=>n>=120&&n%60===0?`${n/60} minutes`:n===60?'one minute':`${n} seconds`;
    if(t<=thr)once('low',()=>{
      if(mine){say(`Low time. ${words(t)} left on your clock.`,{kind:'alert',urgent:true});fx('lowtime')}
      else say(`The opponent is low on time: ${words(t)} left.`,{kind:'info'});
    });
    if(mine&&thr>30&&t<=30)once('half',()=>{say('30 seconds left on your clock.',{kind:'alert',urgent:true});fx('lowtime')});
    if(mine&&thr>10&&t<=10)once('crit',()=>{say('Ten seconds left.',{kind:'alert',urgent:true});fx('lowtime')});
    if(mine&&t<=Math.min(10,thr)&&S.sound)Sfx.play('tick');
  }
  const onDemo=()=>{lowDemoUntil=Date.now()+3500;paintClocks();setTimeout(paintClocks,3600)};
  document.addEventListener('acchess-lowtime-demo',onDemo);
  dispose.push(()=>document.removeEventListener('acchess-lowtime-demo',onDemo));
  let replay=null;
  const stopReplay=()=>{clearInterval(replay);replay=null;$('#cPlay')&&$('#cPlay').setAttribute('aria-label','Replay moves')};
  dispose.push(stopReplay);
  main.addEventListener('click',e=>{
    const m=e.target.closest('[data-ply]');if(m){stopReplay();ctrl.goto(+m.dataset.ply);return}
    const id=(e.target.closest('button')||{}).id;
    switch(id){
      case'cFirst':stopReplay();ctrl.goto(0);break;
      case'cPrev':stopReplay();ctrl.goto(ctrl.idx-1);break;
      case'cNext':stopReplay();ctrl.goto(ctrl.idx+1);break;
      case'cLast':stopReplay();ctrl.goto(ctrl.latest);break;
      case'cPlay':
        if(replay){stopReplay();break}
        if(ctrl.atLatest)ctrl.goto(0);
        $('#cPlay').setAttribute('aria-label','Stop replay');
        replay=setInterval(()=>{if(ctrl.atLatest){stopReplay();return}ctrl.goto(ctrl.idx+1)},S.reduceMotion?700:1000);break;
      case'bFlip':ctrl.board.setFlipped(!ctrl.board.flipped);say(`Board flipped. ${ctrl.board.flipped?'Black':'White'} is now at the bottom.`,{kind:'info'});break;
      case'bDraw':
        confirmAction({title:'Offer a draw?',message:'The draw offer goes to the simulated opponent (there is no real opponent connection).',confirmLabel:'Offer draw',onConfirm:()=>ctrl.offerDraw()});break;
      case'bResign':
        if(!ctrl.game.moves.length)confirmAction({title:'Abort this game?',message:'No moves have been played. Aborting starts a fresh game.',confirmLabel:'Abort game',onConfirm:()=>{ctrl.reset()}});
        else confirmAction({title:'Resign this game?',message:'Resigning ends the game and counts as a loss. This cannot be undone.',confirmLabel:'Resign',danger:true,always:true,onConfirm:()=>ctrl.resign()});
        break;
      case'bNew':confirmAction({title:'Start a new game?',message:'The finished game and its move history will be cleared.',confirmLabel:'New game',onConfirm:()=>ctrl.reset()});break;
    }
  });
  /* tabs: Moves | Game info */
  const TABS=['tabMoves','tabInfo'];
  function selectTab(id){
    for(const t of TABS){
      const b=$('#'+t),on=t===id;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;
      $('#'+b.getAttribute('aria-controls')).hidden=!on;
    }
  }
  $('.subtabs').addEventListener('click',e=>{const t=e.target.closest('[role=tab]');if(t)selectTab(t.id)});
  $('.subtabs').addEventListener('keydown',e=>{
    const tabs=$$('[role=tab]',$('.subtabs')),i=tabs.indexOf(document.activeElement);
    if(i<0)return;
    let n=null;if(e.key==='ArrowRight'||e.key==='ArrowLeft')n=(i+1)%tabs.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=tabs.length-1;
    if(n!=null){e.preventDefault();selectTab(tabs[n].id);tabs[n].focus()}
  });
  mountDock('play',dispose,()=>ctrl);
}

/* =====================================================================
   SCREEN 3 — Game Review   (position · timeline · explanation, all sample data)
   ===================================================================== */
function reviewRender(){
  return `<div class="lay lay-review">
    <section class="bcol" aria-label="Review board and players">
      <h1 class="sr-only" tabindex="-1">Game review: Player1 versus RivalSample</h1>
      <div class="statusstrip" id="rvStrip" role="group" aria-label="Reviewed position"></div>
      <div class="prow">${ratingRow('RivalSample',529,'Black',0)}</div>
      <div class="bwrap evwrap"><div class="evalbar" role="img" aria-label="Evaluation bar (sample data): Black has a forced checkmate in one"><span>M1</span></div><div id="board"></div></div>
      <div class="prow">${ratingRow('Player1',271,'White · you',0)}</div>
      <div class="boardbar" id="boardbar" role="group" aria-label="Move navigation">
        <button type="button" class="btn" id="rFirst" aria-label="First position">${I.first(18)}<span>First</span></button>
        <button type="button" class="btn" id="rPrev" aria-label="Previous move">${I.prev(18)}<span>Previous</span></button>
        <button type="button" class="btn primary" id="rNext" aria-label="Next move"><span>Next</span>${I.next(18)}</button>
        <button type="button" class="btn" id="rLast" aria-label="Last position"><span>Last</span>${I.last(18)}</button>
      </div>
      <p class="kbhint">Keyboard: <kbd>←↑↓→</kbd> move · <kbd>Page Up / Down</kbd> previous / next move · <kbd>V</kbd> describe highlights · <kbd>R</kbd> read board</p>
    </section>
    <section class="rpanel pnl" aria-label="Game review panel">
      <div class="rhead"><h2>Game review</h2><span class="tagS" title="Sample data">SAMPLE DATA</span></div>
      <p class="sample-note" role="note">Sample review: the labels, graph and commentary are pre-written for this demonstration. No chess engine is connected, so nothing here is a real analysis.</p>
      <div class="rkey"><span class="rpos" id="rPos"></span><button type="button" class="btn sm" id="rKey">${I.bulb(16)} Jump to key moment</button></div>
      <div class="rscroll">
        <section aria-labelledby="rt-h"><h3 id="rt-h">Move timeline</h3>
          <ol class="rmoves" id="rMoves" aria-label="Game moves"></ol></section>
        <section class="rexp" aria-labelledby="rx-h"><h3 id="rx-h">What is on the board</h3>
          <dl class="rexp-dl">
            <dt>This position</dt><dd id="rxPos"></dd>
            <dt>Sample commentary <span class="tagS">SAMPLE</span></dt><dd id="rBubble"></dd>
            <dt>Highlights and arrows</dt><dd id="rVisual"></dd>
            <dt>Evaluation <span class="tagS">SAMPLE</span></dt><dd id="rxEval"></dd>
          </dl></section>
        <section aria-labelledby="rg-h"><h3 id="rg-h">Evaluation graph <span class="tagS">SAMPLE</span></h3>
          <div class="graph" id="rGraph"></div>
          <details class="gdata"><summary>Evaluation graph as text</summary><ol id="rGraphTxt"></ol></details></section>
        <details class="gdata"><summary>Move-quality counts (sample labels)</summary>
          <table class="rstats"><caption class="sr-only">Move quality counts from the sample review</caption>
            <thead><tr><th scope="col">Type</th><th scope="col">Player1</th><th scope="col"><span class="sr-only">Symbol</span></th><th scope="col">RivalSample</th></tr></thead>
            <tbody id="rStats"></tbody></table></details>
      </div>
    </section>
    ${dockHTML('review')}
  </div>`;
}
function reviewMount(main,dispose){
  const n=REVIEW.moves.length;
  let ready=false;
  const ctrl=new ReviewController({host:$('#board'),data:REVIEW,onChange:c=>{if(ready)update(c)}});
  Ctx.kind='review';Ctx.ctrl=ctrl;dispose.push(()=>ctrl.destroy());
  const keyPly=Math.max(1,REVIEW.notes.findIndex(x=>x.cls==='Blunder')+1);
  const cnt={w:{},b:{}};
  REVIEW.notes.forEach((nt,i)=>{const c=i%2===0?'w':'b';cnt[c][nt.cls]=(cnt[c][nt.cls]||0)+1});
  $('#rStats').innerHTML=REV_ROWS.map(k=>`<tr><th scope="row">${k}</th><td style="color:${REV_COL[k]}">${cnt.w[k]||0}</td><td class="ic">${REV_ICONS[k]}</td><td style="color:${REV_COL[k]}">${cnt.b[k]||0}</td></tr>`).join('');
  $('#rKey').innerHTML=`${I.bulb(16)} Jump to key moment (move ${Math.ceil(keyPly/2)})`;
  const W=396,H=98,pts=REVIEW.evals.map((e,i)=>[i*(W/(REVIEW.evals.length-1)),H/2-e.v*(H/2-8)]);
  const area=`M0,${H} `+pts.map(p=>`L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')+` L${W},${H} Z`;
  const gmark=i=>`<line x1="${pts[i][0]}" x2="${pts[i][0]}" y1="0" y2="${H}" stroke="currentColor" stroke-width="2" stroke-dasharray="4 3"/><circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="5" fill="#ffd166" stroke="#000" stroke-width="2"/>`;
  $('#rGraphTxt').innerHTML=REVIEW.evals.map((e,i)=>`<li>${i===0?'Start':`After move ${Math.ceil(i/2)} (${cname(i%2?'w':'b')}) ${ctrl.game.moves[i-1].san}`}: ${e.t}.</li>`).join('');
  function update(c){
    const i=c.i;
    $('#rPos').textContent=`Move ${i} of ${n}`;
    const nt=c.note(i),rec=i?c.game.moves[i-1]:null;
    {const rs=$('#rvStrip');if(rs)rs.innerHTML=`<span class="ss-main">${i?`Move ${i} of ${n} · ${esc(cname(rec.c))} played ${esc(rec.san)}`:`Starting position · move 0 of ${n}`}</span><span class="ss-sub">${nt?`Sample mark: ${esc(nt.cls)}${nt.sym?' ('+esc(nt.sym)+')':''} — demonstration data`:'Sample review — not engine analysis'}</span>`}
    $('#rFirst').disabled=$('#rPrev').disabled=i===0;
    $('#rNext').disabled=$('#rLast').disabled=i===n;
    $('#rxPos').textContent=c.summaryText().replace(/ Sample review mark:.*$/,'')+(i===n?' '+resultText(c.game.status()):'');
    $('#rBubble').textContent=i===0?'Getting mated out of the opening happens to everyone. With some opening review, we can make sure it doesn’t happen again!':(nt?nt.text:'');
    $('#rVisual').textContent=c.visualText();
    $('#rxEval').textContent=`${REVIEW.evals[i].t} (sample label, not engine output).`;
    $('#rGraph').innerHTML=`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Evaluation graph (illustrative sample, not engine output): ${esc(REVIEW.evals.map((e,k)=>(k?`after move ${k}`:'start')+' '+e.t).join('; '))}. Currently showing ${i===0?'the start':'after move '+i}.">
      <rect width="${W}" height="${H}" fill="#403d39"/><path d="${area}" fill="#fff"/>
      <line x1="0" x2="${W}" y1="${H/2}" y2="${H/2}" stroke="#8b8987" stroke-width="1.5"/><g style="color:#ffd166">${gmark(i)}</g></svg>`;
    $('#rMoves').innerHTML=`<li><button type="button" data-rply="0" ${i===0?'aria-current="true"':''} class="${i===0?'cur':''}"><span class="mn">0</span> <b>Start</b></button></li>`+
      c.game.moves.map((r,k)=>{
      const nn=REVIEW.notes[k];
      return `<li><button type="button" data-rply="${k+1}" ${c.i===k+1?'aria-current="true"':''} class="${c.i===k+1?'cur':''}">
        <span class="mn">${Math.ceil((k+1)/2)}${r.c==='w'?'.':'…'}</span> <b>${esc(r.san)}</b>
        <span class="mk2" style="color:${REV_COL[nn.cls]}">${nn.sym||''} ${esc(nn.cls)}</span></button></li>`}).join('');
  }
  ready=true;update(ctrl);
  main.addEventListener('click',e=>{
    const m=e.target.closest('[data-rply]');if(m){ctrl.go(+m.dataset.rply);return}
    const id=(e.target.closest('button')||{}).id;
    if(id==='rFirst')ctrl.go(0);else if(id==='rPrev')ctrl.go(ctrl.i-1);else if(id==='rNext')ctrl.go(ctrl.i+1);else if(id==='rLast')ctrl.go(n);
    else if(id==='rKey')ctrl.go(keyPly);
  });
  mountDock('review',dispose,()=>ctrl);
}

/* =====================================================================
   SCREEN 4 — Puzzle   (objective · board · Hint / Try again / Next · feedback)
   ===================================================================== */
function puzzleRender(){
  return `<div class="lay lay-puzzle">
    <section class="bcol" aria-label="Puzzle board">
      <h1 class="sr-only" tabindex="-1">Puzzles</h1>
      <div class="pobj" id="pObj" role="group" aria-label="Puzzle objective"></div>
      <div class="bwrap"><div id="board"></div></div>
      ${boardbarHTML('puzzle')}
      <p class="kbhint">Keyboard: <kbd>←↑↓→</kbd> move · <kbd>Enter</kbd> select / move · <kbd>H</kbd> hint · <kbd>R</kbd> read the puzzle · <kbd>?</kbd> all keys</p>
    </section>
    <section class="ppanel pnl" aria-label="Puzzle feedback and progress">
      <div class="phead">${I.puzzle(34,String(G.puzzle.idx+1))}<h2>Puzzles</h2><span class="tagS" title="Built-in demonstration puzzles">DEMO PUZZLES</span></div>
      <div class="pbody">
        <div class="pfb" id="pFb"><i class="pfb-i" id="pchk" aria-hidden="true"></i>
          <div><b id="ptt">Your move</b><p id="ptx"></p></div></div>
        <div class="phints" id="pHints" hidden><h3>Hints used</h3><ol id="pHintList"></ol></div>
        <h3 class="sec-title" id="pl-h">Progress</h3>
        <div class="pbar"><div class="bar" role="progressbar" aria-labelledby="pl-h" aria-valuetext="0 of ${PUZZLES.length} solved" aria-valuemin="0" aria-valuemax="${PUZZLES.length}" aria-valuenow="0" id="pbar"><i id="pfill"></i></div>
          <span class="pcount" id="pscore"></span></div>
        <ul class="plist" id="pList" aria-label="Choose a puzzle"></ul>
        <details class="gdata"><summary>About these puzzles</summary>
          <p>${PUZZLES.length} built-in demonstration puzzles with stored solutions. Every move is checked by the prototype’s rules engine; a move counts as correct only if it matches the stored solution or checkmates. There is no puzzle database or rating system.</p></details>
      </div>
    </section>
    ${dockHTML('puzzle')}
  </div>`;
}
function puzzleMount(main,dispose){
  const PS=G.puzzle;
  let ctrl=null;
  function load(){
    if(ctrl){ctrl.destroy()}
    const P=PUZZLES[PS.idx];
    ctrl=new GameController({host:$('#board'),game:PS.games[PS.idx],puzzle:P,name:'puzzle',label:`Puzzle ${PS.idx+1} board`,
      onChange:update,onEnd:r=>{if(r.result==='puzzle-solved'){PS.solved[PS.idx]=true;update(ctrl)}}});
    ctrl.solved=PS.solved[PS.idx];
    Ctx.kind='puzzle';Ctx.ctrl=ctrl;
    update(ctrl);
  }
  function update(c){
    const P=PUZZLES[PS.idx],solved=PS.solved[PS.idx];
    c.solved=solved;
    const done=PS.solved.filter(Boolean).length,used=Math.min(c.hints||0,P.hints.length);
    $('#pscore').textContent=`${done} of ${PUZZLES.length} solved`;
    $('#pfill').style.width=(done/PUZZLES.length*100)+'%';
    $('#pbar').setAttribute('aria-valuenow',String(done));$('#pbar').setAttribute('aria-valuetext',`${done} of ${PUZZLES.length} solved`);
    const chk=$('#pchk'),fb=$('#pFb');
    let tone='',title,text;
    if(solved){tone='ok';title='Solved';text=`${P.title}: well done. ${c.game.moves.length?c.game.moves[c.game.moves.length-1].san+' is checkmate.':''} Choose Next puzzle when you are ready.`}
    else if(c.lastError){tone='bad';title='Not the move';text=`${c.lastError} Your move was taken back and the position is as it was. Try again, or use Hint.`}
    else{title='Your move';text=used?`Hint ${used}: ${P.hints[used-1]}`:'Find the winning move. AcChess checks your move as soon as you make it.'}
    chk.className='pfb-i '+tone;chk.textContent=tone==='ok'?'✔':tone==='bad'?'✖':'●';
    fb.className='pfb '+tone;$('#ptt').textContent=title;$('#ptx').textContent=text;
    {const hs=$('#pHints');hs.hidden=!used;$('#pHintList').innerHTML=P.hints.slice(0,used).map(h=>`<li>${esc(h)}</li>`).join('')}
    {const po=$('#pObj');
      po.className='pobj '+tone;
      po.innerHTML=`<span class="po-n">Puzzle ${PS.idx+1} of ${PUZZLES.length} · ${esc(P.title)}</span><b>${solved?'✔ Solved':'White to move'}</b><span>${esc(P.intro)}</span>`}
    $$('.js-hint').forEach(b=>{b.disabled=solved;b.innerHTML=`${I.bulb(18)} Hint <span class="cnt">${used}/${P.hints.length}</span>`});
    $$('.js-retry').forEach(b=>{b.disabled=!solved&&!c.game.moves.length&&!c.hints&&!c.lastError});
    $$('.js-next').forEach(b=>b.classList.toggle('primary',solved));
    $('#pList').innerHTML=PUZZLES.map((p,k)=>`<li><button type="button" class="plink${k===PS.idx?' cur':''}" data-pz="${k}" ${k===PS.idx?'aria-current="true"':''}><span>Puzzle ${k+1}: ${esc(p.title)}</span><span class="pst">${PS.solved[k]?'✔ Solved':'Not solved'}</span></button></li>`).join('');
    const ds=$('#dkStatus'),sm=c.summary();
    if(ds)ds.innerHTML=statusRowsHTML([
      ['Puzzle',`${PS.idx+1} of ${PUZZLES.length}: ${esc(P.title)}`],['Task',esc(P.intro)],['Selected',esc(sm.selected)],
      ['Result',solved?'✔ Solved':'Not solved yet',solved?'ok':''],['Hints used',String(c.hints||0)],
      ...(c.lastError&&!solved?[['Error','✖ '+esc(c.lastError),'bad']]:[])
    ]);
    syncBoardbar(c);
  }
  load();
  $$('.js-hint').forEach(b=>b.addEventListener('click',()=>ctrl.hint()));
  $$('.js-retry').forEach(b=>b.addEventListener('click',()=>{PS.solved[PS.idx]=false;ctrl.solved=false;ctrl.resetPuzzle()}));
  const go=d=>{PS.idx=(PS.idx+d+PUZZLES.length)%PUZZLES.length;load();say(`Puzzle ${PS.idx+1} of ${PUZZLES.length}: ${PUZZLES[PS.idx].title}. ${PUZZLES[PS.idx].intro}`,{kind:'game'})};
  $$('.js-next').forEach(b=>b.addEventListener('click',()=>go(1)));
  main.addEventListener('click',e=>{
    const z=e.target.closest('[data-pz]');
    if(z&&+z.dataset.pz!==PS.idx){go(+z.dataset.pz-PS.idx);const f=$('#pList [aria-current]');f&&f.focus()}
  });
  mountDock('puzzle',dispose,()=>ctrl);
  dispose.push(()=>ctrl&&ctrl.destroy());
}

/* =====================================================================
   SCREEN 5 — Play menu   (grouped, honest about what is not available)
   ===================================================================== */
function menuRender(){
  const R=homeResume();
  const item=(icon,title,desc,attr)=>`<li><button type="button" class="mitem" ${attr}><span class="ico" aria-hidden="true">${icon}</span><span class="mtx"><b>${title}</b><span>${desc}</span></span></button></li>`;
  const na=(title,why)=>`<li><button type="button" class="mna" data-na="${esc(title)}" data-why="${esc(why)}"><b>${esc(title)}</b><span>Not available in this prototype</span></button></li>`;
  return `<div class="lay lay-menu">
    <section class="mpanel pnl" aria-labelledby="mh">
      <div class="mhead"><button type="button" class="btn" id="mBack" aria-label="Back to the previous screen">${I.back(18)}<span>Back</span></button><h1 id="mh" tabindex="-1">Play menu</h1></div>
      <div class="mlist" id="mlist">
        <section aria-labelledby="g1"><h2 class="grp" id="g1">Playing options</h2>
          <ul class="mgroup">
            ${item(I.play(44),R.inProgress?'Continue game':'Play against the simulated opponent',R.inProgress?`Move ${Math.ceil(R.n/2)} · ${cname(R.turn)} to move`:'Offline game with the built-in rules engine. You play White.','data-go="play"')}
          </ul></section>
        <section aria-labelledby="g2"><h2 class="grp" id="g2">Learning and practice</h2>
          <ul class="mgroup">
            ${item(I.puzzle(44,'?'),'Puzzles','Solve one-move checkmates, with hints. Opens the Puzzle screen.','data-go="puzzle"')}
            ${item(I.hand(44),'Practice board','Try moves freely on the board next to this list. Nothing is saved.','data-practice')}
          </ul></section>
        <section aria-labelledby="g3"><h2 class="grp" id="g3">Game Review</h2>
          <ul class="mgroup">${item(I.reviewic(44),'Review the sample game','Step through four moves with plain-language notes (sample data).','data-go="review"')}</ul></section>
        <section aria-labelledby="g4"><h2 class="grp" id="g4">Accessibility</h2>
          <ul class="mgroup">
            ${item(I.access(44),'Accessibility settings','Vision, nonvisual access, input and motor, audio and haptics.','data-open-a11y')}
            ${item(I.mic(44),'Voice Controls','Speak or type one command at a time. The microphone never starts by itself.','data-open-voice')}
            ${item(I.kbd(44),'Help, keyboard shortcuts and voice commands','A short list you can open any time.','data-help')}
          </ul></section>
        <details class="na-list"><summary>Not available in this prototype</summary>
          <p class="small muted">These need online services or content that an offline prototype does not have. They are listed so the structure stays familiar; none of them works.</p>
          <ul class="na-grid">
            ${na('Play Online','Playing real people needs a multiplayer server.')}${na('Play Bots','Only one scripted, simulated opponent is included.')}
            ${na('Play Coach','There is no coaching engine.')}${na('Play a Friend','Inviting a friend needs an online connection.')}
            ${na('Tournaments','Tournaments need a live multiplayer connection.')}${na('Chess Variants','Only standard chess is implemented.')}${na('Lessons','Lessons are not part of this prototype.')}
          </ul></details>
      </div>
    </section>
    <section class="bcol" aria-label="Practice board">
      <div class="statusstrip" id="statusStrip" role="group" aria-label="Practice board status"></div>
      <p class="pb-title"><b>Practice board</b> · not connected to a game</p>
      <div class="bwrap"><div id="board"></div></div>
      ${boardbarHTML('menu')}
      <p class="kbhint">This board follows the real chess rules. Press <kbd>R</kbd> to read it.</p>
    </section>
  </div>`;
}
function menuMount(main,dispose){
  const ctrl=new GameController({host:$('#board'),game:G.menu.game,opponent:false,name:'menu',label:'Practice chessboard',
    onChange:c=>{syncBoardbar(c);paintStrip(c.summary())}});
  Ctx.kind='menu';Ctx.ctrl=ctrl;dispose.push(()=>ctrl.destroy());
  $('#mlist').addEventListener('keydown',e=>{
    if(e.key!=='ArrowDown'&&e.key!=='ArrowUp')return;
    const bs=$$('button,summary',$('#mlist')).filter(b=>b.offsetParent!==null),i=bs.indexOf(document.activeElement);if(i<0)return;
    e.preventDefault();bs[(i+(e.key==='ArrowDown'?1:-1)+bs.length)%bs.length].focus();
  });
  main.addEventListener('click',e=>{
    if(e.target.closest('#mBack')){goBack();return}
    if(e.target.closest('[data-help]')){showHelp();return}
    if(e.target.closest('[data-practice]')){const f=$('#board .sq[tabindex="0"]')||$('#board .sq');if(f)f.focus();say('Practice board focused. Use the arrow keys and Enter.',{kind:'info'});return}
    const na=e.target.closest('[data-na]');
    if(na)infoDialog(na.dataset.na+' is not available',`<p>${esc(na.dataset.why)}</p><p class="dlg-hint">AcChess is an offline academic prototype. Use the simulated opponent on the Playing screen instead.</p>`,[{label:'Play the simulated opponent',primary:true,onClick:()=>navigate('play')}]);
  });
  mountBoardbar(()=>ctrl);
}

/* =====================================================================
   Router + boot
   ===================================================================== */
const SCREENS={
  home:{title:'Home',render:homeRender,mount:homeMount},
  play:{title:'Playing',render:playRender,mount:playMount},
  review:{title:'Game Review',render:reviewRender,mount:reviewMount},
  puzzle:{title:'Puzzles',render:puzzleRender,mount:puzzleMount},
  menu:{title:'Play menu',render:menuRender,mount:menuMount}
};
const Dispose=[];
let CURRENT=null;
function goBack(){const p=G.prev&&G.prev!=='menu'&&SCREENS[G.prev]?G.prev:'home';navigate(p)}
function navigate(id){
  if(location.hash==='#'+id)route(true);else location.hash=id;
}
function route(userNav){
  const id=(location.hash||'#home').slice(1);
  if(userNav&&!SCREENS[id])return;
  const sc=SCREENS[id]?id:'home';
  Dispose.splice(0).forEach(f=>{try{f()}catch(e){console.error(e)}});
  stopSpeaking();
  Ctx.kind=null;Ctx.ctrl=null;if(CURRENT&&CURRENT!==sc)G.prev=CURRENT;CURRENT=sc;
  if(Dlg.isOpen())Dlg.close();
  $('#sidebarHost').innerHTML=sidebarHTML(sc);bindSidebar();
  const oldMain=$('#main'),main=oldMain.cloneNode(false); // fresh element: drops listeners from the previous screen
  oldMain.replaceWith(main);
  main.innerHTML=SCREENS[sc].render();
  main.dataset.screen=sc;
  document.body.dataset.screen=sc;
  SCREENS[sc].mount(main,Dispose);
  mountWelcome(main);
  $$('#screens a,#bottomnav a').forEach(a=>{if(a.dataset.s===sc)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  document.title=`${SCREENS[sc].title} — AcChess (academic prototype)`;
  window.scrollTo(0,0);
  if(userNav){
    const h=$('h1',main);if(h)h.focus({preventScroll:true});
    say(`${SCREENS[sc].title} screen.`,{kind:'info',speak:false});
  }
}
/* global click delegation for shared controls */
document.addEventListener('click',e=>{
  const g=e.target.closest('[data-go]');
  if(g){e.preventDefault();navigate(g.dataset.go);return}
  if(e.target.closest('[data-open-a11y]')){openA11y();return}
  if(e.target.closest('[data-back]')){goBack();return}
  const a=e.target.closest('[data-act]');
  if(a){
    const act=a.dataset.act;
    if(act==='players'){infoDialog('Players','<p>No real players are online. AcChess is an offline academic prototype with a simulated opponent.</p>');return}
    if(act==='friend'){infoDialog('Play a Friend','<p>Inviting a friend needs a real multiplayer connection, which this prototype does not have. Use “Play Online” or “Play Bots” to try the simulated opponent.</p>',[{label:'Play against the simulated opponent',primary:true,onClick:()=>navigate('play')}]);return}
    sidebarAction(act);return;
  }
  if(e.target.closest('[data-open-voice]')){openVoice(e.target.closest('[data-open-voice]'));return}
  const t=e.target.closest('[data-tg],[data-qa]');
  if(t){toggleToolbarSetting(t.dataset.tg||t.dataset.qa)}
});
window.addEventListener('hashchange',()=>route(true));
$('#skipLink').addEventListener('click',e=>{e.preventDefault();$('#main').focus()});
settingSubs.push((k)=>{
  if(k==='voice'||k==='*'){const p=Voice;p.notify()}
  if(k==='boardTheme'||k==='contrast'||k==='*'){}
});
function boot(){
  applySettings();
  bindA11y();bindVoicePanel();bindHeader();
  const pb=$('#protobar');
  const setPbh=()=>document.documentElement.style.setProperty('--pbh',pb.offsetHeight+'px');
  setPbh();window.addEventListener('resize',setPbh);
  if(window.ResizeObserver)new ResizeObserver(setPbh).observe(pb);
  route(false);
  if(!welcomeDismissed())say('Welcome to AcChess. Press Alt Shift A for Accessibility Settings, or Alt Shift V for Voice Controls. The same buttons are at the top of every screen. Press Tab to start.',{kind:'info',speak:false});
  if(!Store.persistent)say('Your browser blocks saving preferences, so settings last only until you close this tab.',{kind:'info',speak:false});
}
boot();
