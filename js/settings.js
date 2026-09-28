"use strict";
window.SMC = window.SMC || {};
SMC.settings = (function () {
    var THEME_KEY = 'smc-theme', ANIMATION_KEY = 'smc-theme-animations', REPORTS_KEY = 'smc-reports';
    var user = null;
    function ui() { return SMC.ui || {}; }
    function api() { return SMC.api || {}; }
    function toast(m, t) { if (ui().toast) ui().toast(m, t); }
    function esc(s) { s = (s == null) ? '' : String(s); return ui().esc ? ui().esc(s) : s; }
    function fmtDate(s) { return ui().fmtDate ? ui().fmtDate(s) : esc(s); }
    function isAdmin() { return !!(user && user.role === 'admin'); }
    var THEMES = ['wood', 'light', 'dark', 'sage', 'sakura'];
    function getTheme() {
        var t = document.documentElement.getAttribute('data-theme') || 'light';
        return THEMES.indexOf(t) >= 0 ? t : 'light';
    }
    function applyTheme(theme) {
        if (THEMES.indexOf(theme) < 0) theme = 'light';
        document.documentElement.setAttribute('data-theme', theme);
        try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
        syncThemeUI();
        toast('Theme changed to ' + ({ wood: 'Wood & Navy', light: 'Classic Light', dark: 'Classic Dark', sage: 'Calm Sage', sakura: 'Sakura' }[theme]) + '.', 'ok');
    }
    function animationsOn() { return document.documentElement.getAttribute('data-animations') !== 'off'; }
    function syncAnimationUI() {
        var b = document.getElementById('setAnimations'), on = animationsOn();
        if (!b) return;
        b.classList.toggle('on', on); b.setAttribute('aria-checked', on ? 'true' : 'false');
    }
    function toggleAnimations() {
        var on = !animationsOn();
        document.documentElement.setAttribute('data-animations', on ? 'on' : 'off');
        try { localStorage.setItem(ANIMATION_KEY, on ? 'on' : 'off'); } catch (e) {}
        syncAnimationUI(); toast('Theme animations turned ' + (on ? 'on.' : 'off.'), 'ok');
    }
    function syncThemeUI() {
        var current = getTheme();
        var cards = document.querySelectorAll('[data-theme-choice]');
        for (var i = 0; i < cards.length; i++) {
            var selected = cards[i].getAttribute('data-theme-choice') === current;
            cards[i].classList.toggle('selected', selected);
            cards[i].setAttribute('aria-checked', selected ? 'true' : 'false');
            cards[i].tabIndex = selected ? 0 : -1;
        }
    }
    function localReports() { try { return JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]') || []; } catch (e) { return []; } }
    function saveLocalReport(rep) {
        var arr = localReports();
        arr.unshift(rep);
        try { localStorage.setItem(REPORTS_KEY, JSON.stringify(arr.slice(0, 200))); } catch (e) {}
    }
    function sendReport() {
        var ta = document.getElementById('setReportMsg');
        var btn = document.getElementById('setReportSend');
        if (!ta) return;
        var msg = (ta.value || '').trim();
        if (!msg) { toast('Please describe the problem first.', 'warn'); return; }
        var rep = { id: 'r' + Date.now(), message: msg, name: (user && user.name) || 'You', role: (user && user.role) || '', username: (user && user.username) || '', status: 'Open', createdAt: new Date().toISOString() };
        if (btn) { btn.disabled = true; btn.textContent = 'Sending\u2026'; }
        function done(local) {
            if (btn) { btn.disabled = false; btn.textContent = 'Send report'; }
            ta.value = '';
            toast(local ? 'Report saved on this device. Redeploy the backend so admins can see it online.' : 'Report sent. Thank you!', local ? 'warn' : 'ok');
            renderReports();
        }
        if (api().saveReport) {
            api().saveReport(msg).then(function () { done(false); }).catch(function () { saveLocalReport(rep); done(true); });
        } else { saveLocalReport(rep); done(true); }
    }
    function renderReports() {
        var sec = document.getElementById('setReportsAdmin');
        if (!sec) return;
        if (!isAdmin()) { sec.style.display = 'none'; return; }
        sec.style.display = '';
        var list = document.getElementById('setReportsList');
        var cnt = document.getElementById('setReportsCount');
        if (!list) return;
        list.innerHTML = '<div class="set-empty">Loading\u2026</div>';
        function paint(rows, local) {
            rows = rows || [];
            if (cnt) cnt.textContent = rows.length ? '(' + rows.length + ')' : '';
            if (!rows.length) { list.innerHTML = '<div class="set-empty">No reports yet.</div>'; return; }
            list.innerHTML = rows.map(function (r) {
                return '<div class="set-report-item">' +
                    '<div class="set-report-top"><strong>' + esc(r.name || r.username || 'Unknown') + '</strong>' +
                    (r.role ? '<span class="set-report-role">' + esc(r.role) + '</span>' : '') +
                    '<span class="set-report-date">' + fmtDate(r.createdAt) + '</span></div>' +
                    '<div class="set-report-msg">' + esc(r.message) + '</div>' +
                    (local ? '<div class="set-report-local">On this device only</div>' : '') +
                    '</div>';
            }).join('');
        }
        if (api().listReports) {
            api().listReports().then(function (rows) { paint(rows, false); }).catch(function () { paint(localReports(), true); });
        } else { paint(localReports(), true); }
    }
    function open(u) {
        if (u) user = u;
        syncThemeUI();
        syncAnimationUI();
        renderReports();
        var m = document.getElementById('settingsModal');
        if (m) { m.classList.add('on'); m.setAttribute('aria-hidden', 'false'); }
    }
    function close() {
        var m = document.getElementById('settingsModal');
        if (m) { m.classList.remove('on'); m.setAttribute('aria-hidden', 'true'); }
    }
    function setUser(u) { user = u; }
    function bind() {
        var choices = document.getElementById('themeChoices');
        if (choices) {
            choices.addEventListener('click', function (e) { var c = e.target.closest('[data-theme-choice]'); if (c) applyTheme(c.getAttribute('data-theme-choice')); });
            choices.addEventListener('keydown', function (e) {
                if (e.key !== 'ArrowRight' && e.key !== 'ArrowDown' && e.key !== 'ArrowLeft' && e.key !== 'ArrowUp') return;
                e.preventDefault();
                var n = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
                var next = (THEMES.indexOf(getTheme()) + n + THEMES.length) % THEMES.length;
                applyTheme(THEMES[next]);
                var c = choices.querySelector('[data-theme-choice="' + THEMES[next] + '"]'); if (c) c.focus();
            });
        }
        var anim = document.getElementById('setAnimations');
        if (anim) anim.addEventListener('click', toggleAnimations);
        var replay = document.getElementById('setReplayTour');
        if (replay) replay.addEventListener('click', function () { close(); if (SMC.app && SMC.app.showUpdateTour) SMC.app.showUpdateTour(); });
        var sc = document.getElementById('setClose');
        if (sc) sc.addEventListener('click', close);
        var sr = document.getElementById('setReportSend');
        if (sr) sr.addEventListener('click', sendReport);
        var m = document.getElementById('settingsModal');
        if (m) m.addEventListener('click', function (e) { if (e.target === m) close(); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { var mm = document.getElementById('settingsModal'); if (mm && mm.classList.contains('on')) close(); } });
        syncThemeUI();
        syncAnimationUI();
    }
    return { open: open, close: close, bind: bind, setUser: setUser, applyTheme: applyTheme, getTheme: getTheme };
})();
