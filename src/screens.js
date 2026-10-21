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
const REV_COL={Great:'#7fa6cc',Book:'#c4a07a',Brilliant:'#26c2a3',Best:'#81b64c',Excellent:'#81b64c',Good:'#a3c585',Inaccuracy:'#f7c631',Mistake:'#ffa459',Miss:'#ff8a7a',Blunder:'#ff6a55'};
const G={
  tc:{label:'10 min',sec:600},
  play:{game:new Chess(),clock:{w:600,b:600,started:false}},
  menu:{game:new Chess()},
  puzzle:{idx:0,games:PUZZLES.map(p=>new Chess(p.fen)),solved:[false,false]},
  review:{started:false},
  recDismissed:false,
  ui:{movesOpen:false}
};
function resetPlayClock(){G.play.clock={w:G.tc.sec||0,b:G.tc.sec||0,started:false,warn:{w:{},b:{}}}}
function paintStrip(sm,id){
  const el=$('#'+(id||'statusStrip'));if(!el)return;
  el.innerHTML=`<span class="ss-main">${esc(sm.turn)}${sm.thinking?' <em>Opponent is thinking…</em>':''}</span>`+
    `<span class="ss-sub">Last move: ${esc(sm.last)}${sm.selected&&sm.selected!=='None'?' · Selected: '+esc(sm.selected):''}</span>`+
    (sm.viewing!=null?`<span class="ss-warn">Viewing an earlier position (ply ${sm.viewing}) — go to the latest to move</span>`:'')+
    (sm.check&&!sm.over?'<span class="ss-bad">✖ Check — the king is attacked</span>':'')+
    (sm.error&&!sm.over?`<span class="ss-bad">✖ ${esc(sm.error)}</span>`:'');
}
function syncBoardbar(c){
  $$('.js-cancel').forEach(b=>{b.disabled=!c.sel});
  $$('.js-undo').forEach(b=>{b.disabled=!c.game.moves.length});
}
const mmss=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
const ratingRow=(name,rating,side,bars,extra='')=>
  `${avatar(50)}<div class="pinfo"><span class="pn">${name}</span> <span class="pr">(${rating})</span> ${flagEl}${bars?barsEl(bars):''}<span class="who">${side}</span>${extra}</div>`;

/* =====================================================================
   SCREEN 1 — Home / Dashboard
   ===================================================================== */
