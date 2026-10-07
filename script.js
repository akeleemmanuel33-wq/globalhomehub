/* ============ CONFIG ============
   1. Get a free access key at https://web3forms.com (it is emailed to you).
   2. Paste it below. Access keys are public by design, so it is safe in client code.
   3. In the Web3Forms dashboard, restrict the key to your domain if your plan allows it. */
const CONFIG = {
  accessKey: '6095390a-3501-4623-9c85-f75cc7c51973',
  endpoint: 'https://api.web3forms.com/submit',
  subject: 'New rental application',
  fromName: 'Rental Application Website',
  timeoutMs: 20000
};

const $ = (s, r = document) => r.querySelector(s);
const form = $('#app'), sets = [...form.querySelectorAll('fieldset')];
const next = $('#next'), nextLabel = $('#nextLabel'), back = $('#back'), msg = $('#msg');
const last = sets.length - 1;
let cur = 0, busy = false;

/* ---------- Theme toggle ---------- */
const root = document.documentElement, themeBtn = $('#theme');
function applyTheme(t, save) {
  root.dataset.theme = t;
  themeBtn.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  if (save) { try { localStorage.setItem('theme', t); } catch (e) {} }
}
applyTheme(root.dataset.theme);
themeBtn.addEventListener('click', () => {
  root.classList.add('theming');
  applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true);
  setTimeout(() => root.classList.remove('theming'), 500);
});

/* ---------- Content ---------- */
const countries = ['Nigeria','Ghana','Kenya','South Africa','United States','United Kingdom','Canada','Australia','Germany','France','India','United Arab Emirates','Other'];
$('#co').innerHTML = '<option value="" disabled selected>Select a country</option>' + countries.map(c => `<option>${c}</option>`).join('');

const plans = [['550 sq. ft.','Junior 1 bed / 1 bath',1],['750 sq. ft.','1 bed / 1 bath',1],['1,000 sq. ft.','2 bed / 1.5 bath',2],['1,140 sq. ft.','2 bed / 2 bath',2],['1,500 sq. ft.','3 bed / 2 bath',3]];
$('#plans').innerHTML = plans.map((p, i) => {
  const w = 50 + p[2] * 30;
  return `<div><input type="radio" id="fp${i}" name="Floor Plan" value="${p[0]} ${p[1]}" ${i === 0 ? 'required' : ''}>
  <label class="plan" for="fp${i}"><svg viewBox="0 0 170 54" aria-hidden="true"><rect x="2" y="2" width="${w}" height="50" rx="4"/><path d="M${w / 2 + 2} 2v20M2 22h${w}"/>${p[2] > 1 ? `<rect x="${w + 8}" y="22" width="${p[2] * 16}" height="30" rx="4"/>` : ''}</svg>
  <strong>${p[0]}</strong><span>${p[1]}</span></label></div>`;
}).join('');

const bg = [['Have you been convicted of a felony?', 'Felony'], ['Have you ever been evicted?', 'Evicted'], ['Have you ever declared bankruptcy?', 'Bankruptcy']];
$('#bg').innerHTML = bg.map((x, i) => `<div class="f full"><span class="lbl">${x[0]}</span>
  <div class="seg"><input type="radio" id="b${i}y" name="${x[1]}" value="Yes" required><label for="b${i}y">Yes</label>
  <input type="radio" id="b${i}n" name="${x[1]}" value="No"><label for="b${i}n">No</label></div></div>`).join('');

/* Progress indicator */
const steps = [['user','About you'],['briefcase','Work'],['home','Home'],['shield','Background'],['pen','Sign']];
$('#progress').innerHTML = steps.map((s, i) =>
  `<li><button type="button" data-i="${i}" aria-label="${s[1]}" tabindex="-1"><svg class="ic"><use href="#i-${s[0]}"/></svg></button><span>${s[1]}</span></li>`).join('');
$('#progress').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (b && +b.dataset.i < cur) show(+b.dataset.i);
});

