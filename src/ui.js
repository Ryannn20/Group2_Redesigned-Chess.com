/* =====================================================================
   Shared UI: icons, dialogs, accessibility drawer, toolbar, dock, sidebar
   ===================================================================== */
Object.assign(I,{
  mic:(s=26)=>sv(s,'0 0 26 26','<rect x="9" y="2" width="8" height="14" rx="4" fill="currentColor"/><path d="M5,12C5,17 8.500,20 13,20C17.500,20 21,17 21,12M13,20V24M9,24H17" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round"/>','aria-hidden="true"'),
  access:(s=24)=>sv(s,'0 0 24 24','<circle cx="12" cy="4.500" r="2.500" fill="currentColor"/><path d="M4,8.500C8,10 16,10 20,8.500M12,9.500V14M12,14L8,21M12,14L16,21" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round"/>','aria-hidden="true"'),
  contrast:(s=22)=>sv(s,'0 0 24 24','<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.200"/><path d="M12,3A9,9 0 0 1 12,21Z" fill="currentColor"/>','aria-hidden="true"'),
  ear:(s=22)=>sv(s,'0 0 24 24','<path d="M7,9C7,5.500 9.500,3 12.500,3C16,3 18,5.500 18,8.500C18,12 15,13 14,15.500C13.500,17 13,19 11,19C9.500,19 8.500,18 8.500,16.500" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round"/>','aria-hidden="true"'),
  vib:(s=22)=>sv(s,'0 0 24 24','<rect x="8" y="4" width="8" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2.200"/><path d="M3,8V16M21,8V16" stroke="currentColor" stroke-width="2.200" stroke-linecap="round"/>','aria-hidden="true"'),
  sound:(s=22)=>sv(s,'0 0 24 24','<path d="M3,9H7L12,5V19L7,15H3Z" fill="currentColor"/><path d="M15.500,8.500C17.500,10.500 17.500,13.500 15.500,15.500M18,6C21,9.500 21,14.500 18,18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>','aria-hidden="true"'),
  kbd:(s=22)=>sv(s,'0 0 24 24','<rect x="2" y="6" width="20" height="12" rx="2.500" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6,10H7M10,10H11M14,10H15M18,10H18.500M7,14H17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>','aria-hidden="true"'),
  close:(s=20)=>sv(s,'0 0 20 20','<path d="M4,4L16,16M16,4L4,16" stroke="currentColor" stroke-width="2.600" stroke-linecap="round"/>','aria-hidden="true"'),
  check:(s=16)=>sv(s,'0 0 16 16','<path d="M3,8.500L6.500,12L13,4.500" fill="none" stroke="currentColor" stroke-width="2.600" stroke-linecap="round" stroke-linejoin="round"/>','aria-hidden="true"'),
  undo:(s=20)=>sv(s,'0 0 20 20','<path d="M4,8H12C15,8 17,10 17,13C17,16 15,17 12,17H7M4,8L8,4M4,8L8,12" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round"/>','aria-hidden="true"'),
  restart:(s=20)=>sv(s,'0 0 20 20','<path d="M16,10A6,6 0 1 1 13.500,5M16,3V6.500H12.500" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round"/>','aria-hidden="true"'),
  mailI:(s=26)=>I.mail(s)
});
const ICON_FIX=()=>{};