function homeRender(){
  const qa=(k,icon,label)=>`<button type="button" class="tg" data-qa="${k}" aria-pressed="${settingOn(k)}"><span class="tgi">${icon}</span><span>${label}</span><span class="st">${settingOn(k)?I.check(12)+' On':'Off'}</span></button>`;
  const tcs=[['10 min',600],['5 min',300],['1 min',60],['3 days',null]];
  return `<div class="home">
    <header class="home-head">${avatar(44)}<h1 tabindex="-1">Player1</h1>${flagEl}
      <div class="streak">${I.flame(40)}<span>0 Day Streak</span></div></header>

    <section class="qa" aria-labelledby="qa-h">
      <h2 id="qa-h">${I.access(20)} Accessibility quick access</h2>
      <div class="qa-row">
        <button type="button" class="btn primary" data-open-a11y>${I.gear(18,'currentColor')} Accessibility Settings</button>
        <button type="button" class="btn primary" data-open-voice>${I.mic(18)} Open Voice Controls</button>
        ${qa('screenReader',I.ear(18),'Screen reader')}${qa('contrast',I.contrast(18),'High contrast')}${qa('sound',I.sound(18),'Sound')}${qa('speech',I.speaker(18),'Speech')}
      </div>
    </section>

    <div class="home-grid">
      <section class="playpanel pnl" aria-labelledby="pp-h">
        <h2 id="pp-h">Play Chess</h2>
        <div class="tc" role="group" aria-label="Time control">${tcs.map(([l,s])=>`<button type="button" data-tc="${l}" aria-pressed="${G.tc.label===l}">${l}</button>`).join('')}</div>
        <button type="button" class="gbtn hero" id="playHero">Play Chess</button>
        <h3>More ways to play</h3>
        <ul class="more">
          <li><button type="button" class="mbtn" data-go="play">${I.play(30)}<span>Play Online</span></button></li>
          <li><button type="button" class="mbtn" data-go="play"><span class="coach-ic">${coachSVG(30,'coach')}</span><span>Play Coach</span></button></li>
          <li><button type="button" class="mbtn" data-go="menu">${I.hand(30)}<span>Play a Friend</span></button></li>
          <li><button type="button" class="mbtn" data-act="tournaments">${I.medal(30)}<span>Tournaments</span></button></li>
        </ul>
      </section>

      <section class="cards" aria-label="Practice and learn">
        <article class="card"><div class="mini" id="hb1"></div>
          <div class="ctext"><h3>Puzzles</h3><p>Play to solve · ${G.puzzle.solved.filter(Boolean).length} of ${PUZZLES.length} solved</p></div>
          <button type="button" class="mbtn" data-go="puzzle">Solve Puzzles</button></article>
        <article class="card"><div class="mini" id="hb2"></div>
          <div class="ctext"><h3>Lessons</h3><p>The King</p></div>
          <button type="button" class="mbtn" data-act="learn">Start lesson</button></article>
        <article class="card"><div class="mini grass" id="hb3"></div>
          <div class="ctext"><h3>Play Bots</h3><p>Martinfoot (250)</p></div>
          <button type="button" class="mbtn" data-go="play">Play Bots</button></article>
      </section>
    </div>

    <div class="home-lower">
      ${G.recDismissed?'':`<section class="sec" aria-labelledby="rm-h" id="recSec"><div class="sec-h"><h2 id="rm-h">Recommended Match</h2>
          <button type="button" class="btn icon" id="recX" aria-label="Dismiss recommended match">${I.close(16)}</button></div>
        <div class="rm"><div class="avbig">${I.pawn(60,'#8e8d8a')}</div>
          <div><p class="nm">SampleOpponent</p><p class="sub">Standard · Rated · 3 days</p><span class="tag">SIMILAR SKILL</span><br>
          <button type="button" class="gbtn" data-go="play" style="margin-top:10px">Challenge</button></div></div></section>`}
      <section class="sec" aria-labelledby="gh-h"><div class="sec-h"><h2 id="gh-h">Game History</h2></div>
        <div class="rm"><div><p class="nm">Player1 vs RivalSample</p><p class="sub">Sample game · 4 moves · review available</p>
          <button type="button" class="btn" data-go="review" style="margin-top:12px">Review game</button></div></div></section>
      <section class="sec" aria-labelledby="dp-h"><div class="sec-h"><h2 id="dp-h">Daily Puzzle</h2></div>
        <div class="rm"><div class="mini" id="hb4"></div>
          <div><p class="sub">White to move and win.</p>
          <button type="button" class="btn" data-go="puzzle" style="margin-top:12px">Solve daily puzzle</button></div></div></section>
    </div>
  </div>`;
}
function homeMount(main,dispose){
  previewBoard($('#hb1'),'6k1/6pp/8/8/8/8/8/5R1K w - - 0 1','Puzzle preview. '+fenSummary('6k1/6pp/8/8/8/8/8/5R1K'));
  previewBoard($('#hb2'),'8/8/8/8/8/8/8/4K3 w - - 0 1','Lesson preview: a single white king on e1.');
  const g=previewBoard($('#hb3'),START_FEN,'Bot preview: the starting position with all pieces.',PAL_GRASS);
  previewBoard($('#hb4'),'8/6q1/6b1/4p2k/P2R4/8/8/6K1 w - - 0 1','Daily puzzle preview. '+fenSummary('8/6q1/6b1/4p2k/P2R4/8/8/6K1'));
  main.addEventListener('click',e=>{
    const t=e.target.closest('[data-tc]');
    if(t){
      const l=t.dataset.tc;G.tc=l==='3 days'?{label:l,sec:null}:{label:l,sec:l==='5 min'?300:l==='1 min'?60:600};resetPlayClock();
      $$('[data-tc]',main).forEach(b=>b.setAttribute('aria-pressed',String(b===t)));
      say(`Time control set to ${l}.`,{kind:'info'});return;
    }
    if(e.target.closest('#playHero')){
      if(!G.play.game.moves.length)resetPlayClock();
      navigate('play');return;
    }
    if(e.target.closest('#recX')){
      G.recDismissed=true;$('#recSec').remove();say('Recommended match dismissed.',{kind:'info'});
      const h=$('#gh-h');h&&h.closest('section').querySelector('button').focus();return;
    }
  });
}

/* =====================================================================
   SCREEN 2 — Playing
   ===================================================================== */