/* ---------- Conditional fields ---------- */
const reveal = (sel, on) => document.querySelectorAll(sel).forEach(el => {
  el.hidden = !on;
  const f = el.querySelector('input,textarea'); if (f) f.required = on;
});
form.addEventListener('change', e => {
  const n = e.target.name;
  if (n === 'Employed') reveal('.job', e.target.value === 'Yes');
  if (n === 'Pets') reveal('.pet', e.target.value === 'Yes');
  if (bg.some(x => x[1] === n)) {
    const any = bg.some(x => form.elements[x[1]].value === 'Yes');
    reveal('#why', any);
  }
});
$('#mv').min = new Date().toISOString().split('T')[0];
$('#sg').addEventListener('input', e => $('#sigPrev').textContent = e.target.value);

/* ---------- Steps ---------- */
function show(n, scroll = true) {
  const dir = n >= cur ? 'fwd' : 'bwd';
  cur = n;
  sets.forEach((s, i) => {
    s.hidden = i !== n;
    s.classList.remove('fwd', 'bwd');
    if (i === n) { void s.offsetWidth; s.classList.add(dir); }
  });
  [...$('#progress').children].forEach((li, i) => {
    li.classList.toggle('on', i === n);
    li.classList.toggle('done', i < n);
    const b = li.firstChild; b.tabIndex = i < n ? 0 : -1;
    if (i === n) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    b.innerHTML = `<svg class="ic"><use href="#i-${i < n ? 'check' : steps[i][0]}"/></svg>`;
  });
  $('#progress').style.setProperty('--p', (n / last * 100) + '%');
  back.hidden = n === 0;
  nextLabel.textContent = n === last ? 'Submit application' : 'Continue';
  if (n === last) buildReview();
  setMsg('');
  if (scroll) $('#card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function buildReview() {
  const d = Object.fromEntries(new FormData(form));
  const rows = [['Name', `${d['First Name']} ${d['Last Name']}`], ['Email', d.email], ['Phone', d.Phone],
    ['Floor plan', d['Floor Plan']], ['Move-in date', d['Move-in Date']]];
  $('#review').innerHTML = rows.map(r => `<dt>${r[0]}</dt><dd></dd>`).join('');
  [...$('#review').querySelectorAll('dd')].forEach((dd, i) => dd.textContent = rows[i][1] || '-');
}

function setMsg(text) {
  msg.innerHTML = '';
  if (!text) return;
  msg.innerHTML = '<svg class="ic"><use href="#i-alert"/></svg><span></span>';
  msg.lastChild.textContent = text;
}

function valid() {
  for (const el of sets[cur].querySelectorAll('input,select,textarea')) {
    if (el.closest('[hidden]') || el.name === 'botcheck') continue;
    if (!el.checkValidity()) {
      const target = el.type === 'radio' ? el.closest('.seg,.plans') : el;
      target.classList.add('bad');
      setTimeout(() => target.classList.remove('bad'), 1600);
      (el.type === 'radio' ? target : el).scrollIntoView({ behavior: 'smooth', block: 'center' });
      setMsg(el.type === 'radio' ? 'Choose an option to continue.' : 'Complete this field to continue.');
      if (el.type !== 'radio') el.focus({ preventScroll: true });
      return false;
    }
  }
  setMsg('');
  return true;
}

back.addEventListener('click', () => show(cur - 1));

/* ---------- Submit (Web3Forms) ---------- */
function setBusy(on) {
  busy = on; next.disabled = on; back.disabled = on;
  next.querySelector('svg').innerHTML = `<use href="#i-${on ? 'loader' : 'right'}"/>`;
  next.querySelector('svg').classList.toggle('spin', on);
  nextLabel.textContent = on ? 'Sending' : 'Submit application';
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  if (busy || !valid()) return;
  if (cur < last) return show(cur + 1);

  if (CONFIG.accessKey.startsWith('YOUR_')) {
    return setMsg('Add your Web3Forms access key in script.js before submitting.');
  }

  setBusy(true);
  const data = Object.fromEntries(new FormData(form));   // radios give one value; unchecked honeypot is omitted
  data.access_key = CONFIG.accessKey;
  data.name = `${data['First Name']} ${data['Last Name']}`.trim();  // Web3Forms uses "name" and "email" for sender info
  data.subject = `${CONFIG.subject}: ${data.name}`;
  data.from_name = CONFIG.fromName;
  data['Submitted At'] = new Date().toLocaleString();

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CONFIG.timeoutMs);
  try {
    const res = await fetch(CONFIG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data),
      signal: ctrl.signal
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) throw new Error(json.message || `Request failed (${res.status})`);
    done();
  } catch (err) {
    setBusy(false);
    setMsg(err.name === 'AbortError' ? 'The request timed out. Check your connection and try again.'
      : err instanceof TypeError ? 'Could not reach the server. Check your connection and try again.'
      : `We couldn't send your application: ${err.message}`);
  } finally { clearTimeout(timer); }
});

