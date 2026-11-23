/* =====================================================================
   BusBooks — where data is saved.
   - DEMO mode  : saved in this browser only (localStorage).
   - ONLINE mode: saved in your Supabase database with real logins.
   The mode is chosen automatically from config.js.
   ===================================================================== */
(function () {
  'use strict';

  const cfg = window.APP_CONFIG || {};
  const ONLINE = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);
  const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';

  // Only these fields are ever saved (keeps the database tidy and safe).
  const FIELDS = {
    buses: ['name', 'plate', 'school', 'monthly_rent', 'emi', 'seats', 'notes'],
    staff: ['name', 'role', 'phone', 'salary', 'bus_id'],
    entries: ['type', 'category', 'amount', 'date', 'bus_id', 'staff_id', 'liters', 'note'],
    documents: ['owner_type', 'owner_id', 'doc_type', 'number', 'expiry_date', 'file_path', 'file_name', 'file_type', 'note'],
  };
  const BUCKET = 'documents';
  function filePath(user, name) {
    const safe = String(name || 'file').replace(/[^\w.\-]+/g, '_').slice(-60);
    return user.id + '/' + uid() + '-' + safe;
  }
  function pick(table, row) {
    const out = {};
    FIELDS[table].forEach((k) => { if (row[k] !== undefined) out[k] = row[k]; });
    return out;
  }
  function profileRow(p) {
    return { business_name: p.business_name || '', owner_name: p.owner_name || '', currency: p.currency || 'USD', remind_days: Number(p.remind_days) || 30 };
  }
  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  /* ---------------- DEMO MODE ---------------- */
  function lsGet(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function lsSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
  }
  function lsDel(key) { try { localStorage.removeItem(key); } catch (e) { /* ignore */ } }
  async function hash(text) {
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('busbooks:' + text));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (e) { return 'plain:' + text; }
  }

  // Photos and PDFs in demo mode live in the browser's IndexedDB (it holds much more than localStorage).
  const Files = {
    db: null,
    open() {
      if (this.db) return Promise.resolve(this.db);
      return new Promise((resolve, reject) => {
        const req = indexedDB.open('busbooks-files', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('files');
        req.onsuccess = () => { this.db = req.result; resolve(this.db); };
        req.onerror = () => reject(new Error('Could not open file storage in this browser.'));
      });
    },
    async run(mode, fn) {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('files', mode);
        const req = fn(tx.objectStore('files'));
        tx.oncomplete = () => resolve(req && req.result);
        tx.onerror = () => reject(new Error('Could not save the file — browser storage may be full.'));
      });
    },
    put(key, blob) { return this.run('readwrite', (s) => s.put(blob, key)); },
    get(key) { return this.run('readonly', (s) => s.get(key)); },
    del(key) { return this.run('readwrite', (s) => s.delete(key)); },
    delPrefix(prefix) { return this.run('readwrite', (s) => s.delete(IDBKeyRange.bound(prefix, prefix + '￿'))); },
  };

  const Local = {
    mode: 'demo',
    onRecovery: null,
    async init() {
      if (!lsSet('bb_test', 1)) throw new Error('This browser is blocking storage (private mode?). Please open the app in a normal window.');
      lsDel('bb_test');
    },
    isRecovery() { return false; },
    async getUser() { const s = lsGet('bb_session', null); return s && s.user ? s.user : null; },
    async signUp(email, password, profile) {
      email = email.toLowerCase();
      const users = lsGet('bb_users', {});
      if (users[email]) throw new Error('This email already has an account. Please log in.');
      const user = { id: uid(), email };
      users[email] = { id: user.id, pw: await hash(password) };
      lsSet('bb_users', users);
      this._write(user, { profile: Object.assign({ id: user.id }, profileRow(profile)), buses: [], staff: [], entries: [], documents: [] });
      lsSet('bb_session', { user });
      return { user, needsConfirm: false };
    },
    async signIn(email, password) {
      email = email.toLowerCase();
      const u = lsGet('bb_users', {})[email];
      if (!u || u.pw !== (await hash(password))) throw new Error('Wrong email or password.');
      const user = { id: u.id, email };
      lsSet('bb_session', { user });
      return user;
    },
    async signOut() { lsDel('bb_session'); },
    async resetPassword() { throw new Error('Password reset only works with online accounts. In demo mode, please create a new account.'); },
    async updatePassword() { throw new Error('Not available in demo mode.'); },
    _read(user) {
      const d = lsGet('bb_data_' + user.id, null) || {};
      return { profile: d.profile || {}, buses: d.buses || [], staff: d.staff || [], entries: d.entries || [], documents: d.documents || [] };
    },
    _write(user, db) {
      if (!lsSet('bb_data_' + user.id, db)) throw new Error('Could not save — this browser’s storage is full or blocked.');
    },
    async loadAll(user) { return this._read(user); },
    async saveProfile(user, p) {
      const db = this._read(user);
      db.profile = Object.assign({}, db.profile, profileRow(p));
      this._write(user, db);
      return db.profile;
    },
    async insert(user, table, row) { return (await this.insertMany(user, table, [row]))[0]; },
    async insertMany(user, table, rows) {
      const db = this._read(user);
      const now = new Date().toISOString();
      const created = rows.map((r) => Object.assign({ id: uid(), created_at: now }, pick(table, r)));
      db[table] = db[table].concat(created);
      this._write(user, db);
      return created.map((r) => Object.assign({}, r));
    },
    async update(user, table, id, patch) {
      const db = this._read(user);
      const row = db[table].find((x) => x.id === id);
      if (!row) throw new Error('This item no longer exists.');
      Object.assign(row, pick(table, patch));
      this._write(user, db);
      return Object.assign({}, row);
    },
    async remove(user, table, id) {
      const db = this._read(user);
      db[table] = db[table].filter((x) => x.id !== id);
      if (table === 'buses') {
        db.staff.forEach((s) => { if (s.bus_id === id) s.bus_id = null; });
        db.entries.forEach((e) => { if (e.bus_id === id) e.bus_id = null; });
      }
      if (table === 'staff') db.entries.forEach((e) => { if (e.staff_id === id) e.staff_id = null; });
      this._write(user, db);
    },
    async wipe(user) {
      const db = this._read(user);
      db.buses = []; db.staff = []; db.entries = []; db.documents = [];
      this._write(user, db);
      await Files.delPrefix(user.id + '/').catch(() => {});
    },
    async uploadFile(user, p) {
      const path = filePath(user, p.name);
      await Files.put(path, p.blob);
      return path;
    },
    async fileUrl(user, path) {
      const blob = await Files.get(path);
      if (!blob) throw new Error('File not found on this device.');
      return URL.createObjectURL(blob);
    },
    async deleteFile(user, path) { await Files.del(path); },
  };

  /* ---------------- ONLINE MODE (Supabase) ---------------- */
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Could not reach the login service. Please check your internet connection.'));
      document.head.appendChild(s);
    });
  }
  const asUser = (u) => (u ? { id: u.id, email: u.email } : null);
  function check(res) { if (res.error) throw res.error; return res.data; }

  const Online = {
    mode: 'online',
    client: null,
    onRecovery: null,
    _recovery: false,
    async init() {
      this._recovery = /type=recovery/.test(location.hash);
      if (!window.supabase) await loadScript(SUPABASE_JS);
      this.client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
      this.client.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          this._recovery = true;
          if (this.onRecovery) this.onRecovery();
        }
      });
    },
    isRecovery() { return this._recovery; },
    async getUser() {
      const data = check(await this.client.auth.getSession());
      return asUser(data.session && data.session.user);
    },
    async signUp(email, password, profile) {
      const data = check(await this.client.auth.signUp({
        email, password,
        options: { data: profileRow(profile), emailRedirectTo: location.origin + location.pathname },
      }));
      // Supabase hides "email already used" for privacy: it returns a user with no identities.
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        throw new Error('This email already has an account. Please log in.');
      }
      if (!data.session) return { user: null, needsConfirm: true };
      const user = asUser(data.user);
      await this.saveProfile(user, profile);
      return { user, needsConfirm: false };
    },
    async signIn(email, password) {
      const data = check(await this.client.auth.signInWithPassword({ email, password }));
      return asUser(data.user);
    },
    async signOut() { await this.client.auth.signOut(); },
    async resetPassword(email) {
      check(await this.client.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }));
    },
    async updatePassword(password) {
      check(await this.client.auth.updateUser({ password }));
      this._recovery = false;
    },
    async _all(table, orderBy) {
      const size = 1000;
      let out = [];
      for (let from = 0; ; from += size) {
        const rows = check(await this.client.from(table).select('*').order(orderBy, { ascending: true }).range(from, from + size - 1));
        out = out.concat(rows);
        if (rows.length < size) break;
      }
      return out;
    },
    async loadAll(user) {
      const [profileRes, buses, staff, entries, documents] = await Promise.all([
        this.client.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        this._all('buses', 'created_at'),
        this._all('staff', 'created_at'),
        this._all('entries', 'date'),
        this._all('documents', 'created_at'),
      ]);
      let profile = check(profileRes);
      if (!profile) {
        // First login after confirming email: create the profile from sign-up details.
        const au = check(await this.client.auth.getUser()).user;
        profile = await this.saveProfile(user, (au && au.user_metadata) || {});
      }
      return { profile, buses, staff, entries, documents };
    },
    async saveProfile(user, p) {
      return check(await this.client.from('profiles').upsert(Object.assign({ id: user.id }, profileRow(p))).select().single());
    },
    async insert(user, table, row) {
      return check(await this.client.from(table).insert(pick(table, row)).select().single());
    },
    async insertMany(user, table, rows) {
      if (!rows.length) return [];
      return check(await this.client.from(table).insert(rows.map((r) => pick(table, r))).select());
    },
    async update(user, table, id, patch) {
      return check(await this.client.from(table).update(pick(table, patch)).eq('id', id).select().single());
    },
    async remove(user, table, id) {
      check(await this.client.from(table).delete().eq('id', id));
    },
    async wipe(user) {
      check(await this.client.from('documents').delete().eq('user_id', user.id));
      check(await this.client.from('entries').delete().eq('user_id', user.id));
      check(await this.client.from('staff').delete().eq('user_id', user.id));
      check(await this.client.from('buses').delete().eq('user_id', user.id));
      const files = check(await this.client.storage.from(BUCKET).list(user.id, { limit: 1000 })) || [];
      if (files.length) check(await this.client.storage.from(BUCKET).remove(files.map((f) => user.id + '/' + f.name)));
    },
    async uploadFile(user, p) {
      const path = filePath(user, p.name);
      check(await this.client.storage.from(BUCKET).upload(path, p.blob, { contentType: p.type, upsert: false }));
      return path;
    },
    async fileUrl(user, path) {
      return check(await this.client.storage.from(BUCKET).createSignedUrl(path, 3600)).signedUrl;
    },
    async deleteFile(user, path) {
      check(await this.client.storage.from(BUCKET).remove([path]));
    },
  };

  window.Store = ONLINE ? Online : Local;
})();