function playRender(){
  return `${toolbarHTML()}
  <div class="lay">
    <section class="bcol" aria-label="Game board and players">
      <h1 class="sr-only" tabindex="-1">Playing a game against SpainSample</h1>
      <div class="statusstrip m-only" id="statusStrip"></div>
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
        <span>Moves and game info</span><span class="gp-count" id="gpCount"></span><span class="gp-chev" aria-hidden="true">${I.chev(18,'currentColor')}</span></button>
      <div class="gp-collapse" id="gpCollapse" data-open="false">
      <div class="gtabs" role="group" aria-label="Game sections">
        <button type="button" aria-current="true">${I.stopwatch()}<span>Play</span></button>
        <button type="button" data-go="menu">${I.plusbox()}<span>New Game</span></button>
        <button type="button" data-go="review">${I.checker()}<span>Games</span></button>
        <button type="button" data-act="players">${I.players()}<span>Players</span></button>
      </div>
      <div class="subtabs" role="tablist" aria-label="Game information">
        <button type="button" role="tab" id="tabMoves" aria-selected="true" aria-controls="pMoves">Moves</button>
        <button type="button" role="tab" id="tabChat" aria-selected="false" aria-controls="pChat" tabindex="-1">Chat</button>
        <button type="button" role="tab" id="tabInfo" aria-selected="false" aria-controls="pInfo" tabindex="-1">Info</button>
      </div>
      <div class="tabpanel" id="pMoves" role="tabpanel" aria-labelledby="tabMoves">
        <div class="movehead"><span>Starting Position</span><button type="button" class="ib" data-showinfo aria-label="Game information">${I.info(18)}</button></div>
        <ol class="movelist" id="moves" aria-label="Move history"></ol>
      </div>
      <div class="tabpanel" id="pChat" role="tabpanel" aria-labelledby="tabChat" hidden>
        <p class="pad">Chat is not connected. AcChess is an offline prototype with a simulated opponent, so there is no real person to chat with.</p></div>
      <div class="tabpanel" id="pInfo" role="tabpanel" aria-labelledby="tabInfo" hidden>
        <dl class="info-dl pad" id="infoDl"></dl></div>
      </div>
      <div class="result" id="resultBar" hidden role="status"></div>
      <p class="matchinfo"><b>Player1</b> (217) vs. <b>SpainSample</b> (194) <span id="tcLabel"></span><br>win +141 / draw -10 / lose -117</p>
      <div class="gbottom">
        <div class="ctrls" role="group" aria-label="Move history controls">
          <button type="button" id="cFirst" aria-label="First position">${I.first()}</button>
          <button type="button" id="cPrev" aria-label="Previous move">${I.prev()}</button>
          <button type="button" id="cPlay" class="big" aria-label="Replay moves">${I.playbtn()}</button>
          <button type="button" id="cNext" aria-label="Next move">${I.next()}</button>
          <button type="button" id="cLast" aria-label="Latest position">${I.last()}</button>
        </div>
        <div class="gfoot">
          <button type="button" id="bDraw">½ Draw</button>
          <button type="button" id="bResign">${I.flag(20)}<span id="resignL">Abort</span></button>
          <button type="button" id="bFlip" class="flip" aria-label="Flip board">${I.flip()}</button>
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
    const movesEl=$('#moves');
    movesEl.innerHTML=html;
    const cur=movesEl.querySelector('.cur');
    if(cur){const t=cur.offsetTop-movesEl.clientHeight+cur.offsetHeight*2;movesEl.scrollTop=Math.max(0,t)}else movesEl.scrollTop=movesEl.scrollHeight;
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
    $('#tcLabel').textContent=`(${G.tc.label})`;
    const rb=$('#resultBar');
    if(over){rb.hidden=false;rb.innerHTML=`<b>${esc(resultText(c.game.status()))}</b> <button type="button" class="btn sm primary" id="bNew">New game</button>`}
    else rb.hidden=true;
    $('#dkStatus').innerHTML=statusRowsHTML([
      ['Turn',esc(sm.turn)+(sm.thinking?' <em>Opponent is thinking…</em>':'')],
      ['Selected',esc(sm.selected)],
      ['Last move',esc(sm.last)],
      ['Legal moves',over?'—':String(sm.legalCount)],
      ...(sm.viewing!=null?[['Viewing',`position after ply ${sm.viewing} — go to the latest to move`,'warn']]:[]),
      ...(sm.check&&!over?[['Alert','✖ Check — king is attacked','bad']]:[]),
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
    if(e.target.closest('[data-showinfo]'))selectTab('tabInfo');
  });
  /* tabs */
  function selectTab(id){
    for(const t of['tabMoves','tabChat','tabInfo']){
      const b=$('#'+t),on=t===id;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;
      $('#'+b.getAttribute('aria-controls')).hidden=!on;
    }
    if(id==='tabInfo')$('#infoDl').innerHTML=statusRowsHTML([
      ['Event','Offline demonstration game'],['White','Player1 (217) — you'],['Black','SpainSample (194) — simulated opponent'],
      ['Time control',G.tc.label],['Rules','Built-in engine: legal moves, check, checkmate, castling, en passant, promotion, stalemate'],
      ['Opponent','Scripted replies (prefers mate, captures, checks). Not a chess engine and not a real player.']]);
  }
  $('.subtabs').addEventListener('click',e=>{const t=e.target.closest('[role=tab]');if(t)selectTab(t.id)});
  $('.subtabs').addEventListener('keydown',e=>{
    const tabs=$$('[role=tab]',$('.subtabs')),i=tabs.indexOf(document.activeElement);
    if(i<0)return;
    let n=null;if(e.key==='ArrowRight')n=(i+1)%3;else if(e.key==='ArrowLeft')n=(i+2)%3;
    if(n!=null){e.preventDefault();selectTab(tabs[n].id);tabs[n].focus()}
  });
  mountDock('play',dispose,()=>ctrl);
}

/* =====================================================================
   SCREEN 3 — Game Review
   ===================================================================== */
function reviewRender(){
  const n=REVIEW.moves.length;
  return `${toolbarHTML()}
  <div class="lay lay-review">
    <section class="bcol" aria-label="Review board and players">
      <h1 class="sr-only" tabindex="-1">Game review: Player1 versus RivalSample</h1>
      <div class="statusstrip m-only" id="rvStrip"></div>
      <div class="prow">${ratingRow('RivalSample',529,'Black',0)}<div class="clock white" aria-label="Black clock 30:00">${I.clock(22)}<span>30:00</span></div></div>
      <div class="bwrap evwrap"><div class="evalbar" role="img" aria-label="Evaluation bar (sample): Black has a forced checkmate in one"><span>M1</span></div><div id="board"></div></div>
      <div class="prow">${ratingRow('Player1',271,'White · you',0)}<div class="clock gray" aria-label="White clock 29:37"><span>29:37</span></div></div>
      <p class="kbhint">Keyboard: <kbd>←↑↓→</kbd> move · <kbd>Page Up / Page Down</kbd> previous / next move · <kbd>V</kbd> describe highlights · <kbd>R</kbd> read board</p>
    </section>
    <section class="rpanel pnl" aria-label="Game review panel">
      <div class="rhead">${I.reviewic(30)}<h2>Game Review</h2></div>
      <div class="rnav" role="group" aria-label="Review controls">
        <button type="button" id="rFirst" aria-label="First position">${I.first()}</button>
        <button type="button" id="rPrev" aria-label="Previous move">${I.prev()}</button>
        <span class="rpos" id="rPos" aria-hidden="true"></span>
        <button type="button" id="rNext" aria-label="Next move">${I.next()}</button>
        <button type="button" id="rLast" aria-label="Last position">${I.last()}</button>
      </div>
      <p class="sample-note" role="note">Sample review: the labels and graph below are pre-written for this demonstration. No chess engine is connected and nothing here is a real analysis.</p>
      <div class="rscroll">
        <div class="coachrow"><span class="coach-av">${coachSVG(96,'coach')}</span><div class="bubble" id="rBubble"></div></div>
        <div class="graph" id="rGraph"></div>
        <details class="gdata"><summary>Evaluation graph as text</summary><ol id="rGraphTxt"></ol></details>
        <p class="visual" id="rVisual"></p>
        <h3 class="sr-only">Moves</h3>
        <ol class="rmoves" id="rMoves" aria-label="Game moves"></ol>
        <div class="pl"><span></span><span class="nm">Player1</span><span></span><span class="nm">RivalSample</span>
          <span class="lab">Players</span><span class="box">${I.pawn(60,'#9a9996')}</span><span></span><span class="box g">${I.pawn(60,'#9a9996')}</span></div>
        <div class="pl acc-row"><span class="lab">Accuracy</span><span class="acc w" aria-label="Player1 accuracy not calculated"></span><span></span><span class="acc" aria-label="RivalSample accuracy 100.0 (sample)">100.0</span></div>
        <table class="rstats"><caption class="sr-only">Move quality counts from the sample review</caption>
          <thead><tr><th scope="col">Type</th><th scope="col">Player1</th><th scope="col"><span class="sr-only">Symbol</span></th><th scope="col">RivalSample</th></tr></thead>
          <tbody id="rStats"></tbody></table>
      </div>
      <div class="rfoot"><button type="button" class="gbtn" id="rStart">Start Review</button></div>
    </section>
    ${dockHTML('review')}
  </div>`;
}
function reviewMount(main,dispose){
  const n=REVIEW.moves.length;
  let ready=false;
  const ctrl=new ReviewController({host:$('#board'),data:REVIEW,onChange:c=>{if(ready)update(c)}});
  Ctx.kind='review';Ctx.ctrl=ctrl;dispose.push(()=>ctrl.destroy());
  // stats from the sample notes
  const cnt={w:{},b:{}};
  REVIEW.notes.forEach((nt,i)=>{const c=i%2===0?'w':'b';cnt[c][nt.cls]=(cnt[c][nt.cls]||0)+1});
  $('#rStats').innerHTML=REV_ROWS.map(k=>`<tr><th scope="row">${k}</th><td style="color:${REV_COL[k]}">${cnt.w[k]||0}</td><td class="ic">${REV_ICONS[k]}</td><td style="color:${REV_COL[k]}">${cnt.b[k]||0}</td></tr>`).join('');
  // graph
  const W=396,H=98,pts=REVIEW.evals.map((e,i)=>[i*(W/(REVIEW.evals.length-1)),H/2-e.v*(H/2-8)]);
  const area=`M0,${H} `+pts.map(p=>`L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')+` L${W},${H} Z`;
  const gmark=i=>`<line x1="${pts[i][0]}" x2="${pts[i][0]}" y1="0" y2="${H}" stroke="currentColor" stroke-width="2" stroke-dasharray="4 3"/><circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="5" fill="#ffd166" stroke="#000" stroke-width="2"/>`;
  $('#rGraphTxt').innerHTML=REVIEW.evals.map((e,i)=>`<li>${i===0?'Start':`After move ${Math.ceil(i/2)} (${cname(i%2?'w':'b')}) ${ctrl.game.moves[i-1].san}`}: ${e.t}.</li>`).join('');
  function update(c){
    const i=c.i;
    $('#rPos').textContent=`Move ${i} of ${n}`;
    {const rs=$('#rvStrip'),nn=c.note(i);if(rs)rs.innerHTML=`<span class="ss-main">Move ${i} of ${n}${i?` · ${esc(cname(c.game.moves[i-1].c))} ${esc(c.game.moves[i-1].san)}`:' · starting position'}</span><span class="ss-sub">${nn?`Sample mark: ${esc(nn.cls)}${nn.sym?' ('+esc(nn.sym)+')':''} — demonstration data`:'Sample review — not engine analysis'}</span>`}
    $('#rFirst').disabled=$('#rPrev').disabled=i===0;
    $('#rNext').disabled=$('#rLast').disabled=i===n;
    const nt=c.note(i);
    $('#rBubble').textContent=i===0?'Getting mated out of the opening happens to everyone. With some opening review, we can make sure it doesn’t happen again!'
      :(nt?nt.text:'');
    $('#rVisual').innerHTML=`<b>Board marks:</b> ${esc(c.visualText())}`;
    $('#rGraph').innerHTML=`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Evaluation graph (illustrative sample, not engine output): ${esc(REVIEW.evals.map((e,k)=>(k?`after move ${k}`:'start')+' '+e.t).join('; '))}. Currently showing ${i===0?'the start':'after move '+i}.">
      <rect width="${W}" height="${H}" fill="#403d39"/><path d="${area}" fill="#fff"/>
      <line x1="0" x2="${W}" y1="${H/2}" y2="${H/2}" stroke="#8b8987" stroke-width="1.5"/><g style="color:#ffd166">${gmark(i)}</g></svg>`;
    $('#rMoves').innerHTML=c.game.moves.map((r,k)=>{
      const nn=REVIEW.notes[k];
      return `<li><button type="button" data-rply="${k+1}" ${c.i===k+1?'aria-current="true"':''} class="${c.i===k+1?'cur':''}">
        <span class="mn">${Math.ceil((k+1)/2)}${r.c==='w'?'.':'…'}</span> <b>${esc(r.san)}</b>
        <span class="mk2" style="color:${REV_COL[nn.cls]}">${nn.sym||''} ${esc(nn.cls)}</span></button></li>`}).join('');
    $('#rStart').textContent=G.review.started?'Restart review':'Start Review';
  }
  ready=true;update(ctrl);
  main.addEventListener('click',e=>{
    const m=e.target.closest('[data-rply]');if(m){ctrl.go(+m.dataset.rply);return}
    const id=(e.target.closest('button')||{}).id;
    if(id==='rFirst')ctrl.go(0);else if(id==='rPrev')ctrl.go(ctrl.i-1);else if(id==='rNext')ctrl.go(ctrl.i+1);else if(id==='rLast')ctrl.go(n);
    else if(id==='rStart'){
      G.review.started=true;ctrl.go(0,false);ctrl.go(1);
      const f=$('#rMoves button');f&&f.focus();
    }
  });
  mountDock('review',dispose,()=>ctrl);
  const hint=$('#bCancel');if(hint)hint.remove();
}