/* ----- generic dialog ------------------------------------------------ */
const Dlg={el:null,opts:null,opener:null,
  isOpen(){return !!this.el},
  confirmOpen(){return !!this.el&&!!this.opts&&!!this.opts.confirm},
  accept(){const b=this.el&&this.el.querySelector('[data-primary]');if(b)b.click()},
  dismiss(){this.close()},
  close(){
    if(!this.el)return;
    this.el.remove();this.el=null;const o=this.opener;this.opener=null;this.opts=null;
    document.body.classList.remove('has-dlg');
    if(o&&o.isConnected)try{o.focus()}catch(e){}
  }
};
/* remember what was tapped: on touch devices (notably iOS) buttons do not receive focus, so focus return needs this */
let LAST_ACT=null;
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('button,a[href],summary,[role=tab]');if(b)LAST_ACT=b},true);
function activator(){const a=document.activeElement;return(a&&a!==document.body)?a:(LAST_ACT&&LAST_ACT.isConnected?LAST_ACT:null)}
function openDialog(o){
  Dlg.close();
  Dlg.opener=activator();Dlg.opts=o;
  const back=document.createElement('div');back.className='dlg-back';
  const id='dlg'+Date.now();
  const acts=(o.actions||[]);
  back.innerHTML=`<div class="dlg" role="${o.alert?'alertdialog':'dialog'}" aria-modal="true" aria-labelledby="${id}t" aria-describedby="${id}b">
    <h2 id="${id}t">${esc(o.title)}</h2><div class="dlg-body" id="${id}b">${o.body||''}</div>
    <div class="dlg-actions">${o.cancelLabel===false?'':`<button type="button" class="btn" data-cancel>${esc(o.cancelLabel||'Close')}</button>`}
    ${acts.map((a,i)=>`<button type="button" class="btn ${a.primary?'primary':''} ${a.danger?'danger':''}" data-act="${i}" ${a.primary?'data-primary':''}>${esc(a.label)}</button>`).join('')}</div></div>`;
  document.body.appendChild(back);document.body.classList.add('has-dlg');
  Dlg.el=back;
  const dlg=back.firstElementChild;
  const finish=()=>Dlg.close();
  back.addEventListener('click',e=>{
    if(e.target===back){finish();return}
    const c=e.target.closest('button');if(!c)return;
    if(c.hasAttribute('data-cancel')){finish();o.onCancel&&o.onCancel();return}
    if(c.dataset.act!==undefined){const a=acts[+c.dataset.act];if(!a.keepOpen)finish();a.onClick&&a.onClick()}
  });
  back.addEventListener('keydown',e=>{
    if(e.key==='Escape'){e.stopPropagation();finish();o.onCancel&&o.onCancel();return}
    if(e.key==='Tab'){
      const f=$$('button,input,[href],select,[tabindex]:not([tabindex="-1"])',dlg).filter(x=>!x.disabled&&x.offsetParent!==null);
      if(!f.length)return;
      const first=f[0],last=f[f.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
    }
  });
  const plain=o.title+'. '+(o.body||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  say(plain,{kind:'alert',urgent:!!o.alert,live:false});
  const initial=dlg.querySelector(o.danger?'[data-cancel]':'[data-primary]')||dlg.querySelector('button,input');
  setTimeout(()=>initial&&initial.focus(),0);
  return dlg;
}
/* returns true when a confirmation dialog was shown, false when the action ran straight away.
   Resignation and low-confidence voice commands pass always:true and are never skipped. */
function confirmAction({title,message,confirmLabel,danger,onConfirm,always}){
  if(!always&&!S.confirmActions){onConfirm&&onConfirm();return false}
  openDialog({title,alert:true,confirm:true,danger,cancelLabel:'Cancel',
    body:`<p>${esc(message)}</p><p class="dlg-hint">You can also say or type “confirm” or “cancel”.</p>`,
    actions:[{label:confirmLabel||'Confirm',primary:true,danger,onClick:onConfirm}]});
  return true;
}
function infoDialog(title,html,actions){
  openDialog({title,body:html,actions:actions||[]});
}
function outsideScope(title,what){
  infoDialog(title,`<p>${esc(what)}</p><p class="dlg-hint">This section is outside the five redesigned prototype screens (Home, Playing, Game Review, Puzzles, Play menu). It is shown here so the navigation structure stays familiar.</p>`,
    [{label:'Go to Play menu',primary:true,onClick:()=>navigate('menu')}]);
}
const VOICE_HELP=[
  ['On the board',['Select e2','Move e2 to e4','Knight to f3','Castle kingside','Cancel selection','Undo my last move','Read the board','Read legal moves','Whose turn is it','Describe e4']],
  ['In a game',['Previous move','Next move','First position','Last position','Flip the board','Offer a draw','Resign (always asks you to confirm)']],
  ['Puzzles',['Hint','Try again','Next puzzle','Read the puzzle']],
  ['Moving around AcChess',['Go to home','Go to puzzles','Go to game review','Go to play menu','Go back','What can I do here','List controls','Scroll down']],
  ['Settings',['Open accessibility settings','Enable high contrast','Increase text size','Turn off sound','Turn on screen reader mode','Reset settings']]
];
const KEY_HELP=[
  ['Arrow keys','Move between squares (Home / End: first / last file)'],
  ['Enter','Select a piece, then press again on a highlighted square to move'],
  ['Space','Push-to-talk: press, wait for “Listening”, then say your move (board or page focused). Turn it off in Settings to make Space act like Enter.'],
  ['Esc','Cancel the current selection (does not undo a move) or close a dialog'],
  ['R','Read the whole board'],['T','Whose turn is it'],['L','Read the last move'],
  ['M','Read legal moves for the selected piece (or the square under the cursor)'],['D','Describe the square under the cursor'],
  ['H','Puzzle hint'],['Page Up / Page Down','Previous / next move in history or review'],['?','Show this help'],
  ['Alt + Shift + A','Open or close Accessibility Settings (any screen)'],['Alt + Shift + V','Open or close Voice Controls (any screen)']
];
function helpBodyHTML(){
  return `<p class="dlg-hint">Open this help any time with the <b>Help</b> button at the top of the screen.</p>
   <section aria-labelledby="hp1"><h3 id="hp1">Getting started</h3>
    <ul class="welcome-list">${WELCOME_ITEMS.map(([k,a,b])=>`<li class="w-${k}"><b>${a}</b> ${b}</li>`).join('')}</ul></section>
   <section aria-labelledby="hp2"><h3 id="hp2">Keyboard shortcuts</h3>
    <table class="keys"><tbody>${KEY_HELP.map(([k,v])=>`<tr><th scope="row">${k}</th><td>${v}</td></tr>`).join('')}</tbody></table>
    <p class="dlg-hint">If a shortcut clashes with your screen reader, use the always-visible “Accessibility Settings” and “Voice Controls” buttons at the top of every screen.</p></section>
   <section aria-labelledby="hp3"><h3 id="hp3">Voice and typed commands</h3>
    <p>Press the microphone in Voice Controls and say <b>one</b> command, or type it. Say the words naturally; you do not need to memorise them.</p>
    ${VOICE_HELP.map(([t,l])=>`<h4>${t}</h4><ul class="cmds">${l.map(x=>`<li>“${x}”</li>`).join('')}</ul>`).join('')}</section>
   <section aria-labelledby="hp4"><h3 id="hp4">Touch and mouse</h3>
    <p>Tap or click a piece, then a highlighted square. Dragging is optional and off by default. Use <b>Cancel selection</b> to change your mind and <b>Undo last move</b> to take a move back.</p></section>
   <p class="dlg-hint">AcChess is a proposed academic prototype. The opponent is simulated and nothing connects to Chess.com.</p>`;
}
function showHelp(section){
  const dlg=openDialog({title:'Help, keys and commands',body:`<div class="help-body">${helpBodyHTML()}</div>`,
    actions:[{label:'Show welcome tips on Home again',onClick:()=>{Store.del('acchess.welcome');say('Welcome tips will show on Home.',{kind:'info',force:true});if(CURRENT==='home')route(false)}}]});
  if(section){setTimeout(()=>{const h=$('#'+({keys:'hp2',voice:'hp3'}[section]||'hp1'),dlg);if(h){h.scrollIntoView({block:'start'});h.setAttribute('tabindex','-1');h.focus({preventScroll:true})}},60)}
}
function showKeyHelp(){showHelp('keys')}
function openSearch(){
  const items=[
    ['Home','Dashboard',()=>navigate('home')],['Play menu','Play Chess options',()=>navigate('menu')],['Playing','Chess game board',()=>navigate('play')],
    ['Puzzles','Solve a demonstration puzzle',()=>navigate('puzzle')],['Game review','Review a sample game',()=>navigate('review')],
    ['Accessibility settings','Vision, nonvisual, input and audio options',()=>openA11y()],
    ['Open voice controls','Microphone and typed commands',()=>openVoice()],
    ['Help and instructions','Welcome and navigation methods',()=>showHelp()],
    ['Toggle high contrast','Switch the high-contrast theme',()=>toggleSetting('contrast')],
    ['Toggle screen reader mode','Square announcements while moving',()=>toggleSetting('screenReader')],
    ['Keyboard shortcuts','List of board keys',()=>showKeyHelp()],
    ['Voice commands','Examples you can say or type',()=>showHelp('voice')]
  ];
  const dlg=openDialog({title:'Search AcChess',cancelLabel:'Close',
    body:`<label class="fld"><span>Search screens and settings</span><input id="srchIn" type="search" autocomplete="off" placeholder="e.g. puzzles, contrast"></label><ul class="srch" id="srchList"></ul>`});
  const list=$('#srchList',dlg),inp=$('#srchIn',dlg);
  const draw=()=>{
    const q=inp.value.trim().toLowerCase();
    const hits=items.filter(i=>!q||(i[0]+' '+i[1]).toLowerCase().includes(q));
    list.innerHTML=hits.length?hits.map((h,i)=>`<li><button type="button" class="btn" data-i="${items.indexOf(h)}"><b>${esc(h[0])}</b><small>${esc(h[1])}</small></button></li>`).join(''):'<li class="muted">No matches. Try “puzzles”, “contrast” or “review”.</li>';
  };
  draw();inp.focus();
  inp.addEventListener('input',draw);
  inp.addEventListener('keydown',e=>{if(e.key==='Enter'){const b=list.querySelector('button');if(b)b.click()}});
  list.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;Dlg.close();items[+b.dataset.i][2]()});
}

/* ----- settings helpers ---------------------------------------------- */
const SETTING_NAMES={screenReader:'Screen reader mode',voice:'Voice control',keyboardNav:'Keyboard board navigation',contrast:'High contrast',
  strongFocus:'Strong focus indicators',markers:'Move indicators',reduceMotion:'Reduced motion',sound:'Sound effects',speech:'Spoken game announcements',
  speakBoard:'Spoken board descriptions',haptic:'Haptic feedback',clickToMove:'Click-to-move mode',largeTargets:'Larger interactive targets',
  confirmActions:'Confirmation for consequential actions',untimed:'Untimed play',continuousListen:'Continuous listening',
  spaceTalk:'Spacebar push-to-talk',lowTime:'Low-time warning'};