function done() {
  [...$('#progress').children].forEach(li => {
    li.className = 'done'; li.firstChild.innerHTML = '<svg class="ic"><use href="#i-check"/></svg>'; li.firstChild.tabIndex = -1;
  });
  $('#progress').style.setProperty('--p', '100%');
  form.innerHTML = `<div class="ok"><div class="ring"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l5 5L19 7"/></svg></div>
    <h2>Application received</h2><p>Thank you. Our team will review it and contact you by email or phone within a few business days.</p></div>`;
  $('#card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------- Photo slideshow ----------
   Slides are plain <img> tags in index.html. Replace each src with your own photo. */
const INTERVAL = 5000;
const showEl = $('#show'), dotsEl = $('#dots'), pp = $('#pp');
const slideEls = [...document.querySelectorAll('#slides .slide')];
showEl.style.setProperty('--iv', INTERVAL + 'ms');
dotsEl.innerHTML = slideEls.map((s, i) => `<button type="button" class="dot" aria-label="Show photo ${i + 1}"><i></i></button>`).join('');
const dotEls = [...dotsEl.children];
slideEls.forEach(el => {
  const img = el.querySelector('img'), miss = () => el.classList.add('missing');
  img.addEventListener('error', miss);
  if (img.complete && !img.naturalWidth) miss();
});

let idx = 0, playing = true, timer;
function restartDot() { const d = dotEls[idx]; d.classList.remove('on'); void d.offsetWidth; d.classList.add('on'); }
function schedule() {
  clearTimeout(timer);
  if (playing && !document.hidden && slideEls.length > 1) timer = setTimeout(() => go(idx + 1), INTERVAL);
}
function go(n) {
  idx = (n + slideEls.length) % slideEls.length;
  slideEls.forEach((el, i) => { el.classList.toggle('on', i === idx); el.setAttribute('aria-hidden', i !== idx); });
  dotEls.forEach((d, i) => { if (i !== idx) d.classList.remove('on'); });
  restartDot(); schedule();
}
function setPlaying(on) {
  playing = on;
  showEl.classList.toggle('hold', !on);
  pp.setAttribute('aria-label', on ? 'Pause slideshow' : 'Play slideshow');
  pp.querySelector('svg').innerHTML = `<use href="#i-${on ? 'pause' : 'play'}"/>`;
  if (on) restartDot();
  schedule();
}
$('#prev').addEventListener('click', () => go(idx - 1));
$('#nxt').addEventListener('click', () => go(idx + 1));
dotEls.forEach((d, i) => d.addEventListener('click', () => go(i)));
pp.addEventListener('click', () => setPlaying(!playing));
showEl.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') go(idx - 1);
  if (e.key === 'ArrowRight') go(idx + 1);
});
let sx = null;
showEl.addEventListener('pointerdown', e => { sx = e.clientX; });
showEl.addEventListener('pointerup', e => {
  if (sx !== null && Math.abs(e.clientX - sx) > 50) go(idx + (e.clientX < sx ? 1 : -1));
  sx = null;
});
document.addEventListener('visibilitychange', schedule);
setPlaying(playing);
go(0);

show(0, false);