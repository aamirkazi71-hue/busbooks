/* =====================================================================
   BusBooks — the app itself (screens, forms, reports).
   Data is saved through window.Store (see store.js).
   ===================================================================== */
(function () {
  'use strict';

  const Store = window.Store;
  const CFG = window.APP_CONFIG || {};
  const APP_NAME = CFG.appName || 'BusBooks';
  const $ = (sel, root) => (root || document).querySelector(sel);

  /* ---------- What money can be for ---------- */
  const CATS = {
    expense: [
      { id: 'diesel', label: 'Diesel / Fuel', icon: '⛽' },
      { id: 'maintenance', label: 'Repairs & Service', icon: '🔧' },
      { id: 'tyres', label: 'Tyres', icon: '🛞' },
      { id: 'salary', label: 'Staff Salary', icon: '👷' },
      { id: 'emi', label: 'Loan EMI', icon: '🏦' },
      { id: 'insurance', label: 'Insurance', icon: '🛡️' },
      { id: 'tax', label: 'Permits & Tax', icon: '📄' },
      { id: 'toll', label: 'Tolls & Parking', icon: '🅿️' },
      { id: 'other_expense', label: 'Other Expense', icon: '📦' },
    ],
    income: [
      { id: 'school_rent', label: 'School Rent', icon: '🏫' },
      { id: 'extra_trip', label: 'Extra Trip / Hire', icon: '🚌' },
      { id: 'other_income', label: 'Other Income', icon: '💰' },
    ],
  };
  const CAT_MAP = {};
  CATS.expense.concat(CATS.income).forEach((c) => { CAT_MAP[c.id] = c; });
  const cat = (id) => CAT_MAP[id] || { id, label: id || 'Other', icon: '•' };

  const ROLES = ['Driver', 'Conductor', 'Lady Attendant', 'Mechanic', 'Office / Manager', 'Other'];

  /* ---------- Documents ----------
     "expires: true" means the app tracks the expiry date and reminds you.
     "cost" is the expense type used if you enter a renewal cost.
     "roles" limits a document to certain jobs (e.g. license only for drivers). */
  const DOC_TYPES = {
    bus: [
      { id: 'insurance', label: 'Insurance', icon: '🛡️', expires: true, cost: 'insurance' },
      { id: 'puc', label: 'PUC', icon: '💨', expires: true, cost: 'tax' },
      { id: 'road_tax', label: 'Road Tax', icon: '📄', expires: true, cost: 'tax' },
      { id: 'fitness', label: 'Fitness Certificate', icon: '✅', expires: true, cost: 'tax' },
      { id: 'permit', label: 'Permit', icon: '🪪', expires: true, cost: 'tax' },
    ],
    staff: [
      { id: 'license', label: 'Driving License', icon: '🚘', expires: true, roles: ['Driver'] },
      { id: 'aadhaar', label: 'Aadhaar Card', icon: '🆔' },
      { id: 'pan', label: 'PAN Card', icon: '💳' },
      { id: 'light_bill', label: 'Light Bill', icon: '💡' },
      { id: 'cv', label: 'CV / Resume', icon: '📝' },
    ],
  };
  const docDef = (ownerType, id) => (DOC_TYPES[ownerType] || []).find((t) => t.id === id);

  const CURRENCIES = [
    ['INR', 'Indian Rupee (₹)'], ['PKR', 'Pakistani Rupee (Rs)'], ['BDT', 'Bangladeshi Taka (৳)'],
    ['LKR', 'Sri Lankan Rupee'], ['NPR', 'Nepalese Rupee'], ['AED', 'UAE Dirham'], ['SAR', 'Saudi Riyal'],
    ['NGN', 'Nigerian Naira (₦)'], ['KES', 'Kenyan Shilling'], ['ZAR', 'South African Rand'],
    ['USD', 'US Dollar ($)'], ['EUR', 'Euro (€)'], ['GBP', 'British Pound (£)'],
    ['CAD', 'Canadian Dollar'], ['AUD', 'Australian Dollar'],
  ];

  function guessCurrency() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const byTz = {
        'Asia/Kolkata': 'INR', 'Asia/Calcutta': 'INR', 'Asia/Karachi': 'PKR', 'Asia/Dhaka': 'BDT',
        'Asia/Colombo': 'LKR', 'Asia/Kathmandu': 'NPR', 'Asia/Dubai': 'AED', 'Asia/Riyadh': 'SAR',
        'Africa/Lagos': 'NGN', 'Africa/Nairobi': 'KES', 'Africa/Johannesburg': 'ZAR', 'Europe/London': 'GBP',
      };
      if (byTz[tz]) return byTz[tz];
      const region = ((navigator.language || '').split('-')[1] || '').toUpperCase();
      const byRegion = { IN: 'INR', PK: 'PKR', BD: 'BDT', LK: 'LKR', NP: 'NPR', AE: 'AED', SA: 'SAR', NG: 'NGN', KE: 'KES', ZA: 'ZAR', GB: 'GBP', CA: 'CAD', AU: 'AUD', DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', IE: 'EUR' };
      return byRegion[region] || 'USD';
    } catch (e) { return 'USD'; }
  }

  /* ---------- Icons ---------- */
  const svg = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const ICON = {
    home: svg('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>'),
    list: svg('<path d="M9 6h12M9 12h12M9 18h12"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>'),
    bus: svg('<rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 11h16M8 15h.01M16 15h.01M7 18v3M17 18v3"/>'),
    users: svg('<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6"/><path d="M16 4.5a4 4 0 0 1 0 7"/><path d="M22 21c0-3-1.5-5-4-5.7"/>'),
    chart: svg('<path d="M3 21h18"/><path d="M6 17v-6M10 17V5M14 17v-8M18 17v-4"/>'),
    gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    minus: svg('<path d="M5 12h14"/>'),
    left: svg('<path d="M15 18l-6-6 6-6"/>'),
    right: svg('<path d="M9 18l6-6-6-6"/>'),
    x: svg('<path d="M18 6L6 18M6 6l12 12"/>'),
    download: svg('<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>'),
    print: svg('<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>'),
    bell: svg('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>'),
    file: svg('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>'),
    logout: svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'),
  };
  const LOGO = `<svg viewBox="0 0 512 512" aria-hidden="true"><rect width="512" height="512" rx="112" fill="#0f766e"/><rect x="116" y="96" width="280" height="272" rx="44" fill="#fff"/><rect x="148" y="136" width="216" height="104" rx="16" fill="#0f766e"/><circle cx="184" cy="300" r="22" fill="#0f766e"/><circle cx="328" cy="300" r="22" fill="#0f766e"/><rect x="150" y="368" width="54" height="48" rx="12" fill="#fff"/><rect x="308" y="368" width="54" height="48" rx="12" fill="#fff"/><rect x="226" y="290" width="60" height="20" rx="10" fill="#0f766e"/></svg>`;

  const NAV = [['home', 'Home', 'home'], ['history', 'History', 'list'], ['buses', 'Buses', 'bus'], ['staff', 'Staff', 'users'], ['reports', 'Reports', 'chart']];
  const TITLES = { home: 'Home', history: 'History', buses: 'My Buses', staff: 'Staff', reports: 'Reports', documents: 'Documents', settings: 'Settings' };

  /* ---------- State ---------- */
  let user = null;
  let data = emptyData();
  const ui = {
    month: monthOf(todayStr()),
    year: new Date().getFullYear(),
    filter: 'all',
    busFilter: '',
    reportMode: 'month',
    docTab: 'bus',
    authTab: 'login',
    pendingEmail: '',
    recovery: false,
  };
  function emptyData() { return { profile: {}, buses: [], staff: [], entries: [], documents: [] }; }

  /* ---------- Small helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function todayStr() { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function monthOf(ds) { return String(ds || '').slice(0, 7); }
  function shiftMonth(mk, n) {
    let [y, m] = mk.split('-').map(Number);
    m += n;
    while (m > 12) { m -= 12; y++; }
    while (m < 1) { m += 12; y--; }
    return y + '-' + pad(m);
  }
  function mkDate(mk) { const [y, m] = mk.split('-').map(Number); return new Date(y, m - 1, 1); }
  function monthLabel(mk) { return mkDate(mk).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }); }
  function monthShort(mk) { return mkDate(mk).toLocaleDateString(undefined, { month: 'short' }); }
  function lastDay(mk) { const [y, m] = mk.split('-').map(Number); return mk + '-' + pad(new Date(y, m, 0).getDate()); }
  function defaultDateFor(mk) {
    const t = todayStr();
    if (monthOf(t) === mk) return t;
    return mk < monthOf(t) ? lastDay(mk) : mk + '-01';
  }
  function dateLabel(ds) {
    if (!ds) return '';
    const [y, m, d] = ds.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  }
  function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }
  function num(v) { const n = parseFloat(v); return isFinite(n) ? round2(n) : 0; }

  function money(n) {
    n = round2(n);
    const c = data.profile.currency || 'USD';
    const dec = Number.isInteger(n) ? 0 : 2;
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: c, minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);
    } catch (e) { return c + ' ' + n.toFixed(dec); }
  }
  function currencySymbol() {
    const c = data.profile.currency || 'USD';
    try {
      const part = new Intl.NumberFormat(undefined, { style: 'currency', currency: c }).formatToParts(0).find((p) => p.type === 'currency');
      return part ? part.value : c;
    } catch (e) { return c; }
  }
  function pct(m) { return m === null || !isFinite(m) ? '–' : Math.round(m) + '%'; }

  const isInc = (e) => e.type === 'income';
  const total = (list) => list.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  function summary(list) {
    const inc = total(list.filter(isInc));
    const exp = total(list.filter((e) => !isInc(e)));
    return { inc, exp, profit: inc - exp, margin: inc > 0 ? ((inc - exp) / inc) * 100 : null };
  }
  const inMonth = (mk) => data.entries.filter((e) => monthOf(e.date) === mk);
  const inYear = (y) => data.entries.filter((e) => String(e.date || '').slice(0, 4) === String(y));
  const busById = (id) => data.buses.find((b) => b.id === id);
  const staffById = (id) => data.staff.find((s) => s.id === id);
  const busName = (id) => { const b = busById(id); return b ? b.name : ''; };
  /* ---------- Document expiry helpers ---------- */
  function daysUntil(ds) {
    const [y, m, d] = String(ds).split('-').map(Number);
    const t = new Date();
    return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(t.getFullYear(), t.getMonth(), t.getDate())) / 86400000);
  }
  function fullDate(ds) {
    const [y, m, d] = String(ds).split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }
  const remindDays = () => Number(data.profile.remind_days) || 30;
  const findDoc = (ownerType, ownerId, docType) =>
    data.documents.find((d) => d.owner_type === ownerType && d.owner_id === ownerId && d.doc_type === docType);
  const ownerOf = (ownerType, id) => (ownerType === 'bus' ? busById(id) : staffById(id));
  function docTypesFor(ownerType, owner) {
    if (ownerType === 'bus') return DOC_TYPES.bus;
    return DOC_TYPES.staff.filter((t) => !t.roles || t.roles.includes(owner.role) || findDoc('staff', owner.id, t.id));
  }
  function docStatus(def, d) {
    if (!d) return { cls: '', text: 'Not added', level: 0 };
    if (!def.expires) return d.file_path || d.number ? { cls: 'tag-ok', text: 'Saved', level: 0 } : { cls: '', text: 'Not added', level: 0 };
    if (!d.expiry_date) return { cls: 'tag-warn', text: 'Add expiry date', level: 0 };
    const n = daysUntil(d.expiry_date);
    const days = (x) => x + ' day' + (x === 1 ? '' : 's');
    if (n < 0) return { cls: 'tag-bad', text: 'Expired ' + days(-n) + ' ago', level: 3, days: n };
    if (n === 0) return { cls: 'tag-bad', text: 'Expires today', level: 3, days: n };
    if (n <= 7) return { cls: 'tag-bad', text: 'Expires in ' + days(n), level: 2, days: n };
    if (n <= remindDays()) return { cls: 'tag-warn', text: 'Expires in ' + days(n), level: 1, days: n };
    return { cls: 'tag-ok', text: 'Valid till ' + fullDate(d.expiry_date), level: 0, days: n };
  }
  function docAlerts() {
    const out = [];
    data.documents.forEach((d) => {
      const def = docDef(d.owner_type, d.doc_type);
      const owner = ownerOf(d.owner_type, d.owner_id);
      if (!def || !owner || !def.expires || !d.expiry_date) return;
      const st = docStatus(def, d);
      if (st.level > 0) out.push({ d, def, owner, st });
    });
    return out.sort((a, b) => a.st.days - b.st.days);
  }

  /* ---------- Phone notifications ---------- */
  function notifState() { return 'Notification' in window ? Notification.permission : 'unsupported'; }
  function checkReminders(force) {
    if (!user || notifState() !== 'granted') return;
    const key = 'bb_notified_' + user.id;
    const today = todayStr();
    try { if (!force && localStorage.getItem(key) === today) return; } catch (e) { /* ignore */ }
    const alerts = docAlerts();
    if (!alerts.length) return;
    try { localStorage.setItem(key, today); } catch (e) { /* ignore */ }
    const title = alerts.length === 1 ? `${alerts[0].def.label} – ${alerts[0].owner.name}` : `${alerts.length} documents need renewal`;
    const body = alerts.slice(0, 4).map((a) => `${a.def.label} (${a.owner.name}): ${a.st.text}`).join('\n');
    const opts = { body, icon: 'icon.svg', badge: 'icon.svg', tag: 'doc-expiry', data: { url: './#/documents' } };
    const fallback = () => { try { new Notification(title, opts); } catch (e) { /* not supported here */ } };
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.getRegistration().then((reg) => (reg ? reg.showNotification(title, opts) : fallback())).catch(fallback);
    } else fallback();
  }

  const byDateDesc = (a, b) => String(b.date).localeCompare(String(a.date)) || String(b.created_at || '').localeCompare(String(a.created_at || ''));

  let toastTimer;
  function toast(msg, kind) {
    const t = $('#toast');
    t.textContent = msg;
    t.className = 'show ' + (kind || '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = ''; }, kind === 'error' ? 4000 : 2600);
  }
  function friendly(err) {
    const m = (err && (err.message || err.error_description)) || String(err);
    if (/Invalid login credentials/i.test(m)) return 'Wrong email or password.';
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'No internet connection. Please check and try again.';
    if (/Email not confirmed/i.test(m)) return 'Please confirm your email first — check your inbox.';
    if (/already registered|already exists/i.test(m)) return 'This email already has an account. Please log in.';
    if (/rate limit/i.test(m)) return 'Too many tries. Please wait a minute and try again.';
    return m;
  }

  /* ---------- Bottom sheet (pop-up) ---------- */
  let pendingConfirm = null;
  function openSheet(html) {
    const root = $('#sheet-root');
    root.innerHTML = `<div class="sheet-backdrop" data-action="close-sheet"></div><div class="sheet" role="dialog" aria-modal="true" tabindex="-1">${html}</div>`;
    root.classList.add('open');
    document.body.classList.add('no-scroll');
    $('.sheet', root).focus({ preventScroll: true });
  }
  function closeSheet() {
    const root = $('#sheet-root');
    root.innerHTML = '';
    root.classList.remove('open');
    document.body.classList.remove('no-scroll');
    if (pendingConfirm) { const r = pendingConfirm; pendingConfirm = null; r(false); }
  }
  function sheetHead(title) {
    return `<div class="sheet-head"><h2>${esc(title)}</h2><button type="button" class="icon-btn" data-action="close-sheet" aria-label="Close">${ICON.x}</button></div>`;
  }
  function confirmBox(title, message, okLabel, danger) {
    return new Promise((resolve) => {
      openSheet(`<div class="confirm"><h2>${esc(title)}</h2><p>${esc(message)}</p>
        <div class="sheet-actions"><button type="button" class="btn btn-wide" data-action="confirm-no">Cancel</button>
        <button type="button" class="btn btn-wide ${danger === false ? 'btn-primary' : 'btn-danger'}" data-action="confirm-yes">${esc(okLabel || 'Delete')}</button></div></div>`);
      pendingConfirm = resolve;
    });
  }

  /* =====================================================================
     RENDER
     ===================================================================== */
  function currentRoute() {
    const r = (location.hash || '').replace(/^#\/?/, '').split(/[?&=]/)[0];
    return TITLES[r] ? r : 'home';
  }
  function go(r) {
    if (currentRoute() === r) render();
    else location.hash = '#/' + r;
  }

  function render() {
    const app = $('#app');
    if (!user || ui.recovery) { app.innerHTML = authScreen(); return; }
    const r = currentRoute();
    const screens = { home: screenHome, history: screenHistory, buses: screenBuses, staff: screenStaff, reports: screenReports, documents: screenDocuments, settings: screenSettings };
    app.innerHTML = shell(r, screens[r]());
    document.title = TITLES[r] + ' · ' + APP_NAME;
  }

  function shell(r, inner) {
    const link = ([id, label, icon], extra) =>
      `<a href="#/${id}" class="nav-item ${r === id ? 'active' : ''}" ${r === id ? 'aria-current="page"' : ''}>${ICON[icon]}<span>${label}</span>${extra || ''}</a>`;
    const nav = NAV.map((n) => link(n)).join('');
    const alertsN = docAlerts().length;
    const badge = alertsN ? `<span class="badge">${alertsN}</span>` : '';
    return `
      ${Store.mode === 'demo' ? '<div class="demo-banner">Demo mode · data is saved only on this device</div>' : ''}
      <div class="layout">
        <aside class="sidebar">
          <div class="brand">${LOGO}<span>${esc(APP_NAME)}</span></div>
          <nav class="side-nav" aria-label="Main">${nav}${link(['documents', 'Documents', 'file'], badge)}${link(['settings', 'Settings', 'gear'])}</nav>
          <div class="side-foot"><b>${esc(data.profile.business_name || '')}</b><br><small>${esc(user.email || '')}</small></div>
        </aside>
        <div class="main">
          <header class="topbar">
            <div class="topbar-title"><span class="brand-dot">${LOGO}</span><h1>${esc(TITLES[r])}</h1></div>
            <div class="topbar-actions">
              <a href="#/documents" class="icon-btn bell" aria-label="Documents and reminders${alertsN ? ', ' + alertsN + ' need attention' : ''}">${ICON.bell}${badge}</a>
              <a href="#/settings" class="icon-btn" aria-label="Settings">${ICON.gear}</a>
            </div>
          </header>
          <main class="content">${inner}</main>
        </div>
      </div>
      <nav class="tabbar" aria-label="Main">${nav}${link(['documents', 'Docs', 'file'], badge)}</nav>
      <button class="fab" ${['home', 'settings', 'documents'].includes(r) ? 'hidden' : ''} data-action="quick-add" aria-label="Add money in or money out">${ICON.plus}</button>`;
  }

  function monthSwitch() {
    const isCur = ui.month === monthOf(todayStr());
    return `<div class="month-switch">
      <button class="icon-btn" data-action="prev-month" aria-label="Previous month">${ICON.left}</button>
      <div class="center"><strong>${monthLabel(ui.month)}</strong>
        ${isCur ? '<small class="muted">This month</small>' : '<button class="link-btn small" data-action="this-month">Back to this month</button>'}</div>
      <button class="icon-btn" data-action="next-month" aria-label="Next month">${ICON.right}</button>
    </div>`;
  }

  function emptyState(icon, title, text, button) {
    return `<div class="empty"><div class="big">${icon}</div><h3>${esc(title)}</h3><p>${esc(text)}</p>${button || ''}</div>`;
  }

  function statCards(s) {
    let sub;
    if (s.margin === null) sub = 'No income recorded yet';
    else if (s.profit < 0) sub = 'You spent more than you earned';
    else sub = `Margin ${pct(s.margin)} · you keep ${Math.round(s.margin)} of every 100 earned`;
    return `<div class="stats">
      <div class="stat stat-in"><span class="stat-label">Money In</span><strong>${money(s.inc)}</strong></div>
      <div class="stat stat-out"><span class="stat-label">Money Out</span><strong>${money(s.exp)}</strong></div>
      <div class="stat stat-profit ${s.profit < 0 ? 'is-loss' : ''}"><span class="stat-label">${s.profit < 0 ? 'Loss' : 'Profit'}</span><strong>${money(Math.abs(s.profit))}</strong><span class="stat-sub">${sub}</span></div>
    </div>`;
  }

  function entryRow(e, hideDate) {
    const c = cat(e.category);
    const st = staffById(e.staff_id);
    const sub = [hideDate ? '' : dateLabel(e.date), busName(e.bus_id), st ? st.name : '', e.liters ? e.liters + ' L' : '', e.note]
      .filter(Boolean).map(esc).join(' · ');
    return `<button class="entry" data-action="edit-entry" data-id="${esc(e.id)}">
      <span class="entry-icon ${e.type}">${c.icon}</span>
      <span class="entry-main"><span class="entry-title">${esc(c.label)}</span><span class="entry-sub">${sub || '&nbsp;'}</span></span>
      <span class="entry-amt ${e.type}">${isInc(e) ? '+' : '−'}${money(e.amount)}</span>
    </button>`;
  }

  function breakdown(list, title, type) {
    if (!list.length) return '';
    const tot = total(list);
    const groups = {};
    list.forEach((e) => { groups[e.category] = (groups[e.category] || 0) + (Number(e.amount) || 0); });
    const rows = Object.entries(groups).sort((a, b) => b[1] - a[1]);
    const max = rows[0][1] || 1;
    return `<section class="card"><h3>${esc(title)}</h3><div class="bars">${rows.map(([id, amt]) => {
      const c = cat(id);
      return `<div class="bar-row"><span class="bar-label">${c.icon} ${esc(c.label)}</span>
        <span class="bar-amt">${money(amt)}<span class="bar-pct">${pct((amt / tot) * 100)}</span></span>
        <div class="bar-track"><div class="bar-fill ${type}" style="width:${(amt / max) * 100}%"></div></div></div>`;
    }).join('')}</div>${type === 'expense' ? dieselInfo(list) : ''}</section>`;
  }

  function dieselInfo(list) {
    const d = list.filter((e) => e.category === 'diesel' && Number(e.liters) > 0);
    if (!d.length) return '';
    const litres = d.reduce((s, e) => s + Number(e.liters), 0);
    const amt = total(d);
    return `<p class="info-line">⛽ Diesel: <b>${round2(litres).toLocaleString()} L</b> bought · average <b>${money(round2(amt / litres))}</b> per litre</p>`;
  }

  function busTable(list, title) {
    if (!data.buses.length) return '';
    const rows = data.buses.map((b) => Object.assign({ name: b.name }, summary(list.filter((e) => e.bus_id === b.id))));
    const general = list.filter((e) => !e.bus_id || !busById(e.bus_id));
    if (general.length) rows.push(Object.assign({ name: 'General (shared)' }, summary(general)));
    const all = summary(list);
    return `<section class="card"><h3>${esc(title)}</h3><div class="table-wrap"><table>
      <thead><tr><th>Bus</th><th>In</th><th>Out</th><th>Profit</th><th>Margin</th></tr></thead>
      <tbody>${rows.map((r) => `<tr><td>${esc(r.name)}</td><td>${money(r.inc)}</td><td>${money(r.exp)}</td><td class="${r.profit < 0 ? 'neg' : 'pos'}">${money(r.profit)}</td><td>${pct(r.margin)}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td>Total</td><td>${money(all.inc)}</td><td>${money(all.exp)}</td><td class="${all.profit < 0 ? 'neg' : 'pos'}">${money(all.profit)}</td><td>${pct(all.margin)}</td></tr></tfoot>
    </table></div>${general.length ? '<p class="muted small" style="margin:10px 0 0">“General” is money not linked to one bus, like office rent or fleet insurance.</p>' : ''}</section>`;
  }

  /* ---------- HOME ---------- */
  function screenHome() {
    const list = inMonth(ui.month);
    const s = summary(list);
    const hello = data.profile.owner_name ? 'Hello, ' + data.profile.owner_name : 'Welcome back';
    return `
      <div class="greet"><p class="muted">${esc(hello)}</p><h2>${esc(data.profile.business_name || 'Your business')}</h2></div>
      ${docAlertCard()}
      ${welcomeCard()}
      ${monthSwitch()}
      ${statCards(s)}
      <div class="big-actions">
        <button class="btn btn-big btn-expense" data-action="add-entry" data-type="expense">${ICON.minus} Add Expense<small>Diesel, repairs, salary…</small></button>
        <button class="btn btn-big btn-income" data-action="add-entry" data-type="income">${ICON.plus} Add Income<small>School rent, trips…</small></button>
      </div>
      ${monthlyChecklist(list)}
      ${list.some((e) => !isInc(e)) ? breakdown(list.filter((e) => !isInc(e)), 'Where your money went', 'expense') : ''}
      ${busProfitList(list)}
      ${recentList(list)}`;
  }

  function welcomeCard() {
    const steps = [
      { done: data.buses.length > 0, text: 'Add your buses', sub: 'and the monthly rent each school pays', btn: '<button class="btn btn-sm" data-action="bus-form">Add bus</button>' },
      { done: data.staff.length > 0, text: 'Add your staff', sub: 'drivers, conductors and their salaries', btn: '<button class="btn btn-sm" data-action="staff-form">Add staff</button>' },
      { done: data.entries.length > 0, text: 'Record money in & out', sub: 'diesel, repairs, school payments…', btn: '<button class="btn btn-sm" data-action="quick-add">Add entry</button>' },
    ];
    if (steps.every((s) => s.done)) return '';
    const fresh = !data.buses.length && !data.staff.length && !data.entries.length;
    return `<section class="card welcome"><h3>Let's set up your business 👋</h3>
      <p>Three quick steps and your profit will show up here automatically.</p>
      <ol class="steps">${steps.map((s, i) => `<li class="${s.done ? 'is-done' : ''}"><span class="num">${s.done ? '✓' : i + 1}</span>
        <span class="grow"><b>${s.text}</b><small>${s.sub}</small></span>${s.done ? '' : s.btn}</li>`).join('')}</ol>
      ${fresh ? '<button class="btn btn-ghost-light btn-block" data-action="load-sample">✨ Just looking around? Fill with sample data</button>' : ''}
    </section>`;
  }

  function monthlyChecklist(list) {
    const rentBuses = data.buses.filter((b) => Number(b.monthly_rent) > 0);
    const payStaff = data.staff.filter((s) => Number(s.salary) > 0);
    const emiBuses = data.buses.filter((b) => Number(b.emi) > 0);
    if (!rentBuses.length && !payStaff.length && !emiBuses.length) return '';
    const rentDone = rentBuses.filter((b) => list.some((e) => e.category === 'school_rent' && e.bus_id === b.id)).length;
    const salDone = payStaff.filter((s) => list.some((e) => e.category === 'salary' && e.staff_id === s.id)).length;
    const emiDone = emiBuses.filter((b) => list.some((e) => e.category === 'emi' && e.bus_id === b.id)).length;
    const row = (icon, title, done, of, word, action, btnLabel) => `<div class="todo"><span class="todo-ico">${icon}</span>
      <span class="todo-main"><b>${title}</b><span class="muted small">${done} of ${of} ${word}</span></span>
      ${done >= of ? '<span class="done-label">✓ Done</span>' : `<button class="btn btn-sm btn-primary" data-action="${action}">${btnLabel}</button>`}</div>`;
    return `<section class="card"><h3>Monthly checklist</h3>
      ${rentBuses.length ? row('🏫', 'School rent received', rentDone, rentBuses.length, 'buses', 'record-rent', 'Record') : ''}
      ${payStaff.length ? row('👷', 'Staff salaries paid', salDone, payStaff.length, 'staff', 'pay-salaries', 'Pay') : ''}
      ${emiBuses.length ? row('🏦', 'Bus loan EMIs paid', emiDone, emiBuses.length, 'buses', 'pay-emi', 'Pay') : ''}
    </section>`;
  }

  function alertRow(a) {
    return `<button class="entry" data-action="doc-form" data-owner="${a.d.owner_type}" data-oid="${esc(a.owner.id)}" data-doc="${a.def.id}">
      <span class="entry-icon doc">${a.def.icon}</span>
      <span class="entry-main"><span class="entry-title">${esc(a.def.label)}</span><span class="entry-sub">${esc(a.owner.name)} · ${esc(fullDate(a.d.expiry_date))}</span></span>
      <span class="tag ${a.st.cls}">${esc(a.st.text)}</span></button>`;
  }
  function notifPrompt() {
    if (notifState() !== 'default') return '';
    return `<div class="notif-prompt"><span>🔔 Get a phone notification when a document is about to expire.</span>
      <button class="btn btn-sm btn-primary" data-action="enable-notif">Turn on</button></div>`;
  }
  function docAlertCard() {
    const a = docAlerts();
    if (!a.length) return '';
    return `<section class="card alert-card"><div class="card-head"><h3>⚠️ ${a.length} document${a.length > 1 ? 's' : ''} to renew</h3><a href="#/documents" class="small">See all</a></div>
      <div class="entries">${a.slice(0, 3).map(alertRow).join('')}</div>${notifPrompt()}</section>`;
  }

  /* ---------- DOCUMENTS ---------- */
  function docRow(ownerType, owner, def) {
    const d = findDoc(ownerType, owner.id, def.id);
    const st = docStatus(def, d);
    const sub = d ? [d.number ? 'No. ' + d.number : '', d.file_path ? '📎 Photo / file saved' : ''].filter(Boolean).map(esc).join(' · ') : 'Tap to add';
    return `<button class="entry" data-action="doc-form" data-owner="${ownerType}" data-oid="${esc(owner.id)}" data-doc="${def.id}">
      <span class="entry-icon doc">${def.icon}</span>
      <span class="entry-main"><span class="entry-title">${esc(def.label)}</span><span class="entry-sub">${sub || '&nbsp;'}</span></span>
      <span class="tag ${st.cls}">${esc(st.text)}</span></button>`;
  }
  function docSummary(ownerType, owner) {
    const types = docTypesFor(ownerType, owner);
    const sts = types.map((t) => docStatus(t, findDoc(ownerType, owner.id, t.id)));
    const have = sts.filter((s) => s.text !== 'Not added').length;
    const worst = Math.max(0, ...sts.map((s) => s.level));
    const warn = worst >= 2 ? '<span class="tag tag-bad">Renew now</span>' : worst === 1 ? '<span class="tag tag-warn">Expiring soon</span>' : '';
    return `<div class="doc-foot"><button class="btn btn-sm" data-action="owner-docs" data-owner="${ownerType}" data-id="${esc(owner.id)}">📄 Documents ${have}/${types.length}</button>${warn}</div>`;
  }
  function ownerDocsSheet(ownerType, owner) {
    return `${sheetHead(owner.name + ' — documents')}
      <p class="muted small">Tap a document to add its number, expiry date and a photo.</p>
      <div class="entries">${docTypesFor(ownerType, owner).map((t) => docRow(ownerType, owner, t)).join('')}</div>`;
  }
  function screenDocuments() {
    if (!data.buses.length && !data.staff.length) {
      return emptyState('📄', 'No documents yet', 'First add your buses and staff. Then you can save their documents here and get reminders before anything expires.',
        `<button class="btn btn-primary" data-action="bus-form">${ICON.plus} Add a bus</button>`);
    }
    const alerts = docAlerts();
    let h = alerts.length
      ? `<section class="card alert-card"><h3>⚠️ Needs attention</h3><div class="entries">${alerts.map(alertRow).join('')}</div>${notifPrompt()}</section>`
      : `<section class="card"><p class="ok-line">✅ No documents are expiring in the next ${remindDays()} days.</p>${notifPrompt()}</section>`;
    h += `<div class="chips">${[['bus', '🚌 Bus documents'], ['staff', '👷 Staff documents']].map(([k, l]) =>
      `<button class="chip ${ui.docTab === k ? 'active' : ''}" data-action="doc-tab" data-v="${k}">${l}</button>`).join('')}</div>`;
    const owners = ui.docTab === 'bus' ? data.buses : data.staff;
    if (!owners.length) {
      return h + (ui.docTab === 'bus'
        ? emptyState('🚌', 'No buses yet', 'Add a bus to keep its insurance, PUC, tax, fitness and permit here.', `<button class="btn btn-primary" data-action="bus-form">${ICON.plus} Add a bus</button>`)
        : emptyState('👷', 'No staff yet', 'Add staff to keep their license, Aadhaar, PAN, light bill and CV here.', `<button class="btn btn-primary" data-action="staff-form">${ICON.plus} Add staff</button>`));
    }
    h += owners.map((o) => `<section class="card"><div class="card-head"><h3>${esc(o.name)}</h3><span class="muted small">${esc(ui.docTab === 'bus' ? o.plate || '' : o.role || '')}</span></div>
      <div class="entries">${docTypesFor(ui.docTab, o).map((t) => docRow(ui.docTab, o, t)).join('')}</div></section>`).join('');
    return h;
  }

  function busProfitList(list) {
    if (!data.buses.length) return '';
    const genExp = total(list.filter((e) => !isInc(e) && !busById(e.bus_id)));
    return `<section class="card"><div class="card-head"><h3>Profit by bus</h3><a href="#/buses" class="small">Manage buses</a></div>
      <div class="entries">${data.buses.map((b) => {
        const s = summary(list.filter((e) => e.bus_id === b.id));
        return `<button class="entry" data-action="filter-bus" data-id="${esc(b.id)}">
          <span class="entry-icon bus">🚌</span>
          <span class="entry-main"><span class="entry-title">${esc(b.name)}</span><span class="entry-sub">In ${money(s.inc)} · Out ${money(s.exp)}</span></span>
          <span class="entry-amt ${s.profit < 0 ? 'neg' : 'pos'}">${money(s.profit)}</span></button>`;
      }).join('')}</div>
      ${genExp ? `<p class="muted small" style="margin:10px 0 0">Plus general costs not linked to a bus: <b>${money(genExp)}</b></p>` : ''}
    </section>`;
  }

  function recentList(list) {
    const r = list.slice().sort(byDateDesc).slice(0, 5);
    if (!r.length) return '';
    return `<section class="card"><div class="card-head"><h3>Latest entries</h3><a href="#/history" class="small">See all</a></div>
      <div class="entries">${r.map((e) => entryRow(e)).join('')}</div></section>`;
  }

  /* ---------- HISTORY ---------- */
  function screenHistory() {
    if (ui.busFilter && ui.busFilter !== 'none' && !busById(ui.busFilter)) ui.busFilter = '';
    let list = inMonth(ui.month);
    if (ui.filter !== 'all') list = list.filter((e) => e.type === ui.filter);
    if (ui.busFilter) list = list.filter((e) => (ui.busFilter === 'none' ? !busById(e.bus_id) : e.bus_id === ui.busFilter));
    list.sort(byDateDesc);
    const s = summary(list);
    let h = monthSwitch();
    h += `<div class="chips">${[['all', 'All'], ['income', 'Money In'], ['expense', 'Money Out']].map(([k, l]) =>
      `<button class="chip ${ui.filter === k ? 'active' : ''}" data-action="set-filter" data-v="${k}">${l}</button>`).join('')}</div>`;
    if (data.buses.length) {
      h += `<label class="field"><span class="sr-only">Show bus</span><select data-change="bus-filter">
        <option value="">All buses</option>
        ${data.buses.map((b) => `<option value="${esc(b.id)}" ${ui.busFilter === b.id ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}
        <option value="none" ${ui.busFilter === 'none' ? 'selected' : ''}>General (no bus)</option></select></label>`;
    }
    h += `<div class="card mini-sum"><div><span>In</span><b class="pos">${money(s.inc)}</b></div><div><span>Out</span><b style="color:var(--out)">${money(s.exp)}</b></div><div><span>${s.profit < 0 ? 'Loss' : 'Profit'}</span><b class="${s.profit < 0 ? 'neg' : ''}">${money(Math.abs(s.profit))}</b></div></div>`;
    if (!list.length) {
      return h + emptyState('📭', 'Nothing here yet', 'Tap the + button to add money in or money out for ' + monthLabel(ui.month) + '.');
    }
    let cur = '';
    h += '<section class="card entries">';
    list.forEach((e) => {
      if (e.date !== cur) { cur = e.date; h += `<div class="date-head">${dateLabel(e.date)}</div>`; }
      h += entryRow(e, true);
    });
    return h + '</section>';
  }

  /* ---------- BUSES ---------- */
  function screenBuses() {
    let h = `<div class="section-head"><p class="muted">Each bus you rent out, and the school it goes to.</p>
      <button class="btn btn-primary" data-action="bus-form">${ICON.plus} Add bus</button></div>`;
    if (!data.buses.length) {
      return h + emptyState('🚌', 'No buses yet', 'Add each bus you rent out. Set the monthly rent the school pays and the app will remind you to record it every month.',
        `<button class="btn btn-primary" data-action="bus-form">${ICON.plus} Add your first bus</button>`);
    }
    const list = inMonth(ui.month);
    h += monthSwitch();
    h += `<div class="grid-list">${data.buses.map((b) => {
      const s = summary(list.filter((e) => e.bus_id === b.id));
      const rentIn = list.some((e) => e.category === 'school_rent' && e.bus_id === b.id);
      return `<div class="item-card" role="button" tabindex="0" data-action="bus-form" data-id="${esc(b.id)}">
        <div class="item-top"><div><div class="item-title">🚌 ${esc(b.name)}</div>
          <div class="item-sub">${[b.plate, b.seats ? b.seats + ' seats' : ''].filter(Boolean).map(esc).join(' · ') || 'Tap to add details'}</div>
          ${b.school ? `<div class="item-sub">🏫 ${esc(b.school)}</div>` : ''}</div>
          ${Number(b.monthly_rent) > 0 ? `<span class="tag ${rentIn ? 'tag-ok' : 'tag-warn'}">${rentIn ? 'Rent received' : 'Rent pending'}</span>` : ''}</div>
        <div class="item-stats">
          <div>Rent / month<b>${money(b.monthly_rent)}</b></div>
          ${Number(b.emi) > 0 ? `<div>Loan EMI<b>${money(b.emi)}</b></div>` : ''}
          <div>Money in<b>${money(s.inc)}</b></div>
          <div>Money out<b>${money(s.exp)}</b></div>
          <div>${s.profit < 0 ? 'Loss' : 'Profit'}<b class="${s.profit < 0 ? 'neg' : 'pos'}">${money(Math.abs(s.profit))}</b></div>
        </div>${docSummary('bus', b)}</div>`;
    }).join('')}</div>`;
    return h;
  }

  /* ---------- STAFF ---------- */
  function screenStaff() {
    let h = `<div class="section-head"><p class="muted">Drivers, conductors and lady attendants, with their salary and documents.</p>
      <button class="btn btn-primary" data-action="staff-form">${ICON.plus} Add staff</button></div>`;
    if (!data.staff.length) {
      return h + emptyState('👷', 'No staff yet', 'Add your drivers and helpers with their monthly salary. Then you can pay everyone’s salary with one tap each month.',
        `<button class="btn btn-primary" data-action="staff-form">${ICON.plus} Add your first staff member</button>`);
    }
    const list = inMonth(ui.month);
    const salaryTotal = data.staff.reduce((s, x) => s + (Number(x.salary) || 0), 0);
    h += monthSwitch();
    h += `<p class="muted small">Total monthly salaries: <b>${money(salaryTotal)}</b></p>`;
    h += `<div class="grid-list">${data.staff.map((s) => {
      const paid = list.filter((e) => e.category === 'salary' && e.staff_id === s.id);
      const paidAmt = total(paid);
      return `<div class="item-card" role="button" tabindex="0" data-action="staff-form" data-id="${esc(s.id)}">
        <div class="item-top"><div><div class="item-title">${esc(s.name)}</div>
          <div class="item-sub">${[s.role, busName(s.bus_id)].filter(Boolean).map(esc).join(' · ')}</div>
          ${s.phone ? `<div class="item-sub">📞 <a href="tel:${esc(s.phone)}">${esc(s.phone)}</a></div>` : ''}</div>
          ${paid.length ? '<span class="tag tag-ok">Paid</span>' : (Number(s.salary) > 0 ? '<span class="tag tag-warn">Not paid</span>' : '')}</div>
        <div class="item-foot"><div class="small muted">Salary<b class="d-block" style="color:var(--text);font-size:16px">${money(s.salary)} / month</b>
          ${paid.length ? `<span>Paid ${money(paidAmt)} in ${monthShort(ui.month)}</span>` : ''}</div>
          ${!paid.length && Number(s.salary) > 0 ? `<button class="btn btn-sm btn-primary" data-action="pay-one" data-id="${esc(s.id)}">Pay salary</button>` : ''}</div>
        ${docSummary('staff', s)}
      </div>`;
    }).join('')}</div>`;
    return h;
  }

  /* ---------- REPORTS ---------- */
  function printTitle(label) {
    return `<div class="print-only"><h2>${esc(data.profile.business_name || APP_NAME)} — ${esc(label)}</h2></div>`;
  }
  function exportButtons(scope) {
    return `<section class="card no-print"><h3>Save or share this report</h3><div class="export-row">
      <button class="btn" data-action="export" data-scope="${scope}">${ICON.download} Download for Excel</button>
      <button class="btn" data-action="print">${ICON.print} Print / Save as PDF</button></div></section>`;
  }
  function screenReports() {
    const seg = `<div class="seg no-print" role="tablist">
      <button role="tab" aria-selected="${ui.reportMode === 'month'}" class="${ui.reportMode === 'month' ? 'active' : ''}" data-action="report-mode" data-v="month">Monthly</button>
      <button role="tab" aria-selected="${ui.reportMode === 'year'}" class="${ui.reportMode === 'year' ? 'active' : ''}" data-action="report-mode" data-v="year">Yearly</button></div>`;
    return seg + (ui.reportMode === 'month' ? monthReport() : yearReport());
  }
  function monthReport() {
    const list = inMonth(ui.month);
    let h = monthSwitch() + printTitle(monthLabel(ui.month)) + statCards(summary(list));
    if (!list.length) return h + emptyState('📊', 'No records this month', 'Your report fills in as you add money in and money out.');
    h += busTable(list, 'Profit by bus');
    h += breakdown(list.filter((e) => !isInc(e)), 'Money out by type', 'expense');
    h += breakdown(list.filter(isInc), 'Money in by type', 'income');
    return h + exportButtons('month');
  }
  function yearReport() {
    const y = ui.year;
    const list = inYear(y);
    const rows = Array.from({ length: 12 }, (_, i) => { const mk = y + '-' + pad(i + 1); return Object.assign({ mk }, summary(inMonth(mk))); });
    const max = Math.max(1, ...rows.map((r) => Math.max(r.inc, r.exp)));
    const all = summary(list);
    let h = `<div class="month-switch"><button class="icon-btn" data-action="prev-year" aria-label="Previous year">${ICON.left}</button>
      <strong>${y}</strong><button class="icon-btn" data-action="next-year" aria-label="Next year">${ICON.right}</button></div>`;
    h += printTitle('Year ' + y) + statCards(all);
    if (!list.length) return h + emptyState('📊', 'No records in ' + y, 'Your yearly report fills in as you add money in and money out.');
    h += `<section class="card"><h3>Month by month</h3>
      <div class="ychart" role="img" aria-label="Money in and money out for each month of ${y}">${rows.map((r) =>
        `<div class="ycol" title="${esc(monthLabel(r.mk))}: in ${esc(money(r.inc))}, out ${esc(money(r.exp))}">
          <div class="ybars"><div class="ybar in" style="height:${(r.inc / max) * 100}%"></div><div class="ybar out" style="height:${(r.exp / max) * 100}%"></div></div>
          <span>${monthShort(r.mk).slice(0, 3)}</span></div>`).join('')}</div>
      <div class="legend"><span><i style="background:var(--in)"></i>Money in</span><span><i style="background:var(--out)"></i>Money out</span></div>
      <div class="table-wrap"><table><thead><tr><th>Month</th><th>In</th><th>Out</th><th>Profit</th><th>Margin</th></tr></thead>
      <tbody>${rows.map((r) => `<tr><td>${monthShort(r.mk)}</td><td>${money(r.inc)}</td><td>${money(r.exp)}</td><td class="${r.profit < 0 ? 'neg' : ''}">${money(r.profit)}</td><td>${pct(r.margin)}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td>Total</td><td>${money(all.inc)}</td><td>${money(all.exp)}</td><td class="${all.profit < 0 ? 'neg' : 'pos'}">${money(all.profit)}</td><td>${pct(all.margin)}</td></tr></tfoot></table></div></section>`;
    h += busTable(list, 'Profit by bus — whole year');
    h += breakdown(list.filter((e) => !isInc(e)), 'Money out by type', 'expense');
    h += breakdown(list.filter(isInc), 'Money in by type', 'income');
    return h + exportButtons('year');
  }

  /* ---------- SETTINGS ---------- */
  function currencyOptions(sel) {
    const list = CURRENCIES.slice();
    if (sel && !list.some(([c]) => c === sel)) list.unshift([sel, sel]);
    return list.map(([c, l]) => `<option value="${c}" ${c === sel ? 'selected' : ''}>${esc(l)}</option>`).join('');
  }
  function screenSettings() {
    const p = data.profile;
    const fresh = !data.buses.length && !data.staff.length && !data.entries.length;
    return `
      <form class="card" data-form="profile">
        <h3>Business details</h3>
        <label class="field"><span>Business name</span><input name="business_name" required maxlength="80" value="${esc(p.business_name || '')}" placeholder="e.g. City School Transport"></label>
        <label class="field"><span>Your name <small>(optional)</small></span><input name="owner_name" maxlength="60" value="${esc(p.owner_name || '')}"></label>
        <label class="field"><span>Currency</span><select name="currency">${currencyOptions(p.currency)}</select></label>
        <button class="btn btn-primary" type="submit">Save</button>
      </form>
      <form class="card" data-form="reminders">
        <h3>🔔 Document reminders</h3>
        <label class="field"><span>Warn me before a document expires</span><select name="remind_days">
          ${[7, 15, 30, 45, 60, 90].map((n) => `<option value="${n}" ${n === remindDays() ? 'selected' : ''}>${n} days before</option>`).join('')}</select></label>
        <p class="small muted">${{
          granted: '✅ Phone notifications are on. When you open the app, it notifies you (once a day) about documents that need renewing.',
          denied: '🚫 Notifications are blocked for this app. To allow them, open your browser’s site settings for this app and allow notifications.',
          unsupported: 'This browser can’t show notifications. On iPhone, first add the app to your Home Screen, then open it from there.',
          default: 'Phone notifications are off. Expiring documents still show on the Home screen.',
        }[notifState()]}</p>
        <div class="export-row">
          ${notifState() === 'default' ? '<button type="button" class="btn" data-action="enable-notif">🔔 Turn on phone notifications</button>' : ''}
          <button class="btn btn-primary" type="submit">Save</button></div>
      </form>
      <section class="card"><h3>Account</h3>
        <p>Logged in as <b>${esc(user.email)}</b></p>
        ${Store.mode === 'demo'
          ? '<p class="note"><b>Demo mode:</b> everything is saved only in this browser on this device. Before selling, switch on online accounts (see README, Step 3) so customers can log in from any phone or computer.</p>'
          : '<p class="muted small">Your records are stored safely online. Log in from any phone or computer to see them.</p>'}
        <button class="btn" data-action="logout">${ICON.logout} Log out</button>
      </section>
      <section class="card"><h3>Your records</h3><div class="stack">
        ${fresh ? '<button class="btn" data-action="load-sample">✨ Fill with sample data to try the app</button>' : ''}
        <button class="btn" data-action="export" data-scope="all">${ICON.download} Download all records for Excel</button>
        <button class="btn btn-danger-ghost" data-action="wipe">Delete all buses, staff and records</button>
      </div></section>
      <section class="card"><h3>Install on your phone</h3><ul class="howto">
        <li><b>Android (Chrome):</b> tap the ⋮ menu → <i>Add to Home screen</i> or <i>Install app</i>.</li>
        <li><b>iPhone (Safari):</b> tap the Share button → <i>Add to Home Screen</i>.</li>
        <li><b>Computer (Chrome or Edge):</b> click the install icon at the right of the address bar.</li>
      </ul></section>
      <p class="muted center small">${esc(APP_NAME)} · version 1.0</p>`;
  }

  /* ---------- LOGIN / SIGN UP ---------- */
  function pwField(name, label, auto) {
    return `<label class="field"><span>${label}</span><div class="pw-wrap"><input type="password" name="${name}" autocomplete="${auto}" minlength="6" required>
      <button type="button" class="pw-toggle" data-action="toggle-pw">Show</button></div></label>`;
  }
  function authScreen() {
    const t = ui.recovery ? 'newpw' : ui.authTab;
    let body = '';
    if (t === 'login' || t === 'signup') {
      body += `<div class="seg" role="tablist">
        <button type="button" role="tab" aria-selected="${t === 'login'}" class="${t === 'login' ? 'active' : ''}" data-action="auth-tab" data-v="login">Log in</button>
        <button type="button" role="tab" aria-selected="${t === 'signup'}" class="${t === 'signup' ? 'active' : ''}" data-action="auth-tab" data-v="signup">Create account</button></div>`;
    }
    if (t === 'login') {
      body += `<form data-form="login">
        <label class="field"><span>Email</span><input type="email" name="email" autocomplete="email" required value="${esc(ui.pendingEmail)}"></label>
        ${pwField('password', 'Password', 'current-password')}
        <button class="btn btn-primary btn-block" type="submit">Log in</button>
        <div class="center"><button type="button" class="link-btn" data-action="auth-tab" data-v="forgot">Forgot password?</button></div>
      </form>`;
    } else if (t === 'signup') {
      body += `<form data-form="signup">
        <label class="field"><span>Business name</span><input name="business_name" required maxlength="80" placeholder="e.g. City School Transport"></label>
        <label class="field"><span>Email</span><input type="email" name="email" autocomplete="email" required></label>
        ${pwField('password', 'Choose a password <small>(at least 6 letters or numbers)</small>', 'new-password')}
        <label class="field"><span>Currency</span><select name="currency">${currencyOptions(guessCurrency())}</select></label>
        <button class="btn btn-primary btn-block" type="submit">Create my account</button>
      </form>`;
    } else if (t === 'forgot') {
      body += `<form data-form="forgot"><h2>Reset your password</h2><p class="muted">Enter your email and we will send you a link to choose a new password.</p>
        <label class="field"><span>Email</span><input type="email" name="email" autocomplete="email" required></label>
        <button class="btn btn-primary btn-block" type="submit">Send reset link</button>
        <div class="center"><button type="button" class="link-btn" data-action="auth-tab" data-v="login">Back to log in</button></div></form>`;
    } else if (t === 'check-email') {
      body += `<div class="center"><div class="big-emoji">📧</div><h2>Check your email</h2>
        <p class="muted">We sent a confirmation link to <b>${esc(ui.pendingEmail)}</b>. Open it, then come back here and log in.</p>
        <button class="btn btn-primary btn-block" data-action="auth-tab" data-v="login">Go to log in</button></div>`;
    } else if (t === 'newpw') {
      body += `<form data-form="newpw"><h2>Choose a new password</h2>
        ${pwField('password', 'New password', 'new-password')}
        <button class="btn btn-primary btn-block" type="submit">Save new password</button></form>`;
    }
    return `<div class="auth"><div class="auth-card">
      <div class="auth-brand">${LOGO}<h1>${esc(APP_NAME)}</h1><p>Simple accounts for school bus owners</p></div>
      ${body}
      ${Store.mode === 'demo' ? '<p class="note"><b>Demo mode:</b> accounts are saved only in this browser. See README Step 3 to switch on real online accounts.</p>' : ''}
    </div></div>`;
  }

  /* =====================================================================
     FORMS (pop-ups)
     ===================================================================== */
  function busOptions(sel, noneLabel) {
    return `<option value="">${esc(noneLabel || 'General (not for one bus)')}</option>` +
      data.buses.map((b) => `<option value="${esc(b.id)}" ${b.id === sel ? 'selected' : ''}>${esc(b.name)}${b.plate ? ' · ' + esc(b.plate) : ''}</option>`).join('');
  }
  function moneyInput(name, value, required) {
    return `<div class="money-input"><span class="cur">${esc(currencySymbol())}</span>
      <input name="${name}" type="number" inputmode="decimal" min="${required ? '0.01' : '0'}" step="0.01" value="${value == null ? '' : esc(value)}" placeholder="0" ${required ? 'required' : ''}></div>`;
  }
  function deleteBtn(action, id) {
    return id ? `<button type="button" class="btn btn-danger-ghost" data-action="${action}" data-id="${esc(id)}">Delete</button>` : '';
  }

  function entryForm(type, e, preset) {
    e = e || {};
    const v = Object.assign({}, preset || {}, e);
    const edit = !!e.id;
    const catId = v.category || '';
    return `<form data-form="entry" data-type="${type}" data-id="${esc(e.id || '')}">
      ${sheetHead((edit ? 'Edit ' : 'Add ') + (type === 'income' ? 'money in' : 'money out'))}
      <fieldset class="field"><legend>What is it for?</legend><div class="cat-grid">
        ${CATS[type].map((c) => `<label class="cat-tile"><input type="radio" name="category" value="${c.id}" ${c.id === catId ? 'checked' : ''} required>
          <span class="cat-ico">${c.icon}</span><span>${esc(c.label)}</span></label>`).join('')}
      </div></fieldset>
      <label class="field" data-show-for="salary"><span>Which staff member?</span><select name="staff_id">
        <option value="">Choose…</option>${data.staff.map((s) => `<option value="${esc(s.id)}" ${s.id === v.staff_id ? 'selected' : ''}>${esc(s.name)}${s.role ? ' · ' + esc(s.role) : ''}</option>`).join('')}
      </select></label>
      <label class="field"><span>Amount</span>${moneyInput('amount', v.amount, true)}</label>
      <div class="field-row">
        <label class="field"><span>Date</span><input type="date" name="date" required value="${esc(v.date || defaultDateFor(ui.month))}"></label>
        <label class="field"><span>Bus</span><select name="bus_id">${busOptions(v.bus_id)}</select></label>
      </div>
      <label class="field" data-show-for="diesel"><span>Litres <small>(optional — shows your price per litre)</small></span>
        <input name="liters" type="number" inputmode="decimal" min="0" step="0.01" value="${v.liters == null ? '' : esc(v.liters)}" placeholder="0"></label>
      <label class="field"><span>Note <small>(optional)</small></span><input name="note" maxlength="200" value="${esc(v.note || '')}" placeholder="e.g. Bill no. 245, City Motors"></label>
      <div class="sheet-actions">${deleteBtn('delete-entry', e.id)}<button class="btn btn-primary btn-wide" type="submit">${edit ? 'Save changes' : 'Save'}</button></div>
    </form>`;
  }
  function openEntry(type, e, preset) {
    openSheet(entryForm(type, e, preset));
    const f = $('#sheet-root form');
    syncEntryForm(f);
    if (!e && preset && preset.category && !preset.amount) f.elements.amount.focus();
  }
  function syncEntryForm(f) {
    const checked = f.querySelector('input[name=category]:checked');
    const c = checked ? checked.value : '';
    f.querySelectorAll('[data-show-for]').forEach((el) => { el.hidden = el.dataset.showFor !== c; });
    f.querySelectorAll('.cat-tile').forEach((t) => t.classList.toggle('is-checked', t.querySelector('input').checked));
    if (c === 'school_rent' && !f.elements.amount.value && f.elements.bus_id.value) {
      const b = busById(f.elements.bus_id.value);
      if (b && Number(b.monthly_rent)) f.elements.amount.value = b.monthly_rent;
    }
  }

  function busForm(b) {
    b = b || {};
    return `<form data-form="bus" data-id="${esc(b.id || '')}">
      ${sheetHead(b.id ? 'Edit bus' : 'Add a bus')}
      <label class="field"><span>Bus name</span><input name="name" required maxlength="40" value="${esc(b.name || '')}" placeholder="e.g. Bus 1 or Yellow Tata"></label>
      <div class="field-row">
        <label class="field"><span>Number plate <small>(optional)</small></span><input name="plate" maxlength="20" value="${esc(b.plate || '')}"></label>
        <label class="field"><span>Seats <small>(optional)</small></span><input name="seats" type="number" inputmode="numeric" min="0" step="1" value="${b.seats == null ? '' : esc(b.seats)}"></label>
      </div>
      <label class="field"><span>School it is rented to</span><input name="school" maxlength="80" value="${esc(b.school || '')}" placeholder="e.g. Green Valley School"></label>
      <label class="field"><span>Monthly rent the school pays you</span>${moneyInput('monthly_rent', b.monthly_rent, false)}
        <small class="hint">The app will remind you each month to record this payment.</small></label>
      <label class="field"><span>Loan EMI per month <small>(optional — if this bus is on a loan)</small></span>${moneyInput('emi', b.emi, false)}
        <small class="hint">The app will remind you each month to pay it.</small></label>
      <label class="field"><span>Notes <small>(optional)</small></span><input name="notes" maxlength="200" value="${esc(b.notes || '')}" placeholder="e.g. Insurance renews in June"></label>
      <div class="sheet-actions">${deleteBtn('delete-bus', b.id)}<button class="btn btn-primary btn-wide" type="submit">${b.id ? 'Save changes' : 'Add bus'}</button></div>
    </form>`;
  }

  function staffForm(s) {
    s = s || {};
    const role = s.role || 'Driver';
    const roles = ROLES.includes(role) ? ROLES : ROLES.concat([role]);
    return `<form data-form="staff" data-id="${esc(s.id || '')}">
      ${sheetHead(s.id ? 'Edit staff member' : 'Add a staff member')}
      <label class="field"><span>Name</span><input name="name" required maxlength="60" value="${esc(s.name || '')}"></label>
      <div class="field-row">
        <label class="field"><span>Job</span><select name="role">${roles.map((r) => `<option ${r === role ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select></label>
        <label class="field"><span>Phone <small>(optional)</small></span><input name="phone" type="tel" maxlength="20" value="${esc(s.phone || '')}"></label>
      </div>
      <label class="field"><span>Monthly salary</span>${moneyInput('salary', s.salary, false)}</label>
      <label class="field"><span>Works on bus</span><select name="bus_id">${busOptions(s.bus_id, 'Not tied to one bus')}</select></label>
      <div class="sheet-actions">${deleteBtn('delete-staff', s.id)}<button class="btn btn-primary btn-wide" type="submit">${s.id ? 'Save changes' : 'Add staff member'}</button></div>
    </form>`;
  }

  function docForm(ownerType, owner, def) {
    const d = findDoc(ownerType, owner.id, def.id) || {};
    return `<form data-form="doc" data-owner="${ownerType}" data-oid="${esc(owner.id)}" data-doc="${def.id}">
      ${sheetHead(def.icon + ' ' + def.label)}
      <p class="muted" style="margin-top:-6px">${esc(owner.name)}</p>
      <label class="field"><span>Document number <small>(optional)</small></span><input name="number" maxlength="40" value="${esc(d.number || '')}"></label>
      ${def.expires ? `<label class="field"><span>Expiry date</span><input type="date" name="expiry_date" value="${esc(d.expiry_date || '')}">
        <small class="hint">You will be reminded ${remindDays()} days before it expires.</small></label>` : ''}
      <div class="field"><span>Photo or PDF <small>(optional)</small></span>
        ${d.file_path ? `<div class="file-current" data-file-current><span class="file-preview" data-path="${esc(d.file_path)}" data-type="${esc(d.file_type || '')}">Loading…</span>
          <button type="button" class="btn btn-sm btn-danger-ghost" data-action="doc-remove-file">Remove</button></div>` : ''}
        <input type="file" name="file" accept="image/*,application/pdf">
        <small class="hint">${d.file_path ? 'Choose a new file to replace the saved one.' : 'Take a photo with your phone camera, or choose a photo or PDF.'}</small></div>
      ${def.cost ? `<label class="field"><span>Renewal cost <small>(optional — also adds it to expenses)</small></span>${moneyInput('cost', '', false)}</label>` : ''}
      <label class="field"><span>Note <small>(optional)</small></span><input name="note" maxlength="200" value="${esc(d.note || '')}"></label>
      <div class="sheet-actions">${d.id ? `<button type="button" class="btn btn-danger-ghost" data-action="delete-doc" data-id="${esc(d.id)}">Delete</button>` : ''}
        <button class="btn btn-primary btn-wide" type="submit">Save</button></div>
    </form>`;
  }
  async function openDocForm(ownerType, oid, docType) {
    const owner = ownerOf(ownerType, oid);
    const def = docDef(ownerType, docType);
    if (!owner || !def) return;
    openSheet(docForm(ownerType, owner, def));
    const prev = $('#sheet-root .file-preview');
    if (!prev) return;
    try {
      const url = await Store.fileUrl(user, prev.dataset.path);
      const isImg = /^image\//.test(prev.dataset.type);
      prev.innerHTML = (isImg ? `<img src="${esc(url)}" alt="Saved ${esc(def.label)}">` : '📄 ') +
        `<a href="${esc(url)}" target="_blank" rel="noopener">Open ${isImg ? 'full size' : 'file'}</a>`;
    } catch (e) { prev.textContent = 'Could not load the saved file.'; }
  }
  // Shrinks phone photos so they upload fast and use little space.
  async function prepareFile(file) {
    if (/^image\//.test(file.type) && !/gif|svg/.test(file.type)) {
      try {
        const bmp = await createImageBitmap(file);
        const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
        const c = document.createElement('canvas');
        c.width = Math.round(bmp.width * scale);
        c.height = Math.round(bmp.height * scale);
        c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
        const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.82));
        if (blob) return { blob, name: file.name.replace(/\.[^.]+$/, '') + '.jpg', type: 'image/jpeg' };
      } catch (e) { /* use the original file */ }
    }
    if (file.size > 8 * 1024 * 1024) throw new Error('This file is too big (over 8 MB). Please choose a smaller file or take a photo instead.');
    return { blob: file, name: file.name, type: file.type || 'application/octet-stream' };
  }

  function bulkForm(kind) {
    const list = inMonth(ui.month);
    let items;
    if (kind === 'rent') {
      items = data.buses.filter((b) => Number(b.monthly_rent) > 0 && !list.some((e) => e.category === 'school_rent' && e.bus_id === b.id))
        .map((b) => ({ id: b.id, title: b.name, sub: b.school || '', amount: b.monthly_rent }));
    } else if (kind === 'emi') {
      items = data.buses.filter((b) => Number(b.emi) > 0 && !list.some((e) => e.category === 'emi' && e.bus_id === b.id))
        .map((b) => ({ id: b.id, title: b.name, sub: b.plate || '', amount: b.emi }));
    } else {
      items = data.staff.filter((s) => Number(s.salary) > 0 && !list.some((e) => e.category === 'salary' && e.staff_id === s.id))
        .map((s) => ({ id: s.id, title: s.name, sub: [s.role, busName(s.bus_id)].filter(Boolean).join(' · '), amount: s.salary }));
    }
    if (!items.length) return null;
    const title = { rent: 'Record school rent', salary: 'Pay salaries', emi: 'Pay bus loan EMIs' }[kind];
    const help = {
      rent: 'Tick each bus whose school has paid you for ' + monthLabel(ui.month) + '. You can change the amount if they paid less or more.',
      salary: 'Tick each person you have paid for ' + monthLabel(ui.month) + '. You can change the amount, for example for leave or a bonus.',
      emi: 'Tick each bus whose loan EMI you have paid for ' + monthLabel(ui.month) + '.',
    }[kind];
    return `<form data-form="bulk" data-kind="${kind}">
      ${sheetHead(title)}<p class="muted">${esc(help)}</p>
      <div class="check-list">${items.map((it) => `<label class="check-item"><input type="checkbox" name="pick" value="${esc(it.id)}" checked>
        <span class="grow"><b>${esc(it.title)}</b>${it.sub ? `<small>${esc(it.sub)}</small>` : ''}</span>
        <input type="number" inputmode="decimal" min="0" step="0.01" name="amt_${esc(it.id)}" value="${esc(it.amount)}" aria-label="Amount for ${esc(it.title)}"></label>`).join('')}</div>
      <label class="field"><span>Date paid</span><input type="date" name="date" required value="${defaultDateFor(ui.month)}"></label>
      <div class="sheet-actions"><button class="btn btn-primary btn-wide" type="submit">Save</button></div>
    </form>`;
  }

  function quickAddSheet() {
    const pop = [['diesel', 'expense'], ['maintenance', 'expense'], ['salary', 'expense'], ['emi', 'expense'], ['school_rent', 'income']];
    return `${sheetHead('What do you want to add?')}
      <div class="big-actions">
        <button class="btn btn-big btn-expense" data-action="add-entry" data-type="expense">${ICON.minus} Money Out<small>an expense you paid</small></button>
        <button class="btn btn-big btn-income" data-action="add-entry" data-type="income">${ICON.plus} Money In<small>money you received</small></button>
      </div>
      <p class="muted small">Or jump straight to:</p>
      <div class="quick-cats">${pop.map(([id, t]) => { const c = cat(id); return `<button class="chip" data-action="add-entry" data-type="${t}" data-category="${id}">${c.icon} ${esc(c.label)}</button>`; }).join('')}</div>`;
  }

  /* =====================================================================
     SAVING
     ===================================================================== */
  async function saveRow(table, id, row) {
    if (id) {
      const updated = await Store.update(user, table, id, row);
      data[table] = data[table].map((x) => (x.id === id ? updated : x));
      return updated;
    }
    const created = await Store.insert(user, table, row);
    data[table].push(created);
    return created;
  }

  const forms = {
    async login(f) {
      const fd = new FormData(f);
      user = await Store.signIn(String(fd.get('email')).trim(), fd.get('password'));
      await loadData();
      render();
    },
    async signup(f) {
      const fd = new FormData(f);
      const email = String(fd.get('email')).trim();
      const profile = { business_name: String(fd.get('business_name')).trim(), owner_name: '', currency: fd.get('currency') };
      const res = await Store.signUp(email, fd.get('password'), profile);
      if (res.needsConfirm) { ui.authTab = 'check-email'; ui.pendingEmail = email; render(); return; }
      user = res.user;
      await loadData();
      location.hash = '#/home';
      render();
      toast('Welcome! Your account is ready.');
    },
    async forgot(f) {
      const email = String(new FormData(f).get('email')).trim();
      await Store.resetPassword(email);
      ui.authTab = 'login'; ui.pendingEmail = email;
      render();
      toast('Reset link sent. Please check your email.');
    },
    async newpw(f) {
      await Store.updatePassword(new FormData(f).get('password'));
      ui.recovery = false;
      history.replaceState(null, '', location.pathname + '#/home');
      user = await Store.getUser();
      await loadData();
      render();
      toast('Password changed ✓');
    },
    async entry(f) {
      const fd = new FormData(f);
      const category = fd.get('category');
      if (!category) throw new Error('Please choose what it is for.');
      const amount = num(fd.get('amount'));
      if (!(amount > 0)) throw new Error('Please enter the amount.');
      const row = {
        type: f.dataset.type,
        category,
        amount,
        date: fd.get('date') || todayStr(),
        bus_id: fd.get('bus_id') || null,
        staff_id: category === 'salary' ? fd.get('staff_id') || null : null,
        liters: category === 'diesel' && fd.get('liters') ? num(fd.get('liters')) : null,
        note: String(fd.get('note') || '').trim(),
      };
      const isEdit = !!f.dataset.id;
      await saveRow('entries', f.dataset.id, row);
      if (monthOf(row.date) !== ui.month) ui.month = monthOf(row.date);
      closeSheet();
      render();
      toast(isEdit ? 'Changes saved ✓' : `Saved: ${cat(category).label} ${money(amount)} ✓`);
    },
    async bus(f) {
      const fd = new FormData(f);
      const row = {
        name: String(fd.get('name')).trim(),
        plate: String(fd.get('plate') || '').trim(),
        school: String(fd.get('school') || '').trim(),
        monthly_rent: num(fd.get('monthly_rent')),
        emi: num(fd.get('emi')),
        seats: fd.get('seats') ? parseInt(fd.get('seats'), 10) : null,
        notes: String(fd.get('notes') || '').trim(),
      };
      if (!row.name) throw new Error('Please give the bus a name, like “Bus 1”.');
      await saveRow('buses', f.dataset.id, row);
      closeSheet(); render();
      toast(f.dataset.id ? 'Bus updated ✓' : 'Bus added ✓');
    },
    async staff(f) {
      const fd = new FormData(f);
      const row = {
        name: String(fd.get('name')).trim(),
        role: fd.get('role'),
        phone: String(fd.get('phone') || '').trim(),
        salary: num(fd.get('salary')),
        bus_id: fd.get('bus_id') || null,
      };
      if (!row.name) throw new Error('Please enter a name.');
      await saveRow('staff', f.dataset.id, row);
      closeSheet(); render();
      toast(f.dataset.id ? 'Staff member updated ✓' : 'Staff member added ✓');
    },
    async bulk(f) {
      const fd = new FormData(f);
      const kind = f.dataset.kind;
      const ids = fd.getAll('pick');
      if (!ids.length) throw new Error(kind === 'salary' ? 'Tick at least one person.' : 'Tick at least one bus.');
      const date = fd.get('date');
      const rows = [];
      ids.forEach((id) => {
        const amount = num(fd.get('amt_' + id));
        if (!(amount > 0)) return;
        if (kind === 'rent') {
          const b = busById(id);
          rows.push({ type: 'income', category: 'school_rent', amount, date, bus_id: id, staff_id: null, liters: null, note: b && b.school ? 'Monthly rent – ' + b.school : 'Monthly rent' });
        } else if (kind === 'emi') {
          rows.push({ type: 'expense', category: 'emi', amount, date, bus_id: id, staff_id: null, liters: null, note: '' });
        } else {
          const s = staffById(id);
          rows.push({ type: 'expense', category: 'salary', amount, date, bus_id: s ? s.bus_id || null : null, staff_id: id, liters: null, note: '' });
        }
      });
      if (!rows.length) throw new Error('Please enter the amounts.');
      const created = await Store.insertMany(user, 'entries', rows);
      data.entries.push(...created);
      closeSheet(); render();
      const word = { rent: ['payment', 'payments'], salary: ['salary', 'salaries'], emi: ['EMI', 'EMIs'] }[kind][rows.length > 1 ? 1 : 0];
      toast(`Saved ${rows.length} ${word} ✓`);
    },
    async reminders(f) {
      const p = Object.assign({}, data.profile, { remind_days: parseInt(new FormData(f).get('remind_days'), 10) || 30 });
      data.profile = await Store.saveProfile(user, p);
      render();
      toast('Saved ✓');
      checkReminders(true);
    },
    async doc(f) {
      const { owner, oid, doc } = f.dataset;
      const def = docDef(owner, doc);
      const existing = findDoc(owner, oid, doc);
      const fd = new FormData(f);
      const row = {
        owner_type: owner, owner_id: oid, doc_type: doc,
        number: String(fd.get('number') || '').trim(),
        expiry_date: def.expires ? fd.get('expiry_date') || null : null,
        note: String(fd.get('note') || '').trim(),
      };
      const file = f.elements.file && f.elements.file.files[0];
      const removeFile = f.dataset.removeFile === '1';
      const oldPath = existing && existing.file_path;
      if (!existing && !row.number && !row.expiry_date && !row.note && !file) {
        throw new Error(def.expires ? 'Please add the expiry date or a photo.' : 'Please add the number or a photo.');
      }
      if (file) {
        const p = await prepareFile(file);
        row.file_path = await Store.uploadFile(user, p);
        row.file_name = p.name;
        row.file_type = p.type;
      } else if (removeFile) {
        row.file_path = null; row.file_name = null; row.file_type = null;
      }
      await saveRow('documents', existing && existing.id, row);
      if (oldPath && (file || removeFile)) Store.deleteFile(user, oldPath).catch(() => {});
      const cost = def.cost ? num(fd.get('cost')) : 0;
      if (cost > 0) {
        const e = await Store.insert(user, 'entries', { type: 'expense', category: def.cost, amount: cost, date: todayStr(), bus_id: oid, staff_id: null, liters: null, note: def.label + ' renewal' });
        data.entries.push(e);
      }
      closeSheet(); render();
      toast(cost > 0 ? `${def.label} saved, and ${money(cost)} added to expenses ✓` : `${def.label} saved ✓`);
    },
    async profile(f) {
      const fd = new FormData(f);
      const p = Object.assign({}, data.profile, {
        business_name: String(fd.get('business_name')).trim(),
        owner_name: String(fd.get('owner_name') || '').trim(),
        currency: fd.get('currency'),
      });
      data.profile = await Store.saveProfile(user, p);
      render();
      toast('Saved ✓');
    },
  };

  /* ---------- Sample data so people can try the app ---------- */
  const SAMPLE_SCALE = { INR: 1, PKR: 3, BDT: 1.3, LKR: 3.5, NPR: 1.6, NGN: 20, KES: 1.6, ZAR: 0.6, AED: 0.15, SAR: 0.15, USD: 0.1, EUR: 0.09, GBP: 0.08, CAD: 0.13, AUD: 0.15 };
  async function loadSample() {
    const k = SAMPLE_SCALE[data.profile.currency] || 0.1;
    const R = (n) => { const v = n * k; return v >= 1000 ? Math.round(v / 10) * 10 : Math.round(v); };
    const buses = await Store.insertMany(user, 'buses', [
      { name: 'Bus 1', plate: 'AB 1234', school: 'Green Valley School', monthly_rent: R(65000), emi: R(15000), seats: 40, notes: '' },
      { name: 'Bus 2', plate: 'CD 5678', school: "St. Mary's School", monthly_rent: R(72000), emi: R(18000), seats: 52, notes: '' },
      { name: 'Bus 3', plate: 'EF 9012', school: 'Sunrise Public School', monthly_rent: R(58000), emi: 0, seats: 32, notes: '' },
    ]);
    data.buses.push(...buses);
    const [b1, b2, b3] = buses.map((b) => b.id);
    const staff = await Store.insertMany(user, 'staff', [
      { name: 'Ravi Kumar', role: 'Driver', phone: '', salary: R(18000), bus_id: b1 },
      { name: 'John Mathew', role: 'Driver', phone: '', salary: R(18000), bus_id: b2 },
      { name: 'Imran Shaikh', role: 'Driver', phone: '', salary: R(17000), bus_id: b3 },
      { name: 'Sunita Patil', role: 'Lady Attendant', phone: '', salary: R(9000), bus_id: b1 },
      { name: 'Mohan Lal', role: 'Mechanic', phone: '', salary: R(12000), bus_id: null },
    ]);
    data.staff.push(...staff);

    const inDays = (n) => { const t = new Date(); t.setDate(t.getDate() + n); return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate()); };
    const docRows = [];
    const doc = (ownerType, owner, doc_type, days, number) =>
      docRows.push({ owner_type: ownerType, owner_id: owner.id, doc_type, number: number || '', expiry_date: days == null ? null : inDays(days), note: '' });
    doc('bus', buses[0], 'insurance', 12, 'POL-552190'); doc('bus', buses[0], 'puc', 140); doc('bus', buses[0], 'road_tax', 200);
    doc('bus', buses[0], 'fitness', 300); doc('bus', buses[0], 'permit', 410);
    doc('bus', buses[1], 'insurance', 220); doc('bus', buses[1], 'puc', -3); doc('bus', buses[1], 'fitness', 95);
    doc('bus', buses[2], 'insurance', 160); doc('bus', buses[2], 'permit', 26);
    doc('staff', staff[0], 'license', 25, 'DL-0120190001234'); doc('staff', staff[1], 'license', 600); doc('staff', staff[2], 'license', 380);
    doc('staff', staff[0], 'aadhaar', null, 'XXXX XXXX 1234'); doc('staff', staff[3], 'aadhaar', null, 'XXXX XXXX 5678');
    const createdDocs = await Store.insertMany(user, 'documents', docRows);
    data.documents.push(...createdDocs);

    const today = todayStr();
    const cur = monthOf(today);
    const rows = [];
    const add = (type, category, amount, date, bus_id, extra) => {
      if (date <= today) rows.push(Object.assign({ type, category, amount, date, bus_id: bus_id || null, staff_id: null, liters: null, note: '' }, extra || {}));
    };
    for (let i = 2; i >= 0; i--) {
      const mk = shiftMonth(cur, -i);
      buses.forEach((b, bi) => {
        if (!(i === 0 && bi === 2)) add('income', 'school_rent', b.monthly_rent, mk + '-05', b.id, { note: 'Monthly rent – ' + b.school });
        [3, 10, 17, 24].forEach((d, di) => {
          const amt = R(3600 + ((bi * 7 + di * 3 + i * 5) % 9) * 180);
          add('expense', 'diesel', amt, mk + '-' + pad(d), b.id, { liters: Math.round(amt / (92 * k)) });
        });
      });
      add('expense', 'emi', buses[0].emi, mk + '-07', buses[0].id);
      if (i > 0) add('expense', 'emi', buses[1].emi, mk + '-07', buses[1].id);
      if (i > 0) staff.forEach((s) => add('expense', 'salary', s.salary, lastDay(mk), s.bus_id, { staff_id: s.id }));
      add('expense', 'maintenance', R([6500, 3200, 8800][i]), mk + '-12', buses[i % 3].id, { note: ['Oil change', 'Brake service', 'Clutch plate replaced'][i] });
      add('expense', 'toll', R(1200), mk + '-20', null, { note: 'Parking fees' });
      add('income', 'extra_trip', R([7000, 5500, 8000][i]), mk + '-15', buses[(i + 1) % 3].id, { note: 'Picnic trip' });
    }
    add('expense', 'tyres', R(24000), shiftMonth(cur, -2) + '-08', b2, { note: '2 new rear tyres' });
    add('expense', 'insurance', R(28000), shiftMonth(cur, -1) + '-02', b3, { note: 'Yearly insurance' });
    add('expense', 'tax', R(6000), shiftMonth(cur, -1) + '-06', null, { note: 'Quarterly road tax' });
    const created = await Store.insertMany(user, 'entries', rows);
    data.entries.push(...created);
  }

  /* ---------- Download as CSV (opens in Excel / Google Sheets) ---------- */
  function downloadCSV(list, filename) {
    const cell = (v) => {
      if (v == null) return '';
      let s = String(v);
      if (typeof v === 'string' && /^[=+\-@]/.test(s)) s = "'" + s; // stop spreadsheet formula tricks
      return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const rows = [['Date', 'Money In / Out', 'Type', 'Amount', 'Bus', 'Staff', 'Litres', 'Note']];
    list.slice().sort((a, b) => String(a.date).localeCompare(String(b.date))).forEach((e) => {
      const st = staffById(e.staff_id);
      rows.push([e.date, isInc(e) ? 'In' : 'Out', cat(e.category).label, Number(e.amount), busName(e.bus_id), st ? st.name : '', e.liters == null ? '' : Number(e.liters), e.note || '']);
    });
    const csv = rows.map((r) => r.map(cell).join(',')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  const slug = (s) => String(s || 'records').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'records';

  async function removeOwnerDocs(ownerType, id) {
    const docs = data.documents.filter((d) => d.owner_type === ownerType && d.owner_id === id);
    for (const d of docs) {
      await Store.remove(user, 'documents', d.id);
      if (d.file_path) Store.deleteFile(user, d.file_path).catch(() => {});
    }
    data.documents = data.documents.filter((d) => !docs.includes(d));
  }

  /* =====================================================================
     BUTTON ACTIONS
     ===================================================================== */
  const actions = {
    'prev-month': () => { ui.month = shiftMonth(ui.month, -1); render(); },
    'next-month': () => { ui.month = shiftMonth(ui.month, 1); render(); },
    'this-month': () => { ui.month = monthOf(todayStr()); render(); },
    'prev-year': () => { ui.year--; render(); },
    'next-year': () => { ui.year++; render(); },
    'report-mode': (el) => { ui.reportMode = el.dataset.v; render(); },
    'set-filter': (el) => { ui.filter = el.dataset.v; render(); },
    'filter-bus': (el) => { ui.busFilter = el.dataset.id; ui.filter = 'all'; go('history'); },
    'quick-add': () => openSheet(quickAddSheet()),
    'add-entry': (el) => openEntry(el.dataset.type, null, el.dataset.category ? { category: el.dataset.category } : null),
    'edit-entry': (el) => { const e = data.entries.find((x) => x.id === el.dataset.id); if (e) openEntry(e.type, e); },
    'close-sheet': () => closeSheet(),
    'confirm-yes': () => { const r = pendingConfirm; pendingConfirm = null; closeSheet(); if (r) r(true); },
    'confirm-no': () => closeSheet(),
    'bus-form': (el) => openSheet(busForm(busById(el.dataset.id))),
    'staff-form': (el) => openSheet(staffForm(staffById(el.dataset.id))),
    'pay-one': (el) => {
      const s = staffById(el.dataset.id);
      if (s) openEntry('expense', null, { category: 'salary', staff_id: s.id, amount: s.salary, bus_id: s.bus_id });
    },
    'record-rent': () => { const h = bulkForm('rent'); if (h) openSheet(h); else toast('All school rent for this month is recorded ✓'); },
    'pay-salaries': () => { const h = bulkForm('salary'); if (h) openSheet(h); else toast('All salaries for this month are paid ✓'); },
    'pay-emi': () => { const h = bulkForm('emi'); if (h) openSheet(h); else toast('All loan EMIs for this month are paid ✓'); },
    'doc-tab': (el) => { ui.docTab = el.dataset.v; render(); },
    'owner-docs': (el) => { const o = ownerOf(el.dataset.owner, el.dataset.id); if (o) openSheet(ownerDocsSheet(el.dataset.owner, o)); },
    'doc-form': (el) => openDocForm(el.dataset.owner, el.dataset.oid, el.dataset.doc),
    'doc-remove-file': (el) => {
      el.closest('form').dataset.removeFile = '1';
      el.closest('[data-file-current]').remove();
      toast('The file will be removed when you press Save.');
    },
    async 'delete-doc'(el) {
      const d = data.documents.find((x) => x.id === el.dataset.id);
      if (!d) return;
      const def = docDef(d.owner_type, d.doc_type) || { label: 'document' };
      if (!(await confirmBox(`Delete ${def.label}?`, 'The saved number, expiry date and photo will be deleted. This cannot be undone.'))) return;
      await Store.remove(user, 'documents', d.id);
      if (d.file_path) Store.deleteFile(user, d.file_path).catch(() => {});
      data.documents = data.documents.filter((x) => x.id !== d.id);
      render(); toast('Document deleted');
    },
    async 'enable-notif'() {
      if (notifState() === 'unsupported') { toast('This browser can’t show notifications. On iPhone, add the app to your Home Screen first.', 'error'); return; }
      const p = await Notification.requestPermission();
      render();
      if (p === 'granted') { toast('Notifications turned on ✓'); checkReminders(true); }
      else toast('Notifications were not allowed. You can allow them later in your browser settings.', 'error');
    },

    async 'delete-entry'(el) {
      const e = data.entries.find((x) => x.id === el.dataset.id);
      if (!e) return;
      if (!(await confirmBox('Delete this entry?', `${cat(e.category).label} · ${money(e.amount)} on ${dateLabel(e.date)}. This cannot be undone.`))) return;
      await Store.remove(user, 'entries', e.id);
      data.entries = data.entries.filter((x) => x.id !== e.id);
      render(); toast('Entry deleted');
    },
    async 'delete-bus'(el) {
      const b = busById(el.dataset.id);
      if (!b) return;
      if (!(await confirmBox(`Delete ${b.name}?`, 'Its documents will be deleted. Its past money in and out will be kept, but will no longer be linked to this bus.'))) return;
      await removeOwnerDocs('bus', b.id);
      await Store.remove(user, 'buses', b.id);
      data.buses = data.buses.filter((x) => x.id !== b.id);
      data.entries.forEach((e) => { if (e.bus_id === b.id) e.bus_id = null; });
      data.staff.forEach((s) => { if (s.bus_id === b.id) s.bus_id = null; });
      render(); toast('Bus deleted');
    },
    async 'delete-staff'(el) {
      const s = staffById(el.dataset.id);
      if (!s) return;
      if (!(await confirmBox(`Remove ${s.name}?`, 'Their documents will be deleted. Their past salary records will be kept.', 'Remove'))) return;
      await removeOwnerDocs('staff', s.id);
      await Store.remove(user, 'staff', s.id);
      data.staff = data.staff.filter((x) => x.id !== s.id);
      data.entries.forEach((e) => { if (e.staff_id === s.id) e.staff_id = null; });
      render(); toast('Staff member removed');
    },
    export(el) {
      const scope = el.dataset.scope;
      const biz = slug(data.profile.business_name || APP_NAME);
      let list; let name;
      if (scope === 'month') { list = inMonth(ui.month); name = `${biz}-${ui.month}.csv`; }
      else if (scope === 'year') { list = inYear(ui.year); name = `${biz}-${ui.year}.csv`; }
      else { list = data.entries; name = `${biz}-all-records.csv`; }
      if (!list.length) { toast('There are no records to download yet.'); return; }
      downloadCSV(list, name);
      toast('Downloaded ✓ Open it with Excel or Google Sheets');
    },
    print: () => window.print(),
    async logout() {
      await Store.signOut();
      user = null; data = emptyData(); ui.authTab = 'login';
      history.replaceState(null, '', location.pathname);
      render();
    },
    async 'load-sample'() {
      if (!(await confirmBox('Fill with sample data?', 'This adds 3 example buses, 5 staff, their documents and 3 months of example records so you can see how the app works. You can delete them all later in Settings.', 'Add sample data', false))) return;
      await loadSample();
      ui.month = monthOf(todayStr());
      go('home');
      toast('Sample data added ✓');
    },
    async wipe() {
      if (!(await confirmBox('Delete everything?', 'All buses, staff, documents and money records will be permanently deleted. Your login and business details stay. This cannot be undone.', 'Delete everything'))) return;
      await Store.wipe(user);
      data.buses = []; data.staff = []; data.entries = []; data.documents = [];
      render(); toast('All records deleted');
    },
    'auth-tab': (el) => { ui.authTab = el.dataset.v; render(); },
    'toggle-pw': (el) => {
      const input = el.parentElement.querySelector('input');
      input.type = input.type === 'password' ? 'text' : 'password';
      el.textContent = input.type === 'password' ? 'Show' : 'Hide';
    },
  };

  /* ---------- Event wiring ---------- */
  document.addEventListener('click', async (e) => {
    if (e.target.closest('a[href^="tel:"]')) return;
    const el = e.target.closest('[data-action]');
    if (!el || !actions[el.dataset.action]) return;
    e.preventDefault();
    try { await actions[el.dataset.action](el, e); } catch (err) { console.error(err); toast(friendly(err), 'error'); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('#sheet-root').classList.contains('open')) { closeSheet(); return; }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role=button][data-action]')) { e.preventDefault(); e.target.click(); }
  });
  document.addEventListener('submit', async (e) => {
    const f = e.target.closest('form[data-form]');
    if (!f || !forms[f.dataset.form]) return;
    e.preventDefault();
    const btn = f.querySelector('[type=submit]');
    if (btn) { if (btn.disabled) return; btn.disabled = true; }
    try { await forms[f.dataset.form](f); } catch (err) { console.error(err); toast(friendly(err), 'error'); } finally { if (btn) btn.disabled = false; }
  });
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('[data-change="bus-filter"]')) { ui.busFilter = t.value; render(); return; }
    const f = t.closest('form[data-form="entry"]');
    if (!f) return;
    if (t.name === 'category') syncEntryForm(f);
    if (t.name === 'staff_id' && t.value) {
      const s = staffById(t.value);
      if (s) {
        if (!f.elements.amount.value && Number(s.salary)) f.elements.amount.value = s.salary;
        if (s.bus_id && !f.elements.bus_id.value) f.elements.bus_id.value = s.bus_id;
      }
    }
    if (t.name === 'bus_id') syncEntryForm(f);
  });
  window.addEventListener('hashchange', () => { if ($('#sheet-root').classList.contains('open')) closeSheet(); render(); window.scrollTo(0, 0); });

  /* ---------- Start up ---------- */
  async function loadData() {
    const d = await Store.loadAll(user);
    data = { profile: d.profile || {}, buses: d.buses || [], staff: d.staff || [], entries: d.entries || [], documents: d.documents || [] };
    if (!data.profile.currency) data.profile.currency = guessCurrency();
    data.staff.forEach((s) => { if (s.role === 'Helper / Attendant') s.role = 'Lady Attendant'; });
    setTimeout(() => checkReminders(), 1500);
  }

  async function boot() {
    try {
      await Store.init();
      Store.onRecovery = () => { ui.recovery = true; render(); };
      ui.recovery = Store.isRecovery();
      user = await Store.getUser();
      if (user) await loadData();
      render();
      setInterval(() => checkReminders(), 30 * 60 * 1000); // checks again while the app stays open
    } catch (err) {
      console.error(err);
      $('#app').innerHTML = `<div class="auth"><div class="auth-card center"><div class="big-emoji">⚠️</div><h2>Could not start</h2>
        <p class="muted">${esc(friendly(err))}</p><button class="btn btn-primary btn-block" onclick="location.reload()">Try again</button></div></div>`;
    }
  }

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  boot();
})();
