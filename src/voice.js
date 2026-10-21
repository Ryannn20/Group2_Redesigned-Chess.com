/* =====================================================================
   Voice / typed command interpreter
   Same pipeline for speech recognition and the text-input fallback:
   normalise → parse → validate against the rules engine → confirm if
   consequential → execute → report
   ===================================================================== */
const Ctx={kind:null,ctrl:null};
const FILE_WORDS={a:['a','ay','eh','alpha'],b:['b','be','bee','bravo'],c:['c','see','sea','charlie'],d:['d','dee','delta'],
  e:['e','echo'],f:['f','eff','ef','foxtrot'],g:['g','gee','jee','golf'],h:['h','aitch','hotel']};
const FILE_MAP={};Object.entries(FILE_WORDS).forEach(([k,w])=>w.forEach(x=>FILE_MAP[x]=k));
const RANK_MAP={one:1,won:1,two:2,three:3,tree:3,four:4,for:4,fore:4,five:5,six:6,seven:7,eight:8,ate:8};
const PIECE_MAP={pawn:'p',knight:'n',night:'n',bishop:'b',rook:'r',brook:'r',rock:'r',queen:'q',king:'k'};
const PIECE_RE='(pawn|knight|night|bishop|rook|brook|rock|queen|king)';

function normalizeCommand(raw){
  let t=String(raw).toLowerCase().replace(/['’]/g,'').replace(/[.,!?;:]/g,' ').replace(/\b([a-h])\s*[-–]\s*([1-8])\b/g,'$1$2').replace(/\s+/g,' ').trim();
  const tk=t.split(' ').filter(Boolean),out=[],squares=[];
  const rank=(a,b)=>{
    if(/^[1-8]$/.test(a))return a;
    if(RANK_MAP[a])return String(RANK_MAP[a]);
    if((a==='to'||a==='too')&&(b===undefined||['to','too','two','on'].includes(b)))return '2';
    if(a==='two')return '2';
    return null;
  };
  for(let i=0;i<tk.length;i++){
    const w=tk[i];
    if(/^[a-h][1-8]$/.test(w)){out.push('SQ');squares.push(w);continue}
    const fl=FILE_MAP[w];
    if(fl&&i+1<tk.length){const rk=rank(tk[i+1],tk[i+2]);if(rk){out.push('SQ');squares.push(fl+rk);i++;continue}}
    out.push(w);
  }
  return {text:out.join(' '),squares,tokens:tk};
}
const SET_TARGETS=[
  ['spaceTalk',/\b(space ?bar|push[ -]to[ -]talk)\b/],
  ['lowTime',/\blow[ -]?time\b/],
  ['screenReader',/\bscreen ?reader\b/],
  ['speakBoard',/\b(spoken|speak|speaking) (board|descriptions?)\b|\bboard descriptions?\b/],
  ['continuousListen',/\bcontinuous( listening)?\b/],
  ['voice',/\bvoice (controls?|input|recognition)\b/],
  ['speech',/\b(spoken|speech|speaking|voice feedback|announcements?|text to speech)\b/],
  ['contrast',/\bcontrast\b/],
  ['sound',/\b(sound|sounds|sound effects?|audio|beeps?|noises)\b/],
  ['haptic',/\b(vibration|vibrations|haptic|haptics|vibrate)\b/],
  ['reduceMotion',/\b(reduced motion|reduce motion|motion|animations?)\b/],
  ['largeTargets',/\b(large|larger|big|bigger) (targets|buttons|controls)\b/],
  ['clickToMove',/\bclick[ -]?to[ -]?move\b/],
  ['!clickToMove',/\bdrag(ging)?\b|\bdrag and drop\b/],
  ['keyboardNav',/\bkeyboard( navigation)?\b/],
  ['strongFocus',/\b(strong )?focus( indicators?| outlines?| rings?)?\b/],
  ['markers',/\b(move indicators?|board markers?|markers?|legal move indicators?)\b/],
  ['confirmActions',/\bconfirmations?\b/],
  ['untimed',/\buntimed\b|\bno time limit\b/],
  ['!untimed',/\b(clocks?|timers?|time limits?)\b/]
];
function parseSettingCommand(t){
  let on=null;
  if(/\bunmute\b/.test(t))return {key:'sound',value:true};
  if(/\bmute\b/.test(t))return {key:'sound',value:false};
  if(/\b(reduce|stop|minimi[sz]e|limit) (the |all )?(motion|animations?)\b/.test(t))return {key:'reduceMotion',value:true};
  if(/\b(enable|enabled|turn on|switch on|activate|use)\b/.test(t))on=true;
  else if(/\b(disable|disabled|turn off|switch off|deactivate|stop using)\b/.test(t))on=false;
  else if(/\btoggle\b/.test(t))on='toggle';
  if(on===null)return null;
  for(const [k,re] of SET_TARGETS){
    if(re.test(t)){
      const inv=k[0]==='!',key=inv?k.slice(1):k;
      return {key,value:on==='toggle'?'toggle':(inv?!on:on),inverted:inv};
    }
  }
  return null;
}
function parseSizeCommand(t){
  const up=/\b(increase|bigger|larger|enlarge|raise|grow|zoom in|magnify)\b/.test(t);
  const down=/\b(decrease|smaller|shrink|lower|zoom out)\b/.test(t)||/\breduce\b.*\b(text|font|board)\b/.test(t);
  if(!up&&!down)return null;
  let key=null;
  if(/\b(text|font|words|writing|letters)\b/.test(t))key='textSize';
  else if(/\bboard\b/.test(t))key='boardSize';
  return {key,dir:up?1:-1};
}
function parseCommand(raw){
  const {text:t,squares:sq}=normalizeCommand(raw);
  const pm=t.match(new RegExp('\\b'+PIECE_RE+'\\b'));
  const piece=pm?PIECE_MAP[pm[1]]:null;
  const promoM=t.match(/(?:promot\w*|equals?|becomes?|into)\s+(?:to\s+)?(queen|rook|brook|bishop|knight|night)/)||t.match(/SQ\s+(queen|rook|bishop|knight|night)$/);
  const promo=promoM?PIECE_MAP[promoM[1]]:null;
  const R={raw,text:t,squares:sq,piece,promo};
  const m=re=>re.test(t);
  if(!t)return {...R,intent:'empty'};
  if(m(/^(yes|yeah|yep|confirm|confirmed|ok|okay|sure|do it|proceed|go ahead|affirmative)$/))return {...R,intent:'yes'};
  if(m(/^(no|nope|nah|not now|never mind|nevermind|dont|do not)$/))return {...R,intent:'no'};
  if(m(/\b(help|what can i say|commands|instructions)\b/))return {...R,intent:'help'};
  if(m(/\b(stop listening|stop the (mic|microphone)|(mic|microphone) off|turn off (the )?(mic|microphone)|mute (the )?(mic|microphone)|end listening|stop voice)\b/))return {...R,intent:'mic-off'};
  if(m(/\b(stop|quiet|silence|be quiet|shut up)\b/)&&!m(/\bpuzzle\b/))return {...R,intent:'stop'};
  if(m(/\b(open|show|launch|start)\b.*\bvoice (controls?|panel|commands?)\b/)||m(/^voice controls?$/))return {...R,intent:'open-voice'};
  if(m(/\b(close|hide|dismiss)\b.*\bvoice (controls?|panel)\b/))return {...R,intent:'close-voice'};
  if(m(/\b(close|hide|dismiss)\b.*\b(accessibility|settings)\b/))return {...R,intent:'close-settings'};
  if(m(/\breset\b.*\b(settings|accessibility|preferences)\b/))return {...R,intent:'reset-settings'};
  {const sc=parseSettingCommand(t);if(sc)return {...R,intent:'set',...sc}}
  {const zc=parseSizeCommand(t);if(zc)return {...R,intent:'size',...zc}}
  if(m(/\b(open|show|go to|take me to)\b.*\b(accessibility|settings)\b/))return {...R,intent:'settings'};
  // ---- whole-interface navigation (works on every screen)
  if(m(/\b(where am i|what (screen|page) (is this|am i on)|which (screen|page)|current (screen|page)|read (this|the) (screen|page)|describe (this|the) (screen|page)|whats on (this|the) (screen|page)|what is on (this|the) (screen|page))\b/))return {...R,intent:'where'};
  if(m(/\b(list|read|show|what are|tell me)\b.*\b(buttons|controls|options|actions|links)\b/)||m(/\bwhat can i (do|press|click|choose)\b/)||m(/^(options|actions|controls|buttons)$/))return {...R,intent:'list'};
  if(m(/\b(read|list)\b.*\b(headings|sections)\b/))return {...R,intent:'headings'};
  if(m(/^(more|more controls|more options|next page|keep going|continue)$/))return {...R,intent:'more'};
  if(m(/^(next|forward) (control|button|item|link|element|option)$/)||m(/^(tab|tab forward)$/))return {...R,intent:'ctl-next'};
  if(m(/^(previous|back|last) (control|button|item|link|element|option)$/)||m(/^(shift tab|tab back|tab backward)$/))return {...R,intent:'ctl-prev'};
  if(m(/^(activate|press enter|click it|press it|press|click|tap|select it|select this|use this)$/))return {...R,intent:'activate'};
  if(m(/\bscroll (down|up)\b|^(page down|page up)$/))return {...R,intent:'scroll',dir:/\bdown\b/.test(t)?1:-1};
  if(m(/\b(go to|scroll to|jump to|take me to) (the )?(top|bottom)\b/))return {...R,intent:'scroll-end',dir:/bottom/.test(t)?1:-1};
  if(m(/^(go back|back|navigate back|previous screen|previous page|go to previous screen)$/))return {...R,intent:'back'};
  if(m(/^(close|close this|close it|dismiss|exit|close (the )?(dialog|window|popup|message|panel))$/))return {...R,intent:'close'};
  {const sm=t.match(/^(?:search|find)(?: for)?\s+(.+)$/);if(sm&&!sq.length)return {...R,intent:'search',query:sm[1]}}
  {
    const nt=t.replace(/^(please |can you |could you |would you )/,'');
    const hasVerb=/\b(go to|go|open|show me|show|take me to|bring me to|navigate to|switch to|visit|launch|view)\b/.test(nt);
    const bare=/^(home|dashboard|playing|current game|play menu|play chess|play|puzzles?|game review|review|analysis|game history|history|learn|lessons?|tournaments?|chess variants|variants|free trial|search|profile|friends|messages?|inbox|notifications?)$/.test(nt);
    if((hasVerb||bare)&&!sq.length){
      for(const [re,dest] of NAV_MAP){
        if(re.test(nt)){
          const [kind,val]=dest.split(':');
          return kind==='screen'?{...R,intent:'navigate',dest:val}:{...R,intent:'sidebar',act:val};
        }
      }
    }
  }
  if(m(/\b(castle|castles|castling)\b/)||m(/\bo ?o ?o\b/)||m(/\b(short|long) castle\b/)){
    const q=m(/\b(queen|long|queenside|queen side)\b/)||m(/\bo ?o ?o\b/);
    return {...R,intent:'castle',side:q?'Q':'K'};
  }
  if(m(/\b(offer|propose|request|claim)\b.*\bdraw\b/)||m(/^draw$/)||m(/\bdraw offer\b/))return {...R,intent:'draw'};
  if(m(/\b(resign|give up|forfeit|surrender)\b/))return {...R,intent:'resign'};
  if(m(/\b(new game|reset|restart|start over|try again)\b/))return {...R,intent:'reset'};
  if(m(/\b(undo|take back|takeback|take it back)\b/))return {...R,intent:'undo'};
  if(m(/\b(cancel|clear|deselect|unselect|drop|put down)\b/)&&!m(/\bmove\b.*\bSQ\b/))return {...R,intent:'cancel'};
  if(m(/\b(flip|rotate|turn around|switch sides)\b.*\bboard\b|\bflip\b/))return {...R,intent:'flip'};
  if(m(/\b(next|another|new) puzzle\b/)&&!sq.length)return {...R,intent:'next-puzzle'};
  if(m(/\b(hint|clue)\b/))return {...R,intent:'hint'};
  if(m(/\b(first|start)\b.*\b(move|position)\b/)&&!sq.length)return {...R,intent:'rv-first'};
  if(m(/\b(last|final|latest|end)\b.*\b(position)\b/)&&!sq.length)return {...R,intent:'rv-last'};
  if(m(/\b(next|forward|advance)\b( move| position)?$/)||m(/^next$/))return {...R,intent:'next'};
  if(m(/\b(previous|backward)\b( move| position)$/)||m(/^previous$/)||m(/^(go )?back (one )?(move|position)$/))return {...R,intent:'prev'};
  if(m(/\b(read|describe|tell|announce|say|speak)\b.*\b(board|position|puzzle)\b/)||m(/^(board|position)$/)||m(/\bwhere are (the|all)\b.*\bpieces\b/))return {...R,intent:'board'};
  if(m(/\b(whose|whos|who is|who has|which side)\b.*\b(turn|move|play)\b/)||m(/^(turn|whose turn)$/)||m(/\bmy turn\b/)||m(/\bwho to move\b/))return {...R,intent:'turn'};
  if(m(/\b(last|latest|previous|recent)\b.*\bmove\b/)||m(/\bwhat (just )?(happened|was played)\b/))return {...R,intent:'last'};
  if(m(/\b(legal|possible|available|valid)\b.*\bmoves?\b/)||m(/\bwhere can\b/)||m(/\bwhat can (i|it|this) (piece )?move\b/)||m(/\bmoves for\b/))return {...R,intent:'legal',sq:sq[0]||null};
  if(m(/\bwhat\b.*\b(is|on|at|there)\b/)&&sq.length||m(/\b(describe|check|look at|inspect|examine)\b/)&&sq.length||m(/\bwhats? (on|at)\b/)&&sq.length)return {...R,intent:'describe',sq:sq[0]};
  if(m(/\b(go to|focus|cursor|jump to|navigate to)\b/)&&sq.length===1)return {...R,intent:'cursor',sq:sq[0]};
  if(m(/\b(select|pick|choose|click|touch|tap|grab|take)\b/)&&sq.length===1&&!piece)return {...R,intent:'select',sq:sq[0]};
  if(sq.length>=2&&(m(/\b(move|play|from|to|takes?|captures?|goes?|go)\b/)||m(/^SQ SQ/)))return {...R,intent:'move',from:sq[0],to:sq[1]};
  if(piece&&sq.length>=1&&(m(/\b(to|takes?|captures?|on|at|move|goes?)\b/)||true)){
    return {...R,intent:'piece',to:sq[sq.length-1],from:sq.length>=2?sq[0]:null};
  }
  if(sq.length===1&&/^SQ( (queen|rook|bishop|knight))?$/.test(t))return {...R,intent:'square',sq:sq[0]};
  {const cm=t.match(/^(?:please )?(click|press|tap|activate|push|hit|choose|pick|select|open|toggle|use|start|switch)(?: on)?(?: the)?\s+(.+)$/);
   if(cm&&!sq.length)return {...R,intent:'click',phrase:cm[1]==='start'?t:cm[2],whole:t}}
  return {...R,intent:'unknown'};
}

const Voice={
  SR:window.SpeechRecognition||window.webkitSpeechRecognition||null,
  listening:false,rec:null,pending:null,history:[],heard:'',understood:'',result:'',resultOk:true,subs:new Set(),
  get supported(){return !!this.SR},
  notify(){this.subs.forEach(f=>f())},
  setResult(text,ok=true){this.result=text;this.resultOk=ok;this.notify()},
  preparing:false,userStopped:false,errored:false,contSession:false,ttsBusy:false,ttsUntil:0,lastCmdAt:0,idleT:null,
  IDLE_MS:5*60*1000,
  start(){
    if(!this.supported){
      const m='Speech recognition is not available in this browser, so the microphone cannot be used. Please type your command instead; typed commands work the same way.';
      this.setResult(m,false);say(m,{kind:'alert',urgent:true});
      if(typeof focusVoiceInput==='function')focusVoiceInput();
      return;
    }
    if(this.listening||this.preparing){this.stop();return}
    if(location.protocol==='file:'&&!Ann.noted.file){
      Ann.noted.file=1;
      pushLog('Note: this page was opened as a file, so your browser asks for microphone permission every time the microphone starts. To be asked only once, start AcChess with start-acchess.bat (opens http://localhost:5188/), and consider turning on Continuous listening so the microphone starts only once.','info',false);
    }
    if(!S.voice)setSetting('voice',true);
    this.preparing=true;this.userStopped=false;this.errored=false;this.notify();
    let began=false;
    const begin=()=>{if(began)return;began=true;if(!this.preparing)return;this.preparing=false;this._listen()};
    const msg=S.continuousListen
      ?'Listening continuously. Say a command at any time. Say “stop listening” to turn the microphone off.'
      :'Listening. You may speak now.';
    // announce first, then open the microphone (so our own voice is not recognised as a command)
    say(msg,{kind:'info',force:true,done:begin});
    setTimeout(begin,S.speech?3600:900);
  },
  /* true when the recognised text is just our own spoken announcement coming back through the speakers */
  echo(txt){
    if(this.ttsBusy||Date.now()<this.ttsUntil)return true;
    const q=txt.toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
    if(q.length<12)return false;
    return Ann.log.slice(-8).some(e=>e.spoken&&e.text.toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').includes(q));
  },
  /* in continuous mode, background speech that is not a command is ignored silently */
  looksLikeCommand(txt){
    const c=parseCommand(txt);
    if(c.intent!=='unknown'&&c.intent!=='empty')return true;
    const q=VoiceNav.norm(txt);
    return q.length>=4&&!/^[0-9 ]+$/.test(q)&&VoiceNav.match(txt,VoiceNav.controls(),true).length>0;
  },
  _final(txt,conf,R){
    txt=(txt||'').trim();if(!txt)return;
    if(/listening/i.test(txt)&&/speak now/i.test(txt))return;
    if(this.echo(txt))return;
    const cont=this.contSession;
    this.gotFinal=true;this.lastCmdAt=Date.now();
    if(!cont){this.listening=false;try{R.stop()}catch(err){}}        // one command, then back to inactive
    this.heard=txt;this.notify();
    if(cont&&!this.looksLikeCommand(txt)){
      this.addHistory(txt,'voice','ignored','Not recognised as a command — ignored');
      this.setResult(`Ignored (not a command): “${txt}”`,true);
      return;
    }
    say(`Heard: ${txt}.`,{kind:'info',force:true});
    this.submit(txt,{source:'voice',confidence:conf});
  },
  _listen(){
    const cont=!!S.continuousListen;
    let R;
    try{R=new this.SR();R.lang='en-US';R.interimResults=true;R.maxAlternatives=1;R.continuous=cont}
    catch(e){this.setResult('The microphone could not be started. You can type commands instead.',false);return}
    this.rec=R;this.heard='';this.gotFinal=false;this.noReport=false;this.contSession=cont;this.lastCmdAt=Date.now();this.restarts=0;
    clearInterval(this.idleT);
    if(cont)this.idleT=setInterval(()=>{
      if(this.contSession&&this.listening&&Date.now()-this.lastCmdAt>this.IDLE_MS){
        this.stop(true);
        const m='The microphone was turned off after 5 minutes without a command. Press the microphone button to listen again.';
        this.setResult(m,true);say(m,{kind:'info',force:true});
      }
    },15000);
    R.onstart=()=>{
      this.listening=true;
      this.setResult(cont?'Listening continuously. Say a command at any time.':'Listening. You may speak now.',true);
      if(S.sound&&!this.restarts)Sfx.play('select');
      if(!this.restarts)pushLog(cont?'Microphone is on (continuous listening).':'Microphone is listening.','info',false);
      this.notify();
    };
    R.onresult=e=>{
      let interim='';
      for(let i=e.resultIndex;i<e.results.length;i++){
        const r=e.results[i];
        if(r.isFinal)this._final(r[0].transcript,r[0].confidence||1,R);
        else interim+=r[0].transcript;
      }
      if(interim&&!this.echo(interim)){this.heard=interim+' …';this.notify()}
    };
    R.onerror=e=>{
      if(cont&&e.error==='no-speech')return;                              // normal while waiting in continuous mode
      this.errored=e.error!=='aborted'&&e.error!=='no-speech';
      const map={'not-allowed':'Microphone permission was denied. You can allow it in the browser address bar, or type your command instead.',
        'service-not-allowed':'Speech recognition is not allowed in this browser or page. Type your command instead.',
        'no-speech':'No speech was heard, so the microphone is off. Press the microphone button to try again, or type your command.',
        'audio-capture':'No microphone was found. Type your command instead.',
        'network':'Speech recognition needs a network connection in this browser. Type your command instead.',
        'language-not-supported':'This browser does not support speech recognition for English here. Type your command instead.',
        'aborted':'Microphone stopped.'};
      if(e.error==='aborted'&&this.userStopped)return;
      this.noReport=true;
      this.setResult(map[e.error]||`Speech recognition reported an error (${e.error}). Type your command instead.`,e.error==='aborted'||e.error==='no-speech');
      say(this.result,{kind:'alert',urgent:true});
      if(this.errored&&typeof focusVoiceInput==='function')focusVoiceInput();
    };
    R.onend=()=>{
      this.listening=false;
      const again=cont&&S.continuousListen&&!this.errored&&!this.userStopped;
      if(again){
        // the browser closed the session by itself: reopen the SAME recogniser object (no new permission request on normal sites)
        this.restarts++;this.notify();
        setTimeout(()=>{
          if(this.userStopped||this.listening||this.preparing||this.rec!==R)return;
          try{R.start()}catch(err){this._listen()}
        },300);
        return;
      }
      clearInterval(this.idleT);
      if(!this.gotFinal&&!this.noReport&&!this.userStopped){
        const m='No command was heard. The microphone is off. Press the microphone button to try again, or type your command.';
        this.setResult(m,false);say(m,{kind:'alert'});
      }
      this.noReport=false;
      this.notify();
    };
    try{R.start()}catch(e){this.setResult('The microphone is already starting. Please wait a moment.',false)}
  },
  stop(quiet){
    this.userStopped=true;this.preparing=false;
    clearInterval(this.idleT);
    try{if(this.rec){this.rec.abort?this.rec.abort():this.rec.stop()}}catch(e){}
    const was=this.listening||this.contSession;this.listening=false;this.contSession=false;this.notify();
    if(was&&quiet!==true)say('Microphone stopped.',{kind:'info',force:true});
  },
  addHistory(text,source,outcome,summary){
    this.history.unshift({text,source,outcome,summary,t:new Date()});
    if(this.history.length>30)this.history.pop();
  },
  submit(raw,meta={}){
    raw=String(raw||'').trim();
    if(!raw)return;
    this.heard=raw;this.notify();
    if(meta.source==='voice'&&meta.confidence!=null&&meta.confidence<0.5&&!meta.confirmed){
      const k=parseCommand(raw).intent;
      if(['move','piece','select','castle','resign','draw','undo','reset'].includes(k)){
        confirmAction({title:'Did I hear you correctly?',message:`I heard “${raw}”, but I am not sure. Run this command?`,confirmLabel:'Yes, run it',always:true,
          onConfirm:()=>this.submit(raw,{...meta,confirmed:true})});
        this.setResult(`Low recognition confidence for “${raw}”. Waiting for your confirmation.`,true);
        return;
      }
    }
    const res=this.run(raw,meta);
    this.addHistory(raw,meta.source||'typed',res.ok?(res.confirm?'confirm':'ok'):'fail',res.msg);
    this.understood=res.understood||'';
    this.setResult(res.msg,res.ok);
  },
  /* returns {ok,msg,understood,confirm?} */
  run(raw,meta){
    const c=parseCommand(raw),C=Ctx.ctrl,K=Ctx.kind,piece=c.piece;
    const isGame=C instanceof GameController,isRev=C instanceof ReviewController;
    const fail=(msg,und)=>{say(msg,{kind:'alert',urgent:true});return {ok:false,msg,understood:und||''}};
    const done=(msg,und)=>({ok:true,msg,understood:und||msg});
    if(Dlg.isOpen()&&Dlg.opts&&Dlg.opts.promo&&piece){
      const label=cap1(NAMES[piece]);
      const b=[...Dlg.el.querySelectorAll('[data-act]')].find(x=>x.textContent===label);
      if(b){b.click();return done(`Promoted to ${NAMES[piece]}.`,`Promote to ${NAMES[piece]}`)}
    }
    // a pending clarification takes the next square / ordinal
    if(this.pending&&this.pending.kind==='clarify'){
      const p=this.pending;
      if(c.intent==='no'||c.intent==='cancel'){this.pending=null;say('Okay, cancelled.',{kind:'cmd'});return done('Clarification cancelled.')}
      let pick=null;
      if(c.squares.length)pick=p.options.find(o=>o.from===c.squares[0]);
      if(!pick&&/\b(first|one)\b/.test(c.text))pick=p.options[0];
      if(!pick&&/\b(second|two)\b/.test(c.text))pick=p.options[1];
      if(pick){this.pending=null;return this.doMove(sqp(pick.from),sqp(p.to),p.promo,`Move ${pick.piece} from ${pick.from} to ${p.to}`)}
      if(c.intent==='unknown'||c.intent==='square'||c.intent==='empty'){
        const msg=`I need one of these starting squares: ${joinList(p.options.map(o=>o.from))}. Say, for example, “${p.options[0].from}”.`;
        say(msg,{kind:'alert'});return {ok:false,msg,understood:'Waiting for clarification'};
      }
      this.pending=null;
    }
    // a pending "which control?" question takes a number or a name
    if(this.pending&&this.pending.kind==='ui'){
      const p=this.pending;
      if(['no','cancel','close'].includes(c.intent)||/^(none|nevermind|never mind)$/.test(c.text)){this.pending=null;say('Okay, cancelled.',{kind:'cmd'});return done('Cancelled.')}
      let el=null;
      const num=c.text.match(/\b(\d+|one|two|three|four|five|six|first|second|third|fourth|fifth|sixth)\b/);
      if(num){const n=/^\d+$/.test(num[1])?+num[1]:NUMW[num[1]];if(p.options[n-1])el=p.options[n-1].el}
      if(!el){const ms=VoiceNav.match(c.text,p.options);if(ms.length===1)el=ms[0].el}
      if(el){this.pending=null;return VoiceNav.press(el)}
      const msg=`Please say a number from 1 to ${p.options.length}, or “cancel”.`;
      say(msg,{kind:'alert'});return {ok:false,msg,understood:'Waiting for your choice'};
    }
    switch(c.intent){
      case'empty':return fail('I did not hear a command. Try “what can I do here”, “go to puzzles” or “read the board”.');
      case'unknown':{
        const r=VoiceNav.direct(raw);if(r)return r;
        return fail(`Sorry, I did not understand “${raw}”. Try “where am I”, “list controls”, “go to puzzles”, “press” and a control name, “read the board”, or say “help”.`);
      }
      case'help':{
        const t='Navigation: go to home, play, puzzles, game history, learn, search, or messages; go back; where am I; list controls, then say more; press followed by a control name; next control, previous control, activate; scroll down or up; close. '+
          'Settings: open accessibility settings; enable high contrast; increase text size; turn off sound. '+
          'Chess: select e2; move e2 to e4; knight to f3; what is on e4; read the board; whose turn is it; read legal moves; cancel selection; undo; offer draw; resign; hint; next move; previous move.';
        say(t,{kind:'cmd'});return done(t,'Show help');
      }
      case'stop':stopSpeaking();return done('Speech stopped.','Stop speaking');
      case'mic-off':
        if(this.listening||this.contSession||this.preparing){setTimeout(()=>this.stop(),0);return done('Turning the microphone off.','Stop listening')}
        return done('The microphone is already off.','Stop listening');
      case'settings':openA11y();return done('Opened the accessibility settings panel.','Open accessibility settings');
      case'navigate':{
        if(/\bplay chess\b/.test(c.text)){const b=VoiceNav.match('play chess',VoiceNav.controls()).filter(x=>x.role==='button');if(b.length===1)return VoiceNav.press(b[0].el)}
        if(Dlg.isOpen())Dlg.close();
        navigate(c.dest);return done(`Opened ${SCREEN_NAMES[c.dest]}.`,`Go to ${SCREEN_NAMES[c.dest]}`);
      }
      case'yes':{
        if(Dlg.confirmOpen()){Dlg.accept();return done('Confirmed.','Confirm')}
        return fail('There is nothing to confirm right now.');
      }
      case'no':{
        if(Dlg.confirmOpen()){Dlg.dismiss();return done('Cancelled.','Cancel')}
        return fail('There is nothing to cancel right now.');
      }
    }
    if(c.intent==='cancel'&&Dlg.confirmOpen()){Dlg.dismiss();return done('Cancelled.','Cancel')}
    const DIALOG_OK=['help','stop','where','list','more','headings','ctl-next','ctl-prev','activate','click','close','scroll','scroll-end','back','unknown'];
    if(Dlg.isOpen()&&!DIALOG_OK.includes(c.intent)){
      return fail('A dialog is open. Say “confirm” or “cancel”, say “close”, or press one of its buttons by name.');
    }
    switch(c.intent){
      case'open-voice':
        if(VoiceUI.open){focusVoiceInput();return done('Voice Controls are already open.','Open voice controls')}
        openVoice();return done('Voice Controls are open.','Open voice controls');
      case'close-voice':
        if(!VoiceUI.open)return done('Voice Controls are not open.','Close voice controls');
        closeVoice();return done('Voice Controls closed.','Close voice controls');
      case'close-settings':
        if(!A11y.open)return done('Accessibility settings are not open.','Close settings');
        closeA11y();return done('Accessibility settings closed.','Close settings');
      case'reset-settings':
        resetSettings();say('All accessibility settings were reset to their defaults.',{kind:'info',force:true});
        return done('All accessibility settings were reset to their defaults.','Reset settings');
      case'set':{
        const key=c.key,name=SETTING_NAMES[key]||key,be=/s$/.test(name)?'are':'is';
        let want=c.value;
        if(want==='toggle')want=!S[key];
        const label=(key==='clickToMove'&&c.inverted)?'Dragging':(key==='untimed'&&c.inverted)?'The game clock':name;
        const shown=(key==='clickToMove'&&c.inverted)?!S.clickToMove:(key==='untimed'&&c.inverted)?!S.untimed:S[key];
        const lbe=(label==='Dragging'||label==='The game clock')?'is':be;
        if(!!S[key]===!!want){const m=`${label} ${lbe} already ${shown?'on':'off'}.`;say(m,{kind:'info',force:true});return done(m,`${want?'Enable':'Disable'} ${name}`)}
        toggleSetting(key);
        const now=(key==='clickToMove'&&c.inverted)?!S.clickToMove:(key==='untimed'&&c.inverted)?!S.untimed:S[key];
        return done(`${label} ${lbe} now ${now?'on':'off'}.`,`${want?'Enable':'Disable'} ${name}`);
      }
      case'size':{
        if(!c.key)return fail('Say “increase text size” or “increase board size”.');
        const key=c.key,min=key==='textSize'?100:60,max=key==='textSize'?160:200,cur=S[key];
        const nv=Math.max(min,Math.min(max,cur+(c.dir>0?10:-10)));
        const name=key==='textSize'?'Text size':'Board size';
        if(nv===cur){const m=`${name} is already at its ${c.dir>0?'maximum':'minimum'}: ${cur} percent.`;say(m,{kind:'info',force:true});return done(m,`${c.dir>0?'Increase':'Decrease'} ${name.toLowerCase()}`)}
        setSetting(key,nv);
        const m=`${name} is now ${nv} percent.`;say(m,{kind:'info',force:true});
        return done(m,`${c.dir>0?'Increase':'Decrease'} ${name.toLowerCase()}`);
      }
    }
    switch(c.intent){
      case'where':return VoiceNav.describe();
      case'list':return VoiceNav.list(false);
      case'more':return VoiceNav.list(true);
      case'headings':return VoiceNav.headings();
      case'ctl-next':return VoiceNav.step(1);
      case'ctl-prev':return VoiceNav.step(-1);
      case'activate':return VoiceNav.activateFocused();
      case'click':return VoiceNav.click(c.phrase,c.whole);
      case'sidebar':
        if(Dlg.isOpen())Dlg.close();
        sidebarAction(c.act);return done(`Opened ${ACT_NAMES[c.act]}.`,`Go to ${ACT_NAMES[c.act]}`);
      case'search':{
        if(Dlg.isOpen())Dlg.close();
        openSearch();
        const inp=$('#srchIn');if(inp){inp.value=c.query;inp.dispatchEvent(new Event('input',{bubbles:true}))}
        const hits=$$('#srchList button').map(b=>b.querySelector('b').textContent);
        const m=hits.length?`Search results for “${c.query}”: ${joinList(hits)}. Say the name to open one.`:`No results for “${c.query}”. Try “puzzles”, “contrast” or “review”.`;
        say(m,{kind:'cmd'});return done(m,`Search ${c.query}`);
      }
      case'scroll':
        window.scrollBy({top:c.dir*Math.round(innerHeight*0.8),behavior:S.reduceMotion?'auto':'smooth'});
        return done(c.dir>0?'Scrolled down.':'Scrolled up.',c.dir>0?'Scroll down':'Scroll up');
      case'scroll-end':
        window.scrollTo({top:c.dir>0?document.documentElement.scrollHeight:0,behavior:S.reduceMotion?'auto':'smooth'});
        return done(c.dir>0?'Moved to the bottom of the page.':'Moved to the top of the page.','Scroll to end');
      case'back':{
        if(history.length>1){history.back();return done('Going back to the previous screen.','Go back')}
        return fail('There is no previous screen to go back to.');
      }
      case'close':{
        if(Dlg.isOpen()){Dlg.dismiss();return done('Dialog closed.','Close')}
        if(A11y.open){closeA11y();return done('Accessibility settings closed.','Close')}
        if(VoiceUI.open){closeVoice();return done('Voice Controls closed.','Close')}
        const w=$('#welOk');if(w){w.click();return done('Welcome message closed.','Close')}
        return done('There is nothing open to close.','Close');
      }
    }
    // ---- commands that need a board
    if(!isGame&&!isRev){
      return fail('There is no chessboard on this screen. Open Playing, Puzzles or Game Review first — or say “open puzzles”.');
    }
    const und=t=>t;
    switch(c.intent){
      case'board':return done(C.readBoard(),'Read the board');
      case'turn':return done(C.turn(),'Whose turn');
      case'last':return done(C.lastMove()||'No moves have been played yet.','Read last move');
      case'describe':return done(C.describe(c.sq),`What is on ${c.sq}`);
      case'square':
        if(isRev){return done(C.describe(c.sq),`What is on ${c.sq}`)}
        return this.doSelect(c.sq,true);
      case'cursor':{
        const [r,f]=sqp(c.sq);C.board.setCursor(r,f,true);if(!S.screenReader)C.describe?C.describe(c.sq):0;
        return done(`Moved the keyboard cursor to ${c.sq}.`,`Go to ${c.sq}`);
      }
    }
    if(isRev){
      switch(c.intent){
        case'next':C.go(C.i+1);return done('Next move.','Next move');
        case'prev':C.go(C.i-1);return done('Previous move.','Previous move');
        case'rv-first':C.go(0);return done('First position.','First position');
        case'rv-last':C.go(C.n);return done('Last position.','Last position');
        case'legal':return fail('Legal moves are not available in the review — the board is read-only. Use “next move” and “previous move”.');
        case'cancel':return done('Nothing is selected in review mode.','Cancel');
        case'hint':return fail('Hints are only available in puzzles.');
        default:return fail('That command is not available while reviewing a game. Try “next move”, “previous move”, “read the board” or “what is on e4”.');
      }
    }
    // ---- game board commands
    switch(c.intent){
      case'next':C.goto(C.idx+1);return done('Next position.','Next move');
      case'prev':C.goto(C.idx-1);return done('Previous position.','Previous move');
      case'rv-first':C.goto(0);return done('First position.','First position');
      case'rv-last':C.goto(C.latest);return done('Latest position.','Latest position');
      case'legal':{
        if(c.sq){const t=C.legalMoves(c.sq);return done(t||'Read legal moves.',`Legal moves for ${c.sq}`)}
        const t=C.legalMoves();return done(t||'Read legal moves.','Read legal moves');
      }
      case'select':return this.doSelect(c.sq,false);
      case'cancel':{
        const had=!!C.sel;C.cancel('voice');
        return had?done('Selection cancelled. No move was played.','Cancel selection'):{ok:true,msg:'Nothing was selected. To take back a completed move say “undo”.',understood:'Cancel selection'};
      }
      case'undo':{
        if(!C.game.moves.length){say('There are no moves to undo.',{kind:'alert'});return {ok:false,msg:'There are no moves to undo.',understood:'Undo last move'}}
        {const asked=confirmAction({title:'Undo your last move?',message:'This takes back a completed move'+(C.opponent?' and the opponent’s reply':'')+'. It is different from cancelling a selection.',confirmLabel:'Undo move',
          onConfirm:()=>C.undo()});
        return asked?{ok:true,confirm:true,msg:'Waiting for confirmation: undo the last move. Say “confirm” or “cancel”.',understood:'Undo last move'}:{ok:true,msg:'Last move undone.',understood:'Undo last move'}}
      }
      case'flip':
        if(!C.board)return fail('There is no board to flip on this screen.');
        C.board.setFlipped(!C.board.flipped);
        return done(`Board flipped. ${C.board.flipped?'Black':'White'} is now at the bottom.`,'Flip board');
      case'next-puzzle':{
        const nb=$('.js-next');
        if(!C.puzzle||!nb)return fail('Next puzzle is only available on the Puzzles screen.');
        nb.click();return done('Next puzzle.','Next puzzle');
      }
      case'hint':
        if(!C.puzzle)return fail('Hints are only available on the puzzle screen.');
        C.hint();return done('Hint given.','Hint');
      case'draw':
        if(C.puzzle||K==='menu')return fail('Draw offers are only available in a game on the Playing screen.');
        if(C.game.status().over)return fail('The game is already over.');
        {const asked=confirmAction({title:'Offer a draw?',message:'The draw offer goes to the simulated opponent (there is no real opponent connection).',confirmLabel:'Offer draw',onConfirm:()=>C.offerDraw()});
        return asked?{ok:true,confirm:true,msg:'Waiting for confirmation: offer a draw. Say “confirm” or “cancel”.',understood:'Offer draw'}:{ok:true,msg:'Draw offered to the simulated opponent.',understood:'Offer draw'}}
      case'resign':
        if(C.puzzle||K==='menu')return fail('Resigning is only available in a game on the Playing screen.');
        if(C.game.status().over)return fail('The game is already over.');
        confirmAction({title:'Resign this game?',message:'Resigning ends the game and counts as a loss. This cannot be undone.',confirmLabel:'Resign',danger:true,always:true,onConfirm:()=>C.resign()});
        return {ok:true,confirm:true,msg:'Waiting for confirmation: resign. Say “confirm” or “cancel”.',understood:'Resign'};
      case'reset':
        {const asked=confirmAction({title:C.puzzle?'Try this puzzle again?':'Start a new game?',message:C.puzzle?'The puzzle position will be restored.':'The current game and its move history will be cleared.',confirmLabel:C.puzzle?'Try again':'New game',onConfirm:()=>C.puzzle?C.resetPuzzle():C.reset()});
        return asked?{ok:true,confirm:true,msg:'Waiting for confirmation: start over. Say “confirm” or “cancel”.',understood:'New game'}:{ok:true,msg:C.puzzle?'Puzzle reset.':'New game started.',understood:'New game'}}
      case'castle':{
        if(!C.atLatest||C.game.status().over||!C.canMove())return fail(C.game.status().over?'The game is over.':'You cannot castle right now.');
        const kp=kingPos(C.game.s.g,C.game.turn);
        const cand=C.game.legal(kp[0],kp[1]).filter(m=>m.castle===c.side);
        if(!cand.length)return fail(`Castling ${c.side==='K'?'kingside':'queenside'} is not legal in this position.`);
        return this.doMove(cand[0].from,cand[0].to,null,`Castle ${c.side==='K'?'kingside':'queenside'}`);
      }
      case'move':{
        const from=sqp(c.from),to=sqp(c.to);
        return this.doMove(from,to,c.promo,`Move ${c.from} to ${c.to}`+(c.promo?`, promote to ${NAMES[c.promo]}`:''));
      }
      case'piece':{
        if(!C.atLatest||C.game.status().over||!C.canMove())return fail(C.game.status().over?'The game is over.':(C.atLatest?`It is ${cname(C.game.turn)}'s turn.`:'Return to the latest position first.'));
        const to=sqp(c.to);
        let cand=C.game.legal().filter(m=>m.p===c.piece&&eqSq(m.to,to));
        if(c.from)cand=cand.filter(m=>sqn(...m.from)===c.from);
        const froms=[...new Set(cand.map(m=>sqn(...m.from)))];
        if(!froms.length){
          const mine=C.game.s.g.flat().some(p=>p&&p.t===c.piece&&p.c===C.game.turn);
          return fail(mine?`No ${cname(C.game.turn).toLowerCase()} ${NAMES[c.piece]} can legally move to ${c.to}.`:`You have no ${NAMES[c.piece]} on the board.`,`${cap1(NAMES[c.piece])} to ${c.to}`);
        }
        if(froms.length>1){
          this.pending={kind:'clarify',to:c.to,promo:c.promo,options:froms.map(f=>({from:f,piece:NAMES[c.piece]}))};
          const msg=`${froms.length} ${PLURAL[c.piece]} can move to ${c.to}: from ${joinList(froms)}. Which one? Say its starting square.`;
          say(msg,{kind:'alert',urgent:true});
          return {ok:false,msg,understood:`${cap1(NAMES[c.piece])} to ${c.to} (ambiguous)`};
        }
        return this.doMove(sqp(froms[0]),to,c.promo,`${cap1(NAMES[c.piece])} from ${froms[0]} to ${c.to}`);
      }
    }
    return fail(`Sorry, I could not apply “${raw}” here.`);
  },
  doSelect(sq,viaSquare){
    const C=Ctx.ctrl,[r,f]=sqp(sq);
    if(viaSquare&&C.sel){
      // a lone square while a piece is selected means "move there" if legal, otherwise describe
      const ok=C.game.legal(C.sel[0],C.sel[1]).some(m=>eqSq(m.to,[r,f]));
      if(ok)return this.doMove(C.sel,[r,f],null,`Move ${sqn(...C.sel)} to ${sq}`);
    }
    const ok=C.select(r,f);
    return ok?{ok:true,msg:`Selected ${sq}. Say a destination square, or “cancel selection”.`,understood:`Select ${sq}`}
             :{ok:false,msg:C.lastError||`Could not select ${sq}.`,understood:`Select ${sq}`};
  },
  doMove(from,to,promo,und){
    const C=Ctx.ctrl;
    const res=C.move(from,to,promo,'voice');
    if(res==='ask')return {ok:true,confirm:true,msg:'Promotion: choose queen, rook, bishop or knight in the dialog, or say the piece.',understood:und};
    if(res){
      const last=C.game.moves[C.game.moves.length-1];
      if(C.puzzle&&C.solved)return {ok:true,msg:`Correct! ${last?last.san:''} solves the puzzle.`,understood:und};
      if(C.puzzle&&C.lastError)return {ok:false,msg:`${C.lastError} The move was taken back — try again.`,understood:und};
      return {ok:true,msg:`Move completed. ${last?moveWords(last,S.verbosity==='minimal'?'standard':S.verbosity):''}`,understood:und};
    }
    return {ok:false,msg:C.lastError||'That move is not legal.',understood:und};
  }
};

/* =====================================================================
   VoiceNav — operate the whole interface by voice (not only the board)
   ===================================================================== */
const NUMW={zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,first:1,second:2,third:3,fourth:4,fifth:5,sixth:6};
const NAV_MAP=[
  [/\b(play menu|play page)\b/,'screen:menu'],
  [/\b(playing|current game|game board|the game|my game|chessboard)\b/,'screen:play'],
  [/\bplay chess\b/,'screen:play'],
  [/\b(home|dashboard|start page|main page)\b/,'screen:home'],
  [/\bpuzzles?\b/,'screen:puzzle'],
  [/\b(game review|review|analysis|game history|history|past games|my games)\b/,'screen:review'],
  [/\b(learn|lessons?)\b/,'act:learn'],
  [/\btournaments?\b/,'act:tournaments'],
  [/\b(chess variants|variants)\b/,'act:variants'],
  [/\b(free trial|trial|premium)\b/,'act:trial'],
  [/\bsearch\b/,'act:search'],
  [/\b(profile|my profile|account)\b/,'act:profile'],
  [/\bfriends\b/,'act:friends'],
  [/\b(messages?|inbox|mail)\b/,'act:mail'],
  [/\b(notifications?|alerts)\b/,'act:bell'],
  [/\bplay\b/,'screen:menu']
];
const ACT_NAMES={learn:'Learn',tournaments:'Tournaments',variants:'Chess Variants',trial:'Free Trial',search:'Search',profile:'Profile',friends:'Friends',mail:'Messages',bell:'Notifications'};
const SCREEN_NAMES={home:'Home',play:'Playing',puzzle:'Puzzles',review:'Game Review',menu:'Play menu'};
const VoiceNav={
  paging:{items:[],i:0},
  norm(s){
    return String(s||'').toLowerCase()
      .replace(/[✔✖⚠×✕►▶◀…“”"]/g,' ')
      .replace(/\balt\s*\+\s*shift\s*\+\s*[a-z]\b/g,' ')
      .replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten)\b/g,w=>String(NUMW[w]))
      .replace(/\bminutes?\b/g,'min').replace(/\bdays?\b/g,'days')
      .replace(/\b(button|link|tab|switch|checkbox|icon|control|controls)\b/g,' ')
      .replace(/[^a-z0-9 ]+/g,' ')
      .replace(/\b(the|a|an|please|to|on|of|my)\b/g,' ')
      .replace(/\s+/g,' ').trim();
  },
  roleOf(el){
    const r=el.getAttribute('role');
    if(r==='switch')return 'switch';
    if(r==='tab')return 'tab';
    if(el.tagName==='A')return 'link';
    if(el.tagName==='SELECT')return 'drop-down list';
    if(el.tagName==='INPUT'){return el.type==='range'?'slider':'text box'}
    return 'button';
  },
  stateOf(el){
    const c=el.getAttribute('aria-checked'),p=el.getAttribute('aria-pressed'),x=el.getAttribute('aria-expanded'),sel=el.getAttribute('aria-selected');
    if(c!=null)return c==='true'?'on':'off';
    if(p!=null)return p==='true'?'on':'off';
    if(x!=null)return x==='true'?'expanded':'collapsed';
    if(sel==='true')return 'selected';
    if(el.getAttribute('aria-current'))return 'current';
    return '';
  },
  controls(){
    const roots=Dlg.isOpen()?[Dlg.el]:[$('#protobar'),$('#sidebar'),$('#main'),$('#a11y'),$('#voicePanel')].filter(Boolean);
    const seen=new Set(),out=[];
    for(const root of roots){
      if(root.hidden)continue;
      root.querySelectorAll('button,a[href],[role=switch],[role=tab],select,input:not([type=hidden])').forEach(el=>{
        if(seen.has(el)||el.closest('.skiplinks')||el.closest('[hidden]')||el.closest('[aria-hidden=true]')||el.closest('.board'))return;
        const r=el.getBoundingClientRect();if(!r.width||!r.height)return;
        const cs=getComputedStyle(el);if(cs.visibility==='hidden'||cs.display==='none')return;
        seen.add(el);
        const aria=(el.getAttribute('aria-label')||'').trim();
        const lb=el.getAttribute('aria-labelledby');let lt='';
        if(lb){const t=document.getElementById(lb.split(' ')[0]);lt=t?t.textContent.trim():''}
        const lab=el.labels&&el.labels[0]?el.labels[0].textContent.trim():'';
        const txt=(el.textContent||'').replace(/\s+/g,' ').trim();
        const display=(aria||lt||lab||txt||el.placeholder||'').replace(/Alt\+Shift\+[A-Z]/g,'').replace(/,?\s*shortcut Alt plus Shift plus [A-Z]/gi,'').replace(/\s+/g,' ').trim();
        if(!display)return;
        const names=[aria,lt,lab,txt,el.placeholder].filter(Boolean).map(x=>this.norm(x)).filter(Boolean);
        out.push({el,name:display,names,role:this.roleOf(el)});
      });
    }
    return out;
  },
  match(phrase,list,strict){
    const q=this.norm(phrase);if(!q)return [];
    const words=q.split(' ');
    let m=list.filter(c=>c.names.some(n=>n===q));
    if(m.length)return m;
    m=list.filter(c=>c.names.some(n=>n.startsWith(q)));
    if(m.length)return m;
    m=list.filter(c=>c.names.some(n=>{const nw=n.split(' ');return words.every(w=>nw.includes(w))}));
    if(m.length)return m;
    if(strict)return [];
    return list.filter(c=>c.names.some(n=>n.includes(q)));
  },
  fail(msg,und){say(msg,{kind:'alert',urgent:true});return {ok:false,msg,understood:und||''}},
  click(phrase,whole){
    const list=this.controls();
    let ms=this.match(phrase,list);
    if(!ms.length&&whole&&whole!==phrase)ms=this.match(whole,list);
    if(!ms.length)return this.fail(`I could not find a control called “${phrase}” on this screen. Say “list controls” to hear what is available.`,`Press ${phrase}`);
    if(ms.length>1){
      const opts=ms.slice(0,6);
      Voice.pending={kind:'ui',options:opts};
      const msg=`${ms.length} controls match “${phrase}”: ${opts.map((o,i)=>`${i+1}, ${o.name}`).join('; ')}. Say the number.`;
      say(msg,{kind:'alert',urgent:true});
      return {ok:false,msg,understood:`Press ${phrase} (ambiguous)`};
    }
    return this.press(ms[0].el);
  },
  direct(raw){
    // used when nothing else understood the phrase: only accept clear matches, never short or numeric fragments
    const q=this.norm(raw);
    if(q.length<4||/^[0-9 ]+$/.test(q))return null;
    const list=this.controls();
    const ms=this.match(raw,list,true);
    if(!ms.length)return null;
    return ms.length===1?this.press(ms[0].el):this.click(raw,raw);
  },
  press(el){
    const c=this.controls().find(x=>x.el===el);
    const name=c?c.name:(el.getAttribute('aria-label')||el.textContent||'control').trim();
    if(el.disabled||el.getAttribute('aria-disabled')==='true')return this.fail(`${name} is not available right now.`,`Press ${name}`);
    if(el.tagName==='SELECT'||(el.tagName==='INPUT'&&!['checkbox','radio','button','submit'].includes(el.type))){
      el.focus();
      const msg=el.type==='range'?`${name} slider focused. Say “increase” or “decrease” with “text size” or “board size”.`:`${name} focused. ${el.tagName==='SELECT'?'Use the arrow keys to choose an option.':'Type, or say a command.'}`;
      say(msg,{kind:'cmd'});return {ok:true,msg,understood:`Focus ${name}`};
    }
    const before=Ann.log.length;
    try{el.focus({preventScroll:false})}catch(e){}
    el.click();
    setTimeout(()=>{if(Ann.log.length===before)say(`${name} activated.`,{kind:'info'})},350);
    return {ok:true,msg:`Pressed ${name}.`,understood:`Press ${name}`};
  },
  describe(){
    const title=(document.title.split(' — ')[0]||'this screen');
    const hs=$$('#main h2').map(h=>h.textContent.replace(/\s+/g,' ').trim()).filter(Boolean).slice(0,7);
    const n=this.controls().length;
    let t=`You are on ${title}.`;
    if(hs.length)t+=` Sections: ${joinList(hs)}.`;
    t+=` ${n} controls are available.`;
    if(Ctx.ctrl)t+=' A chessboard is on this screen; say “read the board”.';
    t+=' Say “list controls” to hear them, “press” followed by a control name to use one, or “go to” followed by Home, Play, Puzzles or Game history.';
    say(t,{kind:'cmd'});return {ok:true,msg:t,understood:'Where am I'};
  },
  list(more){
    if(!more||!this.paging.items.length||this.paging.stale){this.paging={items:this.controls(),i:0}}
    const {items,i}=this.paging;
    if(i>=items.length){const m='That is the end of the list.';say(m,{kind:'cmd'});this.paging.items=[];return {ok:true,msg:m,understood:'More controls'}}
    const slice=items.slice(i,i+8);this.paging.i=i+slice.length;
    const m=`Controls ${i+1} to ${i+slice.length} of ${items.length}: `+slice.map((c,k)=>`${i+k+1}, ${c.name}${c.role!=='button'?` (${c.role})`:''}`).join('; ')+
      (this.paging.i<items.length?'. Say “more” for the next ones.':'. End of list.');
    say(m,{kind:'cmd'});return {ok:true,msg:m,understood:more?'More controls':'List controls'};
  },
  headings(){
    const hs=$$('#main h1,#main h2,#main h3').map(h=>h.textContent.replace(/\s+/g,' ').trim()).filter(Boolean);
    const m=hs.length?`Headings on this screen: ${joinList(hs.slice(0,12))}.`:'There are no headings on this screen.';
    say(m,{kind:'cmd'});return {ok:true,msg:m,understood:'Read headings'};
  },
  step(dir){
    const list=this.controls();
    if(!list.length)return this.fail('There are no controls to move between.');
    let idx=list.findIndex(c=>c.el===document.activeElement||c.el.contains(document.activeElement));
    idx=idx<0?(dir>0?0:list.length-1):(idx+dir+list.length)%list.length;
    const c=list[idx];c.el.focus();
    const st=this.stateOf(c.el);
    const m=`${c.name}, ${c.role}${st?', '+st:''}. ${idx+1} of ${list.length}.`;
    say(m,{kind:'cmd'});return {ok:true,msg:m,understood:dir>0?'Next control':'Previous control'};
  },
  activateFocused(){
    const ae=document.activeElement;
    const c=this.controls().find(x=>x.el===ae);
    if(!c)return this.fail('No control is focused. Say “next control” to move to one, or “press” followed by its name.');
    return this.press(ae);
  }
};