function toggleSetting(k){
  const v=!S[k];
  if(k==='contrast'){
    setSetting('contrast',v);
    setSetting('boardTheme',v?'hc':(S.boardTheme==='hc'?'classic':S.boardTheme));
    setSetting('pieceTheme',v?'hc':(S.pieceTheme==='hc'?'classic':S.pieceTheme));
  }else setSetting(k,v);
  if(k==='voice'&&!v)Voice.stop();
  if(k==='continuousListen'&&!v&&(Voice.listening||Voice.contSession))Voice.stop(true);
  let extra='';
  if(k==='screenReader'&&v)extra=' Square descriptions are announced as you move around the board. Press question mark for keyboard help.';
  if((k==='speech'||k==='speakBoard')&&v&&!speechSupported())extra=' Speech synthesis is not supported in this browser, so announcements stay as text.';
  if(k==='haptic'&&v&&!Haptics.supported())extra=' Vibration is not supported on this device, so a visual demonstration is shown instead.';
  if(k==='continuousListen'&&v)extra=' Press the microphone once; it then stays on for several commands until you say stop listening, turn this off, or 5 minutes pass without a command.';
  if(k==='clickToMove')extra=v?' Pieces move by clicking the piece, then the destination. Dragging is off.':' Dragging pieces is now available in addition to clicking.';
  if(k==='confirmActions'&&!v)extra=' Resignation will still always ask for confirmation.';
  say(`${SETTING_NAMES[k]} ${v?'on':'off'}.${extra}`,{kind:'info',force:true});
  if(v&&k==='sound')fx('select');
  if(v&&k==='haptic')fx('select');
}
/* toolbar/quick-access "Speech" button controls both spoken-announcement settings together */
function toggleToolbarSetting(k){
  if(k==='speech'){
    const v=!(S.speech||S.speakBoard);
    setSetting('speech',v);setSetting('speakBoard',v);
    say(`Spoken announcements and board descriptions ${v?'on':'off'}.${v&&!speechSupported()?' Speech synthesis is not supported in this browser, so announcements stay as text.':''}`,{kind:'info',force:true});
    return;
  }
  toggleSetting(k);
}
const settingOn=k=>k==='speech'?!!(S.speech||S.speakBoard):!!S[k];
function switchHTML(key,label,desc,extraHTML=''){
  const on=!!S[key],id='sw-'+key;
  return `<div class="srow"><div class="slab"><span id="${id}-l">${esc(label)}</span><small id="${id}-d">${esc(desc)}</small>${extraHTML}</div>
    <button type="button" role="switch" class="sw" aria-checked="${on}" aria-labelledby="${id}-l" aria-describedby="${id}-d" data-sw="${key}">
      <span class="knob" aria-hidden="true"></span><span class="st">${on?I.check(13)+' On':'Off'}</span></button></div>`;
}
function rangeHTML(key,label,min,max,step,unit,desc){
  const id='rg-'+key;
  return `<div class="srow col"><div class="slab"><label for="${id}">${esc(label)}</label><small id="${id}-d">${esc(desc)}</small></div>
    <div class="rng"><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${S[key]}" aria-describedby="${id}-d" data-rg="${key}" data-unit="${unit}"><output for="${id}" id="${id}-o">${S[key]}${unit}</output></div></div>`;
}
function selectHTML(key,label,opts,desc){
  const id='sel-'+key;
  return `<div class="srow col"><div class="slab"><label for="${id}">${esc(label)}</label><small id="${id}-d">${esc(desc||'')}</small></div>
    <select id="${id}" data-sel="${key}" aria-describedby="${id}-d">${opts.map(([v,l])=>`<option value="${v}" ${String(S[key])===String(v)?'selected':''}>${esc(l)}</option>`).join('')}</select></div>`;
}
function a11yHTML(){
  const hap=Haptics.supported();
  return `
  <div class="a11y-h"><div><h2 id="a11yT">${I.access(22)} Accessibility settings</h2>
    <p>Changes apply at once and are ${Store.persistent?'saved in this browser':'kept until you close this tab (your browser blocks saving)'}. Nothing here needs a microphone, sound or vibration.</p></div>
    <button type="button" class="btn icon" data-a11y-close aria-label="Close accessibility settings">${I.close(18)}</button></div>
  <div class="a11y-body">
   <section aria-labelledby="s1"><h3 id="s1">Vision</h3>
    ${switchHTML('contrast','High contrast','Black and white theme with thick borders, bold pieces and a patterned board.')}
    ${rangeHTML('textSize','Text size',100,160,5,'%','Scales interface text.')}
    ${rangeHTML('boardSize','Board size',60,200,5,'%','Scales the chessboard, up to the width of your screen. Above 130% the side panels move below the board.')}
    ${selectHTML('boardTheme','Board theme',[['classic','Classic green and cream'],['hc','High contrast black and white'],['cb','Colour-blind safe blue and sand']],'The familiar green board is the default.')}
    ${selectHTML('pieceTheme','Piece theme',[['classic','Classic pieces'],['hc','High-contrast bold pieces'],['letters','Classic pieces with letter labels (K Q R B N P)']],'Letter labels help tell pieces apart without relying on shape.')}
    ${switchHTML('strongFocus','Strong focus indicators','Thicker, double-ring outline around the focused control or square.')}
    ${switchHTML('markers','Move indicators','Selected, legal-move, capture, check and last-move squares use shapes, patterns and text labels, not colour alone.')}
    ${switchHTML('reduceMotion','Reduced motion','Turns off animations and shortens delays.')}
   </section>
   <section aria-labelledby="s2"><h3 id="s2">Nonvisual Access</h3>
    ${switchHTML('screenReader','Screen-reader compatibility mode','Announces each square as you move around the board and keeps the transcript visible. Works alongside your own screen reader.')}
    ${switchHTML('speakBoard',speechSupported()?'Spoken board descriptions':'Spoken board descriptions (not supported here)','Speaks square descriptions, board readings and answers to your questions using your browser’s speech synthesis.',
      `<button type="button" class="btn sm" data-test="speech">Test speech</button>`)}
    ${switchHTML('speech',speechSupported()?'Spoken game announcements':'Spoken game announcements (not supported here)','Speaks moves, check, results and error messages. A text transcript is always shown.')}
    ${rangeHTML('rate','Speech rate',0.6,3,0.1,'×','Applies to all spoken output (0.6× slow to 3× very fast).')}
    ${selectHTML('verbosity','Announcement verbosity',[['minimal','Minimal — notation only'],['standard','Standard'],['detailed','Detailed — includes legal moves and side to move']],'How much each move and selection says.')}
   </section>
   <section aria-labelledby="s3"><h3 id="s3">Input and Motor Accessibility</h3>
    ${switchHTML('voice','Voice control','Marks the microphone as in use. The microphone only starts when you press it, and typed commands always work.',
      `<button type="button" class="btn sm" data-open-voice>Open Voice Controls</button>`)}
    ${switchHTML('continuousListen','Continuous listening (optional)','One microphone session stays open for many commands, so the browser asks for permission only once. Speech that is not a command is ignored. Turns off after 5 minutes of silence, or say “stop listening”. Off by default.')}
    ${switchHTML('spaceTalk','Spacebar push-to-talk','Press the spacebar (with the board or page focused), wait for “Listening”, then say your move. When on, use Enter to select squares.')}
    ${switchHTML('keyboardNav','Keyboard navigation','Arrow keys move between squares. When off, Tab moves through every square instead.')}
    ${switchHTML('clickToMove','Click-to-move mode','Move by clicking or tapping the piece, then the destination. Turn off to also allow dragging pieces.')}
    ${switchHTML('largeTargets','Larger interactive targets','Bigger buttons and more spacing, so precise pointer movements are not needed.')}
    ${switchHTML('confirmActions','Confirm consequential actions','Asks before draw offers, undo and new game. Resignation always asks, even when this is off.')}
    ${switchHTML('untimed','Untimed play','Turns off the game clocks so there is no time limit.')}
   </section>
   <section aria-labelledby="s4"><h3 id="s4">Audio and Haptics</h3>
    ${switchHTML('sound','Sound effects','Short tones for select, move, opponent move, illegal move, check and checkmate. Never plays on page load.',
      `<button type="button" class="btn sm" data-test="sound">Test sound</button>`)}
    ${rangeHTML('volume','Volume',0,100,5,'%','Loudness of sound effects and spoken output (where your browser supports it).')}
    ${switchHTML('haptic','Haptic feedback','Vibration patterns for each chess event on devices that support it.',
      `<button type="button" class="btn sm" data-test="haptic">Test haptic feedback</button>`)}
    <p class="note" id="hapNote">Vibration API: <b>${hap?'available on this device':'not available on this device'}</b>${hap?'':' — a visual demonstration is shown instead and nothing is claimed to vibrate.'}</p>
    ${switchHTML('lowTime','Low-time warning','When a clock runs low: a red LOW TIME marker, a spoken/live announcement, an alarm sound (if sound is on) and a vibration (if haptics are on). Never active in untimed play.',
      `<button type="button" class="btn sm" data-test="lowtime">Test low-time warning</button>`)}
    ${selectHTML('lowTimeAt','Warn me when this much time is left',[['120','2 minutes'],['60','1 minute'],['30','30 seconds'],['20','20 seconds'],['10','10 seconds']],'The final 10 seconds also tick once per second (sound on).')}
   </section>
  </div>
  <footer class="a11y-f"><button type="button" class="btn" data-reset>Reset all to defaults</button><button type="button" class="btn primary" data-a11y-close>Done</button></footer>`;
}
const A11y={open:false,opener:null};
function renderA11y(keepFocus){
  const el=$('#a11y');if(!el)return;
  const key=keepFocus&&document.activeElement&&el.contains(document.activeElement)?(document.activeElement.dataset.sw||document.activeElement.dataset.sel||document.activeElement.dataset.test||(document.activeElement.hasAttribute('data-reset')?'__reset':null)):null;
  const sc=$('.a11y-body',el)?$('.a11y-body',el).scrollTop:0;
  el.innerHTML=a11yHTML();
  const b=$('.a11y-body',el);if(b)b.scrollTop=sc;
  if(key){const t=key==='__reset'?$('[data-reset]',el):$(`[data-sw="${key}"],[data-sel="${key}"],[data-test="${key}"]`,el);if(t)t.focus()}
}
function openA11y(opener){
  const el=$('#a11y');if(!el)return;
  if(typeof VoiceUI!=='undefined'&&VoiceUI.open)closeVoice(true);
  if(!A11y.open){A11y.opener=opener||activator()}
  A11y.open=true;el.hidden=false;document.body.classList.add('a11y-open');
  const b=$('#btnA11y');if(b)b.setAttribute('aria-expanded','true');
  renderA11y(false);
  setTimeout(()=>{const f=$('[data-a11y-close]',el)||$('button',el);f&&f.focus()},0);
  say('Accessibility Settings are open. Press Escape to close.',{kind:'info',force:true});
}
function closeA11y(quiet){
  const el=$('#a11y');if(!el||!A11y.open)return;
  A11y.open=false;el.hidden=true;el.innerHTML='';document.body.classList.remove('a11y-open');
  const b=$('#btnA11y');if(b)b.setAttribute('aria-expanded','false');
  if(quiet===true)return;
  const o=A11y.opener;
  if(o&&o.isConnected)try{o.focus()}catch(e){}else{const f=$('#btnA11y');f&&f.focus()}
  say('Accessibility Settings closed.',{kind:'info',force:true});
}
function bindA11y(){
  const el=$('#a11y');
  el.addEventListener('click',e=>{
    const t=e.target.closest('button');if(!t)return;
    if(t.hasAttribute('data-a11y-close')){closeA11y();return}
    if(t.dataset.sw){toggleSetting(t.dataset.sw);return}
    if(t.hasAttribute('data-reset')){resetSettings();say('All accessibility settings were reset to their defaults.',{kind:'info',force:true});return}
    if(t.dataset.test==='sound'){
      if(!S.sound){say('Sound effects are off. Turn them on to test the sound.',{kind:'alert'});return}
      const ok=Sfx.play('test');say(ok?'Test sound played.':'The browser did not allow audio to play, so no sound was made.',{kind:'info',force:true});
    }
    if(t.dataset.test==='speech'){
      if(!S.speech&&!S.speakBoard){say('Spoken output is off. Turn on Spoken board descriptions or Spoken game announcements to test speech.',{kind:'alert'});return}
      if(!speechSupported()){say('Speech synthesis is not supported in this browser. Announcements remain available as text.',{kind:'alert'});return}
      say('This is a test of spoken output at the current speech rate.',{kind:S.speech?'info':'cmd',force:true});
    }
    if(t.dataset.test==='lowtime'){
      if(!S.lowTime){say('Low-time warning is off. Turn it on to test it.',{kind:'alert'});return}
      say('Low time. 30 seconds left on your clock. This is a test of the low-time warning.',{kind:'alert',urgent:true});
      fx('lowtime');
      document.dispatchEvent(new CustomEvent('acchess-lowtime-demo'));
      return;
    }
    if(t.dataset.test==='haptic'){
      if(!S.haptic){say('Vibration feedback is off. Turn it on to test haptic feedback.',{kind:'alert'});return}
      const h=Haptics.fire('test');
      say(h.real?'Test vibration sent to the device.':(h.demo?'Vibration is not supported on this device. Showing the visual demonstration instead; nothing vibrated.':'The device ignored the vibration request.'),{kind:'info',force:true});
      fxSubs.forEach(fn=>fn('test',h));
    }
  });
  el.addEventListener('input',e=>{
    const r=e.target.closest('[data-rg]');if(!r)return;
    const k=r.dataset.rg,v=parseFloat(r.value);
    setSetting(k,v);
    const o=$('#rg-'+k+'-o',el);if(o)o.textContent=(k==='rate'?v.toFixed(1):v)+r.dataset.unit;
  });
  el.addEventListener('change',e=>{
    const s=e.target.closest('[data-sel]');if(s){setSetting(s.dataset.sel,s.dataset.sel==='lowTimeAt'?+s.value:s.value);say(`${{boardTheme:'Board theme',pieceTheme:'Piece theme',verbosity:'Announcement verbosity',lowTimeAt:'Low-time warning threshold'}[s.dataset.sel]||'Setting'} set to ${s.options[s.selectedIndex].text}.`,{kind:'info',force:true})}
    const r=e.target.closest('[data-rg]');if(r){const k=r.dataset.rg;say(`${k==='boardSize'?'Board size':k==='textSize'?'Text size':'Speech rate'} ${r.value}${r.dataset.unit}.`,{kind:'info',force:true})}
  });
  el.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();closeA11y()}});
  settingSubs.push(()=>{if(A11y.open&&!($('#a11y').contains(document.activeElement)&&document.activeElement.type==='range'))renderA11y(true)});
}

