// ShopCut — local-first ledger + calculator
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const storeKey = 'shopcut-v1';

const todayStr = () => {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d - tzOffset).toISOString().slice(0,10);
};
const fmtMoney = (n) => isNaN(n) ? '$0.00' : '$' + (Math.round(n*100)/100).toFixed(2);
const uid = () => Math.random().toString(36).slice(2,9);

const defaultState = {
  people: [{ id: uid(), name: 'Alex', emoji: '🦅', percent: 60, percentIsShop: false }],
  entries: [],
  settings: { font: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial', mode: 'auto', accent: '#8b5cf6', bgDensity: 60 }
};

function loadState(){ try{ const raw = localStorage.getItem(storeKey); if(!raw) return defaultState; const p = JSON.parse(raw); p.settings = Object.assign({}, defaultState.settings, p.settings||{}); return p; }catch(e){ console.error(e); return defaultState; } }
function saveState(st){ localStorage.setItem(storeKey, JSON.stringify(st)); }

let state = loadState();

// Elements
const entryDate = document.getElementById('entryDate');
const entryArtist = document.getElementById('entryArtist');
const entryGross = document.getElementById('entryGross');
const entryNotes = document.getElementById('entryNotes');
const entryForm = document.getElementById('entryForm');
const ledgerTableBody = document.querySelector('#ledgerTable tbody');

const filterFrom = document.getElementById('filterFrom');
const filterTo = document.getElementById('filterTo');
const filterArtist = document.getElementById('filterArtist');
const filterText = document.getElementById('filterText');
const btnClearFilters = document.getElementById('btnClearFilters');
const totalsBox = document.getElementById('totals');

const peopleModal = document.getElementById('peopleModal');
const peopleList = document.getElementById('peopleList');
const btnPeople = document.getElementById('btnPeople');

const themeModal = document.getElementById('themeModal');
const btnTheme = document.getElementById('btnTheme');
const fontSelect = document.getElementById('fontSelect');
const modeSelect = document.getElementById('modeSelect');
const accentColor = document.getElementById('accentColor');
const bgDensity = document.getElementById('bgDensity');

const weeklyModal = document.getElementById('weeklyModal');
const btnWeekly = document.getElementById('btnWeekly');
const weekStart = document.getElementById('weekStart');
const btnBuildWeekly = document.getElementById('btnBuildWeekly');
const btnMailWeekly = document.getElementById('btnMailWeekly');
const btnCopyWeekly = document.getElementById('btnCopyWeekly');
const weeklyText = document.getElementById('weeklyText');

const btnExportCSV = document.getElementById('btnExportCSV');
const inputImport = document.getElementById('inputImport');

document.addEventListener('DOMContentLoaded', () => {
  entryDate.value = todayStr();
  renderPeople();
  renderPeopleSelects();
  renderLedger();

  fontSelect.value = state.settings.font;
  modeSelect.value = state.settings.mode;
  accentColor.value = state.settings.accent || '#8b5cf6';
  bgDensity.value = state.settings.bgDensity ?? 60;
  applyTheme();

  const now = new Date(), day = now.getDay(), diffToMon = (day + 6) % 7;
  const monday = new Date(now); monday.setDate(now.getDate() - diffToMon);
  weekStart.value = monday.toISOString().slice(0,10);
});

// Theme
btnTheme.addEventListener('click', ()=> themeModal.showModal());
fontSelect.addEventListener('change', ()=> { state.settings.font = fontSelect.value; saveState(state); applyTheme(); });
modeSelect.addEventListener('change', ()=> { state.settings.mode = modeSelect.value; saveState(state); applyTheme(); });
accentColor.addEventListener('change', ()=> { state.settings.accent = accentColor.value; saveState(state); applyTheme(); });
bgDensity.addEventListener('input', ()=> { state.settings.bgDensity = Number(bgDensity.value); saveState(state); applyTheme(); });
function applyTheme(){
  document.body.style.setProperty('--font', state.settings.font);
  document.body.style.setProperty('--accent', state.settings.accent || '#8b5cf6');
  document.body.style.setProperty('--bg-density', state.settings.bgDensity ?? 60);
  const root = document.documentElement;
  root.removeAttribute('data-mode');
  if(state.settings.mode==='light') root.setAttribute('data-mode','light');
  if(state.settings.mode==='dark') root.setAttribute('data-mode','dark');
}

// People
btnPeople.addEventListener('click', ()=> peopleModal.showModal());
function renderPeople(){
  if(state.people.length===0){ peopleList.innerHTML = '<p class="hint">No people yet. Add someone below.</p>'; return; }
  peopleList.innerHTML = '';
  state.people.forEach(p=>{
    const row = document.createElement('div');
    row.className = 'person-row';
    row.innerHTML = `
      <div class="person-emoji">${p.emoji || '🙂'}</div>
      <div class="person-name"><input type="text" value="${p.name}"/></div>
      <div class="person-percent"><input type="number" min="0" max="100" step="1" value="${p.percent}"/></div>
      <div class="person-mode">
        <label class="toggle">
          <input type="checkbox" ${p.percentIsShop ? 'checked' : ''}/>
          <span>% is <b>Shop</b></span>
        </label>
      </div>
      <div class="person-emoji-edit"><input type="text" maxlength="4" value="${p.emoji || ''}" placeholder="emoji"/></div>
      <div class="person-actions"><button class="btn" title="Delete">🗑️</button></div>`;

    const nameInput = row.querySelector('.person-name input');
    const percentInput = row.querySelector('.person-percent input');
    const modeInput = row.querySelector('.person-mode input');
    const emojiInput = row.querySelector('.person-emoji-edit input');
    const emojiView = row.querySelector('.person-emoji');
    const delBtn = row.querySelector('.person-actions button');

    nameInput.addEventListener('input', ()=> { p.name = nameInput.value; saveState(state); renderPeopleSelects(); renderLedger(); });
    percentInput.addEventListener('input', ()=> { p.percent = Number(percentInput.value||0); saveState(state); renderLedger(); });
    modeInput.addEventListener('change', ()=> { p.percentIsShop = modeInput.checked; saveState(state); renderLedger(); });
    emojiInput.addEventListener('input', ()=> { p.emoji = emojiInput.value; emojiView.textContent = emojiInput.value || '🙂'; saveState(state); renderPeopleSelects(); renderLedger(); });
    delBtn.addEventListener('click', ()=> {
      if(!confirm(`Remove ${p.name}?`)) return;
      state.people = state.people.filter(x=>x.id!==p.id);
      saveState(state); renderPeople(); renderPeopleSelects(); renderLedger();
    });

    peopleList.appendChild(row);
  });
}
document.addEventListener('click', (e)=>{
  if(e.target && e.target.id==='btnAddPerson'){
    e.preventDefault();
    const name = document.getElementById('newPersonName').value.trim();
    const emoji = document.getElementById('newPersonEmoji').value.trim();
    const percent = Number(document.getElementById('newPersonPercent').value);
    const percentIsShop = document.getElementById('newPersonPercentIsShop').checked;
    if(!name || isNaN(percent)){ alert('Name and percent are required.'); return; }
    state.people.push({ id: uid(), name, emoji, percent, percentIsShop });
    saveState(state);
    document.getElementById('newPersonName').value='';
    document.getElementById('newPersonEmoji').value='';
    document.getElementById('newPersonPercent').value='';
    document.getElementById('newPersonPercentIsShop').checked=false;
    renderPeople(); renderPeopleSelects();
  }
});

function renderPeopleSelects(){
  const opts = state.people.map(p=>`<option value="${p.id}">${p.emoji? p.emoji+' ':''}${p.name}</option>`).join('');
  entryArtist.innerHTML = opts;
  filterArtist.innerHTML = `<option value="">All</option>` + opts;
  if(state.people[0]) entryArtist.value = state.people[0].id;
}

// Entries
entryForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const date = entryDate.value;
  const artistId = entryArtist.value;
  const gross = Number(entryGross.value);
  const notes = entryNotes.value.trim();
  if(!date || !artistId || isNaN(gross)){ alert('Date, artist, and gross are required.'); return; }
  state.entries.unshift({ id: uid(), date, artistId, gross, notes });
  saveState(state);
  entryGross.value=''; entryNotes.value='';
  renderLedger();
});

// Filters
[filterFrom, filterTo, filterArtist, filterText].forEach(el=> el.addEventListener('input', renderLedger));
btnClearFilters.addEventListener('click', ()=> { filterFrom.value=''; filterTo.value=''; filterArtist.value=''; filterText.value=''; renderLedger(); });
function applyFilters(entries){
  return entries.filter(en => {
    if(filterArtist.value && en.artistId !== filterArtist.value) return false;
    if(filterFrom.value && en.date < filterFrom.value) return false;
    if(filterTo.value && en.date > filterTo.value) return false;
    if(filterText.value && !(en.notes||'').toLowerCase().includes(filterText.value.toLowerCase())) return false;
    return true;
  });
}

// Ledger
function renderLedger(){
  const entries = applyFilters(state.entries);
  ledgerTableBody.innerHTML='';
  const totals = { gross:0, shop:0, artist:0 };
  const artistMap = new Map(state.people.map(p=>[p.id,p]));
  const perArtist = {};

  entries.forEach(en=>{
    const p = artistMap.get(en.artistId);
    const name = p ? p.name : '(Unknown)';
    const emoji = p ? (p.emoji || '🙂') : '❓';
    const percent = p ? (Number(p.percent)||0) : 0;
    const percentIsShop = p ? !!p.percentIsShop : false;

    let shopCut, artistTake;
    if(percentIsShop){ shopCut = en.gross*(percent/100); artistTake = en.gross - shopCut; }
    else { artistTake = en.gross*(percent/100); shopCut = en.gross - artistTake; }

    totals.gross += en.gross; totals.shop += shopCut; totals.artist += artistTake;
    perArtist[name] = perArtist[name] || { gross:0, shop:0, artist:0, emoji };
    perArtist[name].gross += en.gross;
    perArtist[name].shop += shopCut;
    perArtist[name].artist += artistTake;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${en.date}</td>
      <td>${emoji} ${name}</td>
      <td>${fmtMoney(en.gross)}</td>
      <td>${percentIsShop ? 'Shop' : 'Artist'}</td>
      <td>${percent}%</td>
      <td>${fmtMoney(shopCut)}</td>
      <td>${fmtMoney(artistTake)}</td>
      <td>${(en.notes||'')}</td>
      <td><button class="btn del">🗑️</button></td>`;
    tr.querySelector('.del').addEventListener('click', ()=>{
      if(!confirm('Delete this entry?')) return;
      state.entries = state.entries.filter(x=>x.id!==en.id);
      saveState(state); renderLedger();
    });
    ledgerTableBody.appendChild(tr);
  });

  totalsBox.innerHTML='';
  const pill = (label,val)=>{ const d=document.createElement('div'); d.className='total-pill'; d.innerHTML=`<b>${label}</b><span>${val}</span>`; return d; };
  totalsBox.appendChild(pill('Gross (filtered)', fmtMoney(totals.gross)));
  totalsBox.appendChild(pill('Shop total', fmtMoney(totals.shop)));
  totalsBox.appendChild(pill('Artists total', fmtMoney(totals.artist)));
  Object.entries(perArtist).forEach(([name,v])=> totalsBox.appendChild(pill(`${v.emoji} ${name}`, `${fmtMoney(v.artist)} take`)));
}

// CSV Export
btnExportCSV.addEventListener('click', ()=>{
  const rows = [['date','artist','gross','percent_mode','percent','shop_cut','artist_take','notes']];
  const artistMap = new Map(state.people.map(p=>[p.id,p]));
  state.entries.forEach(en=>{
    const p = artistMap.get(en.artistId);
    const name = p ? p.name : '(Unknown)';
    const percent = p ? (Number(p.percent)||0) : 0;
    const percentIsShop = p ? !!p.percentIsShop : false;
    let shopCut, artistTake;
    if(percentIsShop){ shopCut = en.gross*(percent/100); artistTake = en.gross - shopCut; }
    else { artistTake = en.gross*(percent/100); shopCut = en.gross - artistTake; }
    rows.push([en.date, name, en.gross, percentIsShop?'shop':'artist', percent, shopCut, artistTake, (en.notes||'')]);
  });
  downloadCSV(rows, 'shopcut-export.csv');
});
function downloadCSV(rows, filename){
  const csv = rows.map(r=> r.map(v=> (typeof v==='string' && (v.includes(',')||v.includes('"')||v.includes('\n'))) ? '"' + v.replace(/"/g,'""') + '"' : v ).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
}

// CSV Import
inputImport.addEventListener('change', async (e)=>{
  const file = e.target.files[0]; if(!file) return;
  const text = await file.text();
  const rows = parseCSV(text);
  const header = rows.shift().map(h=>h.toLowerCase().trim());
  const col = (name)=> header.indexOf(name);
  const cDate = col('date'), cArtist = col('artist'), cGross = col('gross'), cNotes = col('notes');
  let added = 0;
  rows.forEach(r=>{
    const date = r[cDate] || todayStr();
    const name = r[cArtist] || '';
    const gross = Number(r[cGross] || '0');
    const notes = r[cNotes] || '';
    if(!name || isNaN(gross) || gross<=0) return;
    let person = state.people.find(p=> p.name.toLowerCase()===name.toLowerCase());
    if(!person){ person = { id: uid(), name, emoji:'', percent:60, percentIsShop:false }; state.people.push(person); }
    state.entries.unshift({ id: uid(), date, artistId: person.id, gross, notes }); added++;
  });
  saveState(state); renderPeople(); renderPeopleSelects(); renderLedger();
  alert(`Imported ${added} entries.`); e.target.value='';
});
function parseCSV(text){
  const rows = []; let row=[], val='', inQuotes=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(inQuotes){
      if(c==='"'){ if(text[i+1]==='"'){ val+='"'; i++; } else { inQuotes=false; } }
      else { val+=c; }
    } else {
      if(c===','){ row.push(val); val=''; }
      else if(c==='\n' || c==='\r'){ if(val!=='' || row.length){ row.push(val); rows.push(row); row=[]; val=''; } }
      else if(c==='"'){ inQuotes=true; }
      else { val+=c; }
    }
  }
  if(val!=='' || row.length){ row.push(val); rows.push(row); }
  return rows;
}

// Weekly report
btnWeekly.addEventListener('click', ()=> weeklyModal.showModal());
btnBuildWeekly.addEventListener('click', (e)=>{ e.preventDefault(); buildWeekly(); });
btnCopyWeekly.addEventListener('click', (e)=>{ e.preventDefault(); weeklyText.select(); document.execCommand('copy'); });
btnMailWeekly.addEventListener('click', (e)=>{ e.preventDefault(); const body=encodeURIComponent(weeklyText.value); const subj=encodeURIComponent('Weekly ShopCut Report'); window.location.href=`mailto:?subject=${subj}&body=${body}`; });

function buildWeekly(){
  const start = new Date(weekStart.value || todayStr());
  const end = new Date(start); end.setDate(start.getDate()+7);
  const startStr = start.toISOString().slice(0,10);
  const endStr = end.toISOString().slice(0,10);
  const entries = state.entries.filter(e=> e.date >= startStr && e.date < endStr);
  const artistMap = new Map(state.people.map(p=>[p.id,p]));

  let grossT=0, shopT=0, artistT=0;
  const per = {};
  for(const en of entries){
    const p = artistMap.get(en.artistId);
    const percent = p ? (Number(p.percent)||0) : 0;
    const isShop = p ? !!p.percentIsShop : false;
    let shopCut, artistTake;
    if(isShop){ shopCut = en.gross*(percent/100); artistTake = en.gross - shopCut; }
    else { artistTake = en.gross*(percent/100); shopCut = en.gross - artistTake; }
    grossT += en.gross; shopT += shopCut; artistT += artistTake;
    const name = p ? p.name : '(Unknown)';
    per[name] = per[name] || { gross:0, shop:0, artist:0, emoji: (p?.emoji || '') };
    per[name].gross += en.gross; per[name].shop += shopCut; per[name].artist += artistTake;
  }

  const lines = [];
  lines.push(`ShopCut Weekly Report`);
  lines.push(`${startStr} – ${new Date(end.getTime()-86400000).toISOString().slice(0,10)}`);
  lines.push('');
  lines.push(`Gross: ${fmtMoney(grossT)}`);
  lines.push(`Shop:  ${fmtMoney(shopT)}`);
  lines.push(`Artist:${fmtMoney(artistT)}`);
  lines.push(''); lines.push('By Artist:');
  Object.entries(per).forEach(([name,v])=> lines.push(`  ${v.emoji ? v.emoji+' ' : ''}${name}: gross ${fmtMoney(v.gross)} | shop ${fmtMoney(v.shop)} | take ${fmtMoney(v.artist)}`));
  lines.push(''); lines.push('Entries:');
  entries.sort((a,b)=> a.date.localeCompare(b.date)).forEach(en=>{
    const p = artistMap.get(en.artistId); const name = p ? p.name : '(Unknown)';
    lines.push(`  ${en.date} — ${name} — gross ${fmtMoney(en.gross)} ${en.notes ? '— '+en.notes : ''}`);
  });
  weeklyText.value = lines.join('\n');
}

// Seed sample entries if empty
if(state.entries.length===0){
  const alex = state.people[0];
  const today = todayStr();
  const y1 = new Date(); y1.setDate(y1.getDate()-1);
  const y2 = new Date(); y2.setDate(y2.getDate()-2);
  const d1 = y1.toISOString().slice(0,10);
  const d2 = y2.toISOString().slice(0,10);
  state.entries = [
    { id: uid(), date: today, artistId: alex.id, gross: 450, notes: 'Black & grey forearm' },
    { id: uid(), date: d1, artistId: alex.id, gross: 320, notes: 'Neo-trad peony' },
    { id: uid(), date: d2, artistId: alex.id, gross: 780, notes: 'Sleeve session' },
  ];
  saveState(state);
}

// Quick add on Enter in notes
entryNotes.addEventListener('keydown', (e)=>{ if(e.key==='Enter' && entryGross.value){ entryForm.requestSubmit(); } });