/* =====================================================================
   SCREEN 4 — Puzzle
   ===================================================================== */
function puzzleRender(){
  return `${toolbarHTML()}
  <div class="lay lay-puzzle">
    <section class="bcol" aria-label="Puzzle board">
      <h1 class="sr-only" tabindex="-1">Puzzles</h1>
      <div class="pobj m-only" id="pObj"></div>
      <div class="bwrap"><div id="board"></div></div>
      ${boardbarHTML('puzzle')}
      <p class="kbhint">Keyboard: <kbd>←↑↓→</kbd> move · <kbd>Enter</kbd> select / move · <kbd>H</kbd> hint · <kbd>R</kbd> read the puzzle · <kbd>?</kbd> all keys</p>
    </section>
    <section class="ppanel pnl" aria-label="Puzzle panel">
      <div class="phead"><button type="button" class="ib" data-go="home" aria-label="Back to home">${I.back(26)}</button>
        ${I.puzzle(40,String(G.puzzle.idx+1))}<h2>Puzzles</h2>
        <div class="sp"><button type="button" class="ib" id="pSpeech" aria-pressed="${S.speech}" aria-label="Spoken announcements">${I.speaker()}</button>
          <button type="button" class="ib" id="pAbout" aria-label="About these puzzles">${I.layers()}</button></div></div>
      <div class="pbody">
        <div class="pcoach"><span class="coach-av p">${coachSVG(84,'coach')}</span>
          <div class="pbubble"><div class="t"><i id="pchk" aria-hidden="true"></i><span id="ptt">White to move</span></div>
            <div id="ptx"></div></div></div>
        <p class="demo-note" role="note">Demonstration puzzles: ${PUZZLES.length} built-in positions with stored solutions.</p>
        <div class="pscore" id="pscore" aria-label="Puzzles solved">0</div>
        <div class="pbar"><div class="bar" role="progressbar" aria-label="Puzzles solved" aria-valuemin="0" aria-valuemax="${PUZZLES.length}" aria-valuenow="0" id="pbar"><i id="pfill"></i></div>${I.puzzle(36,String(PUZZLES.length))}</div>
      </div>
      <div class="pfoot">
        <div class="btnrow2"><button type="button" class="mbtn js-hint" id="hint">${I.bulb(24)}<span>Hint</span></button>
          <button type="button" class="mbtn js-retry" id="pRetry">${I.restart(18)}<span>Try again</span></button></div>
        <div class="row">
          <button type="button" class="ib" data-open-a11y aria-label="Accessibility settings">${I.gear(26,'#a7a6a4')}</button><span class="grow" id="pNum"></span>
          <button type="button" class="ib" id="pPrev" aria-label="Previous puzzle">${I.prev(26)}<span class="blabel">Previous puzzle</span></button>
          <button type="button" class="ib" id="pNext" aria-label="Next puzzle">${I.next(26)}<span class="blabel">Next puzzle</span></button></div>
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
    const done=PS.solved.filter(Boolean).length;
    $('#pNum').textContent=`Puzzle ${PS.idx+1} of ${PUZZLES.length}`;
    $('#pscore').textContent=String(done);
    $('#pfill').style.width=(done/PUZZLES.length*100)+'%';
    $('#pbar').setAttribute('aria-valuenow',String(done));
    const chk=$('#pchk');
    if(solved){chk.className='ok';chk.innerHTML=I.check(16);$('#ptt').textContent='Solved!';
      $('#ptx').textContent=`${P.title}: well done. ${c.game.moves.length?c.game.moves[c.game.moves.length-1].san+' is checkmate.':''}`}
    else if(c.lastError){chk.className='bad';chk.textContent='✖';$('#ptt').textContent='Not the move';$('#ptx').textContent=c.lastError+' Try again.'}
    else{chk.className='';chk.textContent='';$('#ptt').textContent='White to move';
      $('#ptx').textContent=c.hints?`Hint ${Math.min(c.hints,P.hints.length)}: ${P.hints[Math.min(c.hints,P.hints.length)-1]}`:'In this puzzle, it’s your turn as white and you can win in just one move! Can you make the move?'}
    {const po=$('#pObj');if(po){
      const icon=solved?'✔':(c.lastError?'✖':'●');
      po.className='pobj m-only '+(solved?'ok':c.lastError?'bad':'');
      po.innerHTML=`<b>${icon} ${esc($('#ptt').textContent)} <span class="pn-num">· Puzzle ${PS.idx+1} of ${PUZZLES.length}</span></b><span>${esc($('#ptx').textContent)}</span>`}}
    $$('.js-hint').forEach(b=>{b.disabled=solved});
    $$('.js-retry').forEach(b=>{b.disabled=!solved&&!c.game.moves.length&&!c.hints&&!c.lastError});
    const sm=c.summary();
    $('#dkStatus').innerHTML=statusRowsHTML([
      ['Puzzle',`${PS.idx+1} of ${PUZZLES.length} — ${esc(P.title)}`],['Task',esc(P.intro)],['Selected',esc(sm.selected)],
      ['Result',solved?'✔ Solved':'Not solved yet',solved?'ok':''],['Hints used',String(c.hints||0)],
      ...(c.lastError&&!solved?[['Error','✖ '+esc(c.lastError),'bad']]:[])
    ]);
    syncBoardbar(c);
  }
  load();
  $('#pSpeech').addEventListener('click',()=>{toggleSetting('speech');$('#pSpeech').setAttribute('aria-pressed',String(S.speech))});
  settingSubs.push(()=>{const b=$('#pSpeech');if(b)b.setAttribute('aria-pressed',String(S.speech))});
  $$('.js-hint').forEach(b=>b.addEventListener('click',()=>ctrl.hint()));
  $$('.js-retry').forEach(b=>b.addEventListener('click',()=>{PS.solved[PS.idx]=false;ctrl.solved=false;ctrl.resetPuzzle()}));
  const go=d=>{PS.idx=(PS.idx+d+PUZZLES.length)%PUZZLES.length;load();say(`Puzzle ${PS.idx+1} of ${PUZZLES.length}: ${PUZZLES[PS.idx].title}. ${PUZZLES[PS.idx].intro}`,{kind:'game'})};
  $('#pPrev').addEventListener('click',()=>go(-1));$('#pNext').addEventListener('click',()=>go(1));
  $('#pAbout').addEventListener('click',()=>infoDialog('About these puzzles',
    `<p>These are ${PUZZLES.length} built-in demonstration puzzles with stored solutions. Every move is checked by the prototype’s rules engine; a move is only called correct if it matches the stored solution or checkmates.</p><p>There is no puzzle database or rating system.</p>`));
  main.addEventListener('click',e=>{
    const b=e.target.closest('button');
    if(b&&b.id==='bUndo'){/* handled by dock */}
  });
  mountDock('puzzle',dispose,()=>ctrl);
  const u=$('#bUndo');if(u)u.remove();
  dispose.push(()=>ctrl&&ctrl.destroy());
}

/* =====================================================================
   SCREEN 5 — Play Chess / navigation menu
   ===================================================================== */
function menuRender(){
  const item=(icon,title,desc,attr)=>`<li><button type="button" class="mitem" ${attr}><span class="ico" aria-hidden="true">${icon}</span><span class="mtx"><b>${title}</b><span>${desc}</span></span></button></li>`;
  return `${toolbarHTML()}
  <div class="lay lay-menu">
    <h1 class="sr-only" tabindex="-1">Play Chess menu</h1>
    <section class="mpanel pnl" aria-labelledby="mh">
      <div class="mhead">${I.play(48)}<h2 id="mh">Play Chess</h2></div>
      <div class="mlist" id="mlist">
        <button type="button" class="acc-card" data-open-a11y>
          <span class="ico">${I.access(34)}</span>
          <span class="mtx"><b>Accessibility settings</b><span>Screen reader, voice control, contrast, board and text size, audio and vibration</span></span></button>
        <h3 class="grp">Play</h3>
        <ul class="mgroup" aria-label="Play">
          ${item(I.bolt(54),'Play Online','Play vs a person of similar skill','data-go="play"')}
          ${item(I.robot(54),'Play Bots','Challenge a bot from Easy to Master','data-go="play"')}
          ${item(`<span class="coach-ic big">${coachSVG(58,'coach')}</span>`,'Play Coach','Learn as you play a game with Coach','data-go="play"')}
          ${item(I.hand(58),'Play a Friend','Invite a friend to a game of chess','data-act="friend"')}
        </ul>
        <h3 class="grp">Compete and explore</h3>
        <ul class="mgroup" aria-label="Compete and explore">
          ${item(I.medal(58),'Tournaments','Join an Arena where anyone can win','data-act="tournaments"')}
          ${item(I.cube(54),'Chess Variants','Find fun new ways to play chess','data-act="variants"')}
        </ul>
      </div>
    </section>
    <section class="bcol" aria-label="Preview board">
      <div class="statusstrip m-only" id="statusStrip"></div>
      <div class="prow"><div class="av dark" style="width:50px;height:50px">${sv(50,'0 0 50 50','<circle cx="25" cy="19" r="9" fill="#6a6866"/><path d="M8,50C8,36 17,32 25,32C33,32 42,36 42,50Z" fill="#6a6866"/>')}</div><div class="pinfo"><span class="pn">Opponent</span><span class="who">Placeholder · preview board</span></div></div>
      <div class="bwrap"><div id="board"></div></div>
      <div class="prow">${ratingRow('Player1','217','White · you',0)}</div>
      ${boardbarHTML('menu')}
      <p class="kbhint">This preview board follows the real chess rules but is not connected to a game. Press <kbd>R</kbd> to read it.</p>
    </section>
    ${dockHTML('menu')}
  </div>`;
}
function menuMount(main,dispose){
  const ctrl=new GameController({host:$('#board'),game:G.menu.game,opponent:false,name:'menu',label:'Preview chessboard',
    onChange:c=>{
      const sm=c.summary();
      $('#dkStatus').innerHTML=statusRowsHTML([['Turn',esc(sm.turn)],['Selected',esc(sm.selected)],['Last move',esc(sm.last)],['Legal moves',sm.over?'—':String(sm.legalCount)],
        ...(sm.error?[['Error','✖ '+esc(sm.error),'bad']]:[])]);
      syncBoardbar(c);paintStrip(sm);
    }});
  Ctx.kind='menu';Ctx.ctrl=ctrl;dispose.push(()=>ctrl.destroy());
  $('#mlist').addEventListener('keydown',e=>{
    if(e.key!=='ArrowDown'&&e.key!=='ArrowUp')return;
    const bs=$$('button',$('#mlist')),i=bs.indexOf(document.activeElement);if(i<0)return;
    e.preventDefault();bs[(i+(e.key==='ArrowDown'?1:-1)+bs.length)%bs.length].focus();
  });
  mountDock('menu',dispose,()=>ctrl);
}

/* =====================================================================
   Router + boot
   ===================================================================== */
const SCREENS={
  home:{title:'Home',render:homeRender,mount:homeMount},
  play:{title:'Playing',render:playRender,mount:playMount},
  review:{title:'Game Review',render:reviewRender,mount:reviewMount},
  puzzle:{title:'Puzzles',render:puzzleRender,mount:puzzleMount},
  menu:{title:'Play Chess menu',render:menuRender,mount:menuMount}
};
const Dispose=[];
let CURRENT=null;
function navigate(id){
  if(location.hash==='#'+id)route(true);else location.hash=id;
}
function route(userNav){
  const id=(location.hash||'#home').slice(1);
  if(userNav&&!SCREENS[id])return;
  const sc=SCREENS[id]?id:'home';
  Dispose.splice(0).forEach(f=>{try{f()}catch(e){console.error(e)}});
  stopSpeaking();
  Ctx.kind=null;Ctx.ctrl=null;CURRENT=sc;
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
}
boot();