/* ----- quick-setting buttons on Home keep their state in sync ---------- */
function refreshToolbars(){
  $$('[data-qa]').forEach(b=>{const k=b.dataset.qa;b.setAttribute('aria-pressed',String(settingOn(k)));const st=$('.st',b);if(st)st.innerHTML=settingOn(k)?I.check(12)+' On':'Off'});
}
settingSubs.push(refreshToolbars);
/* quick settings: one global bar at the top of every screen (the same switches as in Accessibility Settings) */
function quickBarHTML(){
  const t=(k,icon,label)=>`<button type="button" class="tg qb" data-qa="${k}" aria-pressed="${settingOn(k)}"><span class="tgi">${icon}</span><span class="ql">${label}</span><span class="st">${settingOn(k)?I.check(12)+' On':'Off'}</span></button>`;
  return `<span class="qb-l">${I.access(16)} Quick settings</span>`+t('screenReader',I.ear(18),'Screen reader')+t('contrast',I.contrast(18),'High contrast')+t('sound',I.sound(18),'Sound')+t('speech',I.speaker(18),'Speech')+t('haptic',I.vib(18),'Vibration');
}
let hvT;
fxSubs.add((kind,h)=>{
  const v=$('#hviz');if(!v||!h||!h.demo)return;
  v.textContent=`Vibration (visual demo): ${FX_LABEL[kind]||kind}`;v.classList.add('on');
  clearTimeout(hvT);hvT=setTimeout(()=>{v.classList.remove('on');v.textContent=''},1600);
});

/* ----- assistive dock ------------------------------------------------- */
function dockHTML(kind){
  const stat=(kind==='play'||kind==='puzzle')?`<details class="dcard dcollapse" id="statCard" open>
     <summary><h2 id="dk-s">${I.info(18)} Game status</h2></summary>
     <dl class="stat-dl" id="dkStatus"></dl></details>`:'';
  return `<aside class="dock" aria-label="Game status, voice and announcements" id="dock">
   ${stat}
   <section class="dcard" aria-labelledby="dk-v">
     <h2 id="dk-v">${I.mic(18)} Voice control</h2>
     <p class="small muted">Speak or type one command at a time. The microphone never starts by itself.</p>
     <div class="btnrow"><button type="button" class="btn primary" data-open-voice aria-keyshortcuts="Alt+Shift+V">Open Voice Controls <kbd>Alt+Shift+V</kbd></button></div>
     <dl class="vdl">
       <dt>Last heard</dt><dd id="dkHeard">—</dd>
       <dt>Result</dt><dd id="dkRes">—</dd>
     </dl>
   </section>
   <details class="dcard dcollapse" id="annCard">
     <summary><h2 id="dk-a">${I.speaker(18)} Announcements</h2></summary>
     <p class="latest" id="dkLatest"><span class="sr-only">Latest announcement: </span><span id="dkLatestT">No announcements yet.</span></p>
     <div class="btnrow"><button type="button" class="btn sm" id="aRepeat">Repeat last</button><button type="button" class="btn sm" id="aClear">Clear transcript</button>
       <button type="button" class="btn sm" id="aKeys">${I.kbd(14)} Keys and commands</button></div>
     <ol class="alog" id="aLog" aria-label="Announcement transcript"></ol>
   </details>
  </aside>`;
}
function fmtTime(d){return d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}
function logItemHTML(e){
  const lab={game:'Game',cmd:'Info',alert:'Alert',fx:'Feedback',focus:'Focus',info:'Info'}[e.kind]||'Info';
  return `<li class="k-${e.kind}${e.urgent?' urgent':''}"><time>${fmtTime(e.t)}</time><span class="kd">${e.kind==='alert'?'✖ ':''}${lab}</span><span class="tx">${esc(e.text)}</span>${e.spoken?'<span class="sp" title="Spoken aloud">'+I.sound(13)+'<span class="sr-only">spoken</span></span>':''}</li>`;
}
function boardActions(e,ctrlGetter){
  const b=e.target.closest('button');if(!b)return false;
  const C=ctrlGetter();
  if(b.classList.contains('js-cancel')){if(C&&C.cancel){C.cancel('button')}return true}
  if(b.classList.contains('js-undo')){
    if(!C||!C.undo)return true;
    if(!C.game.moves.length){say('There are no moves to undo.',{kind:'alert'});return true}
    confirmAction({title:'Undo your last move?',message:'This takes back a completed move'+(C.opponent?' and the opponent’s reply':'')+'. It is different from cancelling a selection.',confirmLabel:'Undo move',onConfirm:()=>C.undo()});
    return true;
  }
  return false;
}
function mountBoardbar(ctrlGetter){const bb=$('#boardbar');if(bb)bb.addEventListener('click',e=>boardActions(e,ctrlGetter))}
function mountDock(kind,dispose,ctrlGetter){
  mountBoardbar(ctrlGetter);
  const log=$('#aLog'),latest=$('#dkLatestT');
  if(!log)return;
  const ac=$('#annCard');if(ac)ac.open=!!S.screenReader;          // progressive disclosure: transcript opens by itself only for screen-reader mode
  const redraw=()=>{log.innerHTML=Ann.log.slice(-60).map(logItemHTML).join('');log.scrollTop=log.scrollHeight};
  redraw();
  const last=Ann.log.filter(e=>e.kind!=='fx'&&e.kind!=='focus').slice(-1)[0];if(last)latest.textContent=last.text;
  const onAnn=e=>{
    const nearBottom=log.scrollTop+log.clientHeight>=log.scrollHeight-40;
    if(e.kind==='focus'&&log.lastElementChild&&log.lastElementChild.classList.contains('k-focus'))log.lastElementChild.remove();
    log.insertAdjacentHTML('beforeend',logItemHTML(e));
    while(log.children.length>80)log.firstElementChild.remove();
    if(nearBottom)log.scrollTop=log.scrollHeight;
    if(e.kind!=='fx'&&e.kind!=='focus')latest.textContent=e.text;
  };
  Ann.subs.add(onAnn);dispose.push(()=>Ann.subs.delete(onAnn));
  const dkPaint=()=>{
    const h=$('#dkHeard'),r=$('#dkRes');if(!h||!r)return;
    h.textContent=Voice.heard||'—';r.textContent=Voice.result||'—';r.className=Voice.result?(Voice.resultOk?'res ok':'res bad'):'';
  };
  dkPaint();Voice.subs.add(dkPaint);dispose.push(()=>Voice.subs.delete(dkPaint));
  const dockClick=e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.id==='aRepeat'){
      const l=Ann.log.filter(x=>x.kind!=='fx'&&x.kind!=='focus').slice(-1)[0];
      if(!l){say('Nothing to repeat yet.',{kind:'info'});return}
      if(!S.speech){say('Spoken game announcements are off, so the last message is shown as text only: '+l.text,{kind:'info',force:true});return}
      say(l.text,{kind:'info',force:true,live:false});
    }
    else if(b.id==='aClear'){Ann.log.length=0;log.innerHTML='';latest.textContent='Transcript cleared.'}
    else if(b.id==='aKeys')showHelp('keys');
  };
  $('#dock').addEventListener('click',dockClick);
}
/* board actions, directly under the board on every screen size (one consistent place) */
function boardbarHTML(kind){
  if(kind==='puzzle')return `<div class="boardbar" id="boardbar" role="group" aria-label="Puzzle actions">
    <button type="button" class="btn js-hint" id="hintM">${I.bulb(18)} Hint</button>
    <button type="button" class="btn js-retry" id="pRetryM">${I.restart(16)} Try again</button>
    <button type="button" class="btn js-next" id="pNextM">${I.next(18)} Next puzzle</button>
    <button type="button" class="btn js-cancel" id="bCancelM">${I.close(14)} Cancel selection</button>
  </div>`;
  return `<div class="boardbar" id="boardbar" role="group" aria-label="Board actions">
    <button type="button" class="btn js-cancel" id="bCancelM" title="Esc">${I.close(14)} Cancel selection</button>
    <button type="button" class="btn js-undo" id="bUndoM">${I.undo(14)} Undo last move</button>
  </div>`;
}
function statusRowsHTML(rows){return rows.map(([k,v,cls])=>`<div><dt>${esc(k)}</dt><dd class="${cls||''}">${v}</dd></div>`).join('')}

/* ----- sidebar -------------------------------------------------------- */
function sidebarHTML(active){
  const a=(id,icon,label)=>`<li><a class="sb-item" href="#${id}" ${active===id?'aria-current="page"':''}><span class="sb-ico">${icon}</span><span>${label}</span></a></li>`;
  const bt=(act,icon,label,extra='')=>`<li><button type="button" class="sb-item" data-act="${act}" ${extra}><span class="sb-ico">${icon}</span><span>${label}</span></button></li>`;
  return `<nav id="sidebar" aria-label="Main navigation">
    <a class="logo" href="#home">
      ${sv(34,'0 0 34 34','<circle cx="15" cy="9" r="6" fill="#81b64c"/><path d="M9,16H21C20,20 24,24 26,30H4C6,24 10,20 9,16Z" fill="#81b64c"/><rect x="3" y="29" width="24" height="4" rx="2" fill="#6aa337"/>','aria-hidden="true"')}
      <span class="lg"><span class="wm">Ac<em>Chess</em></span> <small>Play Without Barriers</small><span class="sr-only"> — home</span></span></a>
    <ul class="navlist">
      ${a('menu',I.play(30),'Play')}
      ${a('puzzle',I.puzzle(30),'Puzzles')}
      ${bt('learn',I.cap(30),'Learn')}
      <li><button type="button" class="sb-item" id="moreBtn" aria-expanded="false" aria-controls="moreList"><span class="sb-ico">${I.chev(18)}</span><span>More</span></button>
        <ul id="moreList" class="sublist" hidden>
          ${a('review','','Game Review')}${a('play','','Current game')}
          <li><button type="button" class="sb-item sub" data-act="tournaments"><span>Tournaments</span></button></li>
          <li><button type="button" class="sb-item sub" data-act="variants"><span>Chess Variants</span></button></li>
        </ul></li>
      ${bt('trial',I.gem(28),'Free Trial','')}
    </ul>
    <div class="sb-bottom">
      <button type="button" class="sb-b" data-act="search"><span class="sb-ico">${I.search(24)}</span><span>Search</span></button>
      <button type="button" class="sb-b" data-act="profile"><span class="sb-ico">${avatar(28)}</span><span>Player1</span></button>
      <div class="sb-row" role="group" aria-label="Account shortcuts">
        <button type="button" data-act="friends" aria-label="Friends">${I.friends()}</button>
        <button type="button" data-act="mail" aria-label="Messages, 2 unread">${I.mail()}<span class="badge" aria-hidden="true">2</span></button>
        <button type="button" data-act="bell" aria-label="Notifications">${I.bell()}</button>
        <button type="button" data-open-a11y aria-label="Settings: open accessibility settings">${I.gear()}</button>
      </div>
    </div></nav>`;
}
function bindSidebar(){
  const sb=$('#sidebar');
  $('#moreBtn',sb).addEventListener('click',e=>{
    const b=e.currentTarget,open=b.getAttribute('aria-expanded')!=='true';
    b.setAttribute('aria-expanded',String(open));$('#moreList',sb).hidden=!open;
    $('.sb-ico',b).style.transform=open?'rotate(180deg)':'';
  });
}
function sidebarAction(act){
  switch(act){
    case'learn':outsideScope('Learn','Lessons are not part of this prototype. In AcChess they would use the same screen reader, voice and keyboard controls as the board.');break;
    case'tournaments':outsideScope('Tournaments','Tournaments need a live multiplayer connection, which this offline prototype does not have.');break;
    case'variants':outsideScope('Chess Variants','Variants are not part of this prototype.');break;
    case'trial':infoDialog('Free Trial','<p>AcChess is a proposed academic redesign, not a product. There is no subscription, account or connection to Chess.com servers.</p>');break;
    case'search':openSearch();break;
    case'profile':infoDialog('Player1','<p>Sample profile used for the demonstration. No real account or personal data is used.</p><p>Rating: 217 (sample).</p>');break;
    case'friends':infoDialog('Friends','<p>No friends are connected. The prototype has no real multiplayer or social features.</p>');break;
    case'mail':infoDialog('Messages','<ul class="plain"><li><b>Welcome to AcChess</b> — sample message</li><li><b>Review ready</b> — sample message: “Your game against RivalSample can be reviewed.”</li></ul><p class="dlg-hint">Sample content for the demonstration.</p>',[{label:'Open Game History',primary:true,onClick:()=>navigate('review')}]);break;
    case'bell':infoDialog('Notifications','<p>No new notifications. (Sample panel — notifications are not connected to any service.)</p>');break;
  }
}


/* =====================================================================
   Global Voice Controls panel (available on every screen)
   ===================================================================== */
const VoiceUI={open:false,opener:null};
function voiceExamples(){
  const k=Ctx.kind;
  const common=['What can I do here','List controls','Go to puzzles','Go to game history','Go back','Scroll down','Open accessibility settings','Enable high contrast','Increase text size','Turn off sound'];
  const per={play:['Select e2','Move e2 to e4','Knight to f3','Read legal moves','Cancel selection','Previous move','Offer draw','Resign'],
    menu:['Select e2','Move e2 to e4','Knight to f3','Read legal moves','Cancel selection'],
    puzzle:['Read the puzzle','Hint','Rook to f8','Read legal moves','Cancel selection'],
    review:['Next move','Previous move','First position','Last position'],
    home:['Go to puzzles','Open play menu','Go to game review']}[k||'home']||[];
  return per.concat(common);
}
function voicePanelHTML(){
  const sup=Voice.supported;
  return `
  <div class="vp-h"><h2 id="vpT">${I.mic(20)} Voice Controls</h2>
    <button type="button" class="btn icon" data-voice-close aria-label="Close Voice Controls">${I.close(18)}</button></div>
  <div class="vp-b">
    <p class="vp-help" id="vpHelp">Press the microphone, wait for “Listening”, then say <b>one</b> command. You can also type a command below.</p>
    <p class="vstate" id="vState" aria-hidden="true"></p>
    <div class="vrow">
      <button type="button" class="mic" id="vMic" aria-pressed="false" aria-describedby="vpHelp" ${sup?'':'aria-disabled="true"'}>${I.mic(26)}<span class="sr-only" id="vMicL">Start listening</span></button>
      <div class="vind" id="vInd"><span class="dot" aria-hidden="true"></span><span id="vIndT">Microphone off</span></div>
    </div>
    <form id="vForm" autocomplete="off">
      <label for="vIn">Type a command (no microphone needed)</label>
      <div class="vin"><input id="vIn" type="text" placeholder="e.g. knight to f3" enterkeyhint="send"><button type="submit" class="btn primary">Send</button></div>
    </form>
    <dl class="vdl">
      <dt>Heard</dt><dd id="vHeard">—</dd>
      <dt>Understood as</dt><dd id="vUnd">—</dd>
      <dt>Result</dt><dd id="vRes" class="res">—</dd>
    </dl>
    <div id="vOpt">${switchHTML('continuousListen','Continuous listening (optional)','One microphone session for many commands: the browser asks for permission once. Non-commands are ignored; it turns off after 5 minutes of silence or when you say “stop listening”.')}</div>
    <details class="vhist"><summary>Example commands</summary><div class="chips" aria-label="Example commands" id="vChips"></div></details>
    <details class="vhist"><summary>Command history <span id="vHn">(0)</span></summary><ol id="vHist" class="hist"></ol></details>
    <p class="note" id="vSupport">${sup?'Speech recognition is available in this browser. It needs microphone permission and, in Chrome, an internet connection.':'Speech recognition is not available in this browser. Typed commands work the same way.'}</p>
    <p class="note perm" id="vPerm" role="note"></p>
  </div>`;
}
function paintVoicePanel(){
  if(!VoiceUI.open)return;
  const mic=$('#vMic');if(!mic)return;
  const busy=Voice.listening||Voice.preparing;
  mic.setAttribute('aria-pressed',String(busy));
  $('#vMicL').textContent=busy?'Stop listening':'Start listening';
  const ind=$('#vInd');ind.classList.toggle('on',Voice.listening);
  $('#vIndT').textContent=Voice.preparing?'Starting… listening in a moment'
    :Voice.listening?(S.continuousListen?'Listening continuously. Speak a command.':'Listening. You may speak now.')
    :(Voice.supported?'Microphone off. Press the button to speak one command.':'Speech recognition unavailable — type your command');
  {
    const st=Voice.preparing?['starting','◔ Starting']:Voice.listening?['listening','● Listening']
      :(Voice.result&&!Voice.resultOk)?['error','✖ Error — see result']:(Voice.result&&Voice.heard)?['done','✔ Done']:['idle','○ Inactive'];
    const sEl=$('#vState');sEl.className='vstate s-'+st[0];sEl.textContent='Microphone: '+st[1].replace(/^[^ ]+ /,'')+'  '+st[1].split(' ')[0];
    sEl.setAttribute('aria-hidden','true');
  }
  $('#vHeard').textContent=Voice.heard||'—';
  $('#vUnd').textContent=Voice.understood||'—';
  const res=$('#vRes');res.textContent=Voice.result||'—';res.className='res '+(Voice.result?(Voice.resultOk?'ok':'bad'):'');
  $('#vHn').textContent=`(${Voice.history.length})`;
  $('#vHist').innerHTML=Voice.history.slice(0,12).map(h=>`<li class="${h.outcome}"><span class="tx">“${esc(h.text)}”</span><span class="oc">${h.outcome==='ok'?'✔ done':h.outcome==='confirm'?'… awaiting confirmation':'✖ not done'} · ${h.source}</span><span class="sm">${esc(h.summary||'')}</span></li>`).join('');
}
function openVoice(opener){
  const el=$('#voicePanel');if(!el)return;
  if(A11y.open)closeA11y(true);
  if(!VoiceUI.open){VoiceUI.opener=opener||activator()}
  const wasOpen=VoiceUI.open;
  VoiceUI.open=true;el.hidden=false;document.body.classList.add('voice-open');
  el.innerHTML=voicePanelHTML();
  $('#vChips',el).innerHTML=voiceExamples().map(x=>`<button type="button" class="chip" data-cmd="${esc(x)}">${esc(x)}</button>`).join('');
  const b=$('#btnVoice');if(b)b.setAttribute('aria-expanded','true');
  paintVoicePanel();
  refreshMicPermission();
  setTimeout(()=>{const m=$('#vMic',el);m&&m.focus()},0);
  if(!wasOpen)say('Voice Controls are open. Press the microphone button, then speak one command, or type a command.',{kind:'info',force:true});
}
function closeVoice(quiet){
  const el=$('#voicePanel');if(!el||!VoiceUI.open)return;
  if(Voice.listening||Voice.preparing)Voice.stop();
  VoiceUI.open=false;el.hidden=true;el.innerHTML='';document.body.classList.remove('voice-open');
  const b=$('#btnVoice');if(b)b.setAttribute('aria-expanded','false');
  if(quiet===true)return;
  const o=VoiceUI.opener;
  if(o&&o.isConnected)try{o.focus()}catch(e){}else{const f=$('#btnVoice');f&&f.focus()}
  say('Voice Controls closed.',{kind:'info',force:true});
}
function focusVoiceInput(){
  if(!VoiceUI.open)openVoice();
  setTimeout(()=>{const i=$('#vIn');i&&i.focus()},30);
}
function bindVoicePanel(){
  const el=$('#voicePanel');
  el.addEventListener('click',e=>{
    const c=e.target.closest('[data-cmd]');if(c){Voice.submit(c.dataset.cmd,{source:'typed'});return}
    if(e.target.closest('[data-voice-close]')){closeVoice();return}
    const sw=e.target.closest('[data-sw]');if(sw){toggleSetting(sw.dataset.sw);return}
    if(e.target.closest('#vMic')){
      if(!Voice.supported){
        const m='Speech recognition is not available in this browser, so the microphone cannot be used. Please type your command instead.';
        Voice.setResult(m,false);say(m,{kind:'alert',urgent:true});focusVoiceInput();return;
      }
      Voice.start();
    }
  });
  el.addEventListener('submit',e=>{
    e.preventDefault();const i=$('#vIn');const v=i.value;i.value='';
    Voice.submit(v,{source:'typed'});i.focus();
  });
  el.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();closeVoice()}});
  Voice.subs.add(paintVoicePanel);
  settingSubs.push(()=>{if(VoiceUI.open){const o=$('#vOpt');if(o)o.innerHTML=switchHTML('continuousListen','Continuous listening (optional)','One microphone session for many commands: the browser asks for permission once. Non-commands are ignored; it turns off after 5 minutes of silence or when you say “stop listening”.');paintVoicePanel()}});
}

/* =====================================================================
   Persistent entry points: header buttons, shortcuts, welcome / help
   ===================================================================== */
const WELCOME_ITEMS=[
  ['kb','Alt + Shift + A','opens Accessibility Settings.'],
  ['kb','Alt + Shift + V','opens Voice Controls (microphone and typed commands).'],
  ['all','The Accessibility Settings and Voice Controls buttons','are always at the top of every screen.'],
  ['touch','Tap a piece, then a highlighted square','to move it. No dragging is needed.'],
  ['touch','The bottom bar','switches between Home, Playing, Review, Puzzle and Menu. “More” (top right) holds everything else.'],
  ['kb','Tab and Shift + Tab','move between controls. On the chessboard, use the arrow keys and Enter, and press ? for all board keys.'],
  ['kb','Space bar','is push-to-talk: press it (board or page focused), wait for “Listening”, then say your move.'],
  ['kb','Skip links','appear when you first press Tab: “Skip to main content” and “Accessibility and Voice Controls”.']
];
function welcomeBodyHTML(){
  return `<p>You can play with the mouse or touch, the keyboard, or your voice.</p>
    <ul class="welcome-list">${WELCOME_ITEMS.map(([k,a,b])=>`<li class="w-${k}"><b>${a}</b> ${b}</li>`).join('')}</ul>
    <p class="dlg-hint">AcChess is a proposed academic prototype. The opponent is simulated and nothing connects to Chess.com.</p>`;
}
function welcomeDismissed(){if(/[?&]welcome=off\b/.test(location.search))return true;return Store.get('acchess.welcome')==='1'}
function mountWelcome(main){
  const slot=$('#welcomeSlot',main);
  if(!slot||welcomeDismissed())return;
  slot.innerHTML=`<section class="welcome" id="welcome" aria-labelledby="welH">
    <h2 id="welH">New here? Three ways to play</h2>
    <ul class="wel3">
      <li><b>Touch or mouse</b><span>Tap a piece, then a highlighted square.</span></li>
      <li><b>Keyboard</b><span>Arrow keys and Enter on the board. Press <kbd>?</kbd> for all keys.</span></li>
      <li><b>Voice</b><span>Open Voice Controls, then say “move e2 to e4”. The microphone only starts when you press it.</span></li></ul>
    <div class="btnrow"><button type="button" class="btn primary" id="welOk">Got it</button>
      <button type="button" class="btn" id="welKeys">Keys and voice commands</button></div></section>`;
  $('#welOk',main).addEventListener('click',()=>{
    Store.set('acchess.welcome','1');
    $('#welcome').remove();
    say('Welcome tips closed. They stay closed on this device. Reopen them from the Help button.',{kind:'info',force:true});
    const h=$('h1',main);if(h)h.focus({preventScroll:true});
  });
  $('#welKeys',main).addEventListener('click',()=>showHelp());
}
const isTypingTarget=t=>!!t&&(t.isContentEditable||t.tagName==='TEXTAREA'||t.tagName==='SELECT'||
  (t.tagName==='INPUT'&&!/^(checkbox|radio|range|button|submit|reset)$/i.test(t.type||'text')));
function bindPushToTalk(){
  const toast=document.createElement('div');
  toast.id='voiceToast';toast.hidden=true;toast.setAttribute('aria-hidden','true');
  document.body.appendChild(toast);
  let hideT=null,wasBusy=false;
  const paint=()=>{
    if(VoiceUI.open){toast.hidden=true;wasBusy=false;return}
    const busy=Voice.listening||Voice.preparing;
    if(busy){
      clearTimeout(hideT);wasBusy=true;toast.hidden=false;toast.className='listening';
      toast.innerHTML='<span class="dot"></span><span>'+(S.continuousListen?'Microphone is ON (continuous). Say a command, or say “stop listening”. (Space to stop)':'Listening… say your move. (Space to stop)')+'</span>';
    }else if(wasBusy||(!toast.hidden&&/done|fail/.test(toast.className))){
      wasBusy=false;clearTimeout(hideT);
      toast.hidden=false;toast.className=Voice.resultOk?'done':'fail';
      toast.textContent=(Voice.heard?`“${Voice.heard}” — `:'')+(Voice.result||'Microphone off.');
      hideT=setTimeout(()=>{toast.hidden=true},5500);
    }
  };
  Voice.subs.add(paint);
  document.addEventListener('keydown',e=>{
    if(e.key!==' '||e.repeat||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey)return;
    if(!S.spaceTalk||Dlg.isOpen())return;
    const t=e.target;
    const onPage=t===document.body||t===document.documentElement||t.id==='main';
    const onBoard=t.classList&&t.classList.contains('sq')&&!!t.closest('.board');
    if(!(onPage||onBoard)||isTypingTarget(t))return;
    e.preventDefault();                       // do not scroll the page
    if(!Voice.supported){
      const m='Speech recognition is not available in this browser, so push-to-talk cannot listen. Press Alt Shift V to open Voice Controls and type your command instead.';
      Voice.setResult(m,false);say(m,{kind:'alert',urgent:true});return;
    }
    Voice.start();                            // pressing again while listening stops the microphone
  });
}
function bindHeader(){
  $('#quickbar').innerHTML=quickBarHTML();
  {const hv=document.createElement('div');hv.id='hviz';hv.className='hviz';hv.setAttribute('aria-hidden','true');document.body.appendChild(hv)}
  bindPushToTalk();
  bindViewport();
  $('#btnMore').addEventListener('click',e=>openMore(e.currentTarget));
  $('#btnA11y').addEventListener('click',e=>{A11y.open?closeA11y():openA11y(e.currentTarget)});
  $('#btnVoice').addEventListener('click',e=>{VoiceUI.open?closeVoice():openVoice(e.currentTarget)});
  $('#btnHelp').addEventListener('click',()=>showHelp());
  $('#skipA11y').addEventListener('click',e=>{e.preventDefault();$('#btnA11y').focus()});
  document.addEventListener('keydown',e=>{
    if(!(e.altKey&&e.shiftKey)||e.ctrlKey||e.metaKey)return;
    if(isTypingTarget(e.target))return;            // never fire while typing in a text field
    if(Dlg.isOpen())return;
    if(e.code==='KeyA'){e.preventDefault();A11y.open?closeA11y():openA11y($('#btnA11y'))}
    else if(e.code==='KeyV'){e.preventDefault();VoiceUI.open?closeVoice():openVoice($('#btnVoice'))}
  });
}


/* =====================================================================
   Microphone permission status (why the browser may ask every time)
   ===================================================================== */
const MicPerm={state:'unknown',watching:false};
function micPermissionText(){
  if(location.protocol==='file:')
    return 'This page was opened as a file from disk. Chrome and Edge cannot remember the microphone choice for files, so they ask every time. To be asked only once, open it from localhost: double-click start-acchess.bat in this folder (or run “python -m http.server 5188” and open http://localhost:5188/).';
  if(MicPerm.state==='granted')return 'Microphone permission: allowed. The browser will not ask again for this site.';
  if(MicPerm.state==='denied')return 'Microphone permission: blocked. Click the lock icon in the address bar and set Microphone to Allow, then reload. Typed commands still work.';
  if(MicPerm.state==='prompt')return 'Microphone permission: not decided yet. The browser will ask once — choose “Allow” (not “Allow this time”) so it is remembered.';
  return '';
}
function refreshMicPermission(){
  const paint=()=>{const p=$('#vPerm');if(p){p.textContent=micPermissionText();p.hidden=!p.textContent}};
  paint();
  try{
    if(!navigator.permissions||!navigator.permissions.query||MicPerm.watching&&MicPerm.state!=='unknown'){return}
    navigator.permissions.query({name:'microphone'}).then(st=>{
      MicPerm.state=st.state;MicPerm.watching=true;paint();
      st.onchange=()=>{MicPerm.state=st.state;paint()};
    }).catch(()=>{});
  }catch(e){}
}


/* =====================================================================
   Phone navigation: "More" sheet, on-screen-keyboard awareness
   ===================================================================== */
function openMore(){
  const items=[['learn','Learn'],['tournaments','Tournaments'],['variants','Chess Variants'],['trial','Free Trial'],['search','Search'],
    ['profile','Player1 (profile)'],['friends','Friends'],['mail','Messages (2 unread)'],['bell','Notifications'],['help','Help and instructions'],['keys','Keyboard shortcuts']];
  const dlg=openDialog({title:'More',cancelLabel:'Close',
    body:`<ul class="more-sheet">${items.map(([k,l])=>`<li><button type="button" class="btn" data-more="${k}">${esc(l)}</button></li>`).join('')}</ul>
      <p class="dlg-hint"><a href="chesscom-current.html">Compare: current Chess.com UI recreation</a></p>
      <p class="dlg-hint">AcChess is a proposed academic prototype — not an official Chess.com product and not connected to Chess.com servers.</p>`});
  dlg.addEventListener('click',e=>{
    const b=e.target.closest('[data-more]');if(!b)return;
    const k=b.dataset.more;Dlg.close();
    setTimeout(()=>{if(k==='help')showHelp();else if(k==='keys')showKeyHelp();else sidebarAction(k)},0);
  });
}
function bindViewport(){
  const vv=window.visualViewport,root=document.documentElement;
  const upd=()=>{
    const h=vv?vv.height:window.innerHeight,top=vv?vv.offsetTop:0;
    root.style.setProperty('--vvh',Math.round(h)+'px');
    root.style.setProperty('--kb',Math.max(0,Math.round(window.innerHeight-h-top))+'px');   // height covered by the on-screen keyboard
  };
  upd();
  if(vv){vv.addEventListener('resize',upd);vv.addEventListener('scroll',upd)}
  window.addEventListener('orientationchange',()=>setTimeout(upd,250));
  document.addEventListener('focusin',e=>{
    const t=e.target;
    if(t.matches&&t.matches('input,select,textarea')&&t.closest('#voicePanel,#a11y,.dlg'))
      setTimeout(()=>{try{t.scrollIntoView({block:'center',behavior:S.reduceMotion?'auto':'smooth'})}catch(err){}},250);
  });
}
