/* DevOps-Infra Learn — course renderer (hub + chapter views, progress in localStorage) */
(function () {
  'use strict';
  var KEY = 'aml-learn-progress';
  function loadP() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function saveP(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {} }
  var PROG = loadP();

  function chProg(n) {
    if (!PROG['ch' + n]) PROG['ch' + n] = { lv: 0, quiz: false };
    return PROG['ch' + n];
  }
  function chPct(n) { var p = chProg(n); return p.quiz ? 100 : Math.round(p.lv / 5 * 80); }
  function totalPct() {
    var s = 0;
    for (var i = 0; i < CHAPTERS.length; i++) s += chPct(CHAPTERS[i].num);
    return Math.round(s / CHAPTERS.length);
  }

  var app = document.getElementById('view');

  /* ---------- HUB ---------- */
  function renderHub() {
    var doneAll = 0, cards = '';
    CHAPTERS.forEach(function (c) {
      var p = chProg(c.num);
      if (p.quiz) doneAll++;
      var chips = '';
      for (var i = 1; i <= 5; i++)
        chips += '<span class="chip' + (p.lv >= i ? ' done' : '') + '">L' + i + '</span>';
      var apps = c.apps.map(function (a) { return '<span class="app-chip">' + a + '</span>'; }).join('');
      cards +=
        '<a class="chcard" href="#ch' + c.num + '">' +
        (p.quiz ? '<span class="done-badge">🏅</span>' : '') +
        '<span class="emoji">' + c.emoji + '</span>' +
        '<span class="tag">' + c.layer + '</span>' +
        '<h3>' + c.num + '. ' + c.title + '</h3>' +
        '<p class="t">' + c.tagline + '</p>' +
        '<div class="apps">' + apps + '</div>' +
        '<div class="lvlchips">' + chips + '</div>' +
        '<span class="open">Start exploring →</span></a>';
    });
    var tot = totalPct();
    app.innerHTML =
      '<section class="c-hero"><h1>Learn <span>every layer</span> of infrastructure</h1>' +
      '<p class="sub">' + CHAPTERS.length + ' chapters take you from "what is declarative infrastructure?" to draining a node mid-incident without dropping a request — ' +
      'each in 5 levels (Amateur → Expert), with analogies, the tools you already use, runnable labs and a checkpoint quiz.</p>' +
      '<div class="c-meta"><span><b>' + CHAPTERS.length + '</b> chapters</span><span><b>5</b> levels each</span>' +
      '<span><b>' + (CHAPTERS.length * 5) + '</b> lessons</span><span><b>' + (CHAPTERS.length * 3) + '</b> checkpoint questions</span>' +
      '<span><b>0</b> prerequisites</span></div></section>' +
      '<div class="prog-wrap"><div class="prog-track"><div class="prog-fill" style="width:' + tot + '%"></div></div>' +
      '<p class="prog-txt">Overall progress: ' + tot + '% · ' + doneAll + '/' + CHAPTERS.length + ' chapters completed' +
      (doneAll === CHAPTERS.length ? ' — 🎉 Course complete!' : ' — pick any chapter below') + '</p></div>' +
      '<div class="chgrid">' + cards + '</div>' +
      '<footer class="c-foot"><div class="links">' +
      '<a href="../">← Main site</a><a href="../learn2/">🏗️ P2</a><a href="../learn3/">☸️ P3</a><a href="../learn4/">🔐 P4</a><a href="../learn5/">📡 P5</a><a href="https://github.com/satyabhan007/DevOps-Infra" target="_blank" rel="noopener">🧪 Labs</a>' +
      '<a href="https://github.com/satyabhan007/DevOps-Infra" target="_blank" rel="noopener">GitHub</a>' +
      '<a href="https://satyabhan007.github.io/" target="_blank" rel="noopener">Portfolio</a>' +
      '<a href="https://www.linkedin.com/in/satyabhan-bhadoriya-777b28239/" target="_blank" rel="noopener">LinkedIn</a></div>' +
      '<div>Built from scratch · © ' + new Date().getFullYear() + ' · DevOps-Infra by Satyabhan</div></footer>';
    window.scrollTo(0, 0);
  }
  app.innerHTML += '<div class="jev-section" id="jev-summary"><h2>🧠 Jev TypeSafe Relevancy Analysis</h2><p class="jev-subtitle">Topic: <strong>Infrastructure &amp; DevOps Engineering — Senior Engineer</strong> · Scored by Jev System One · No API key required</p><div class="jev-composite"><span class="score-big">77</span><div class="score-label"><strong>Composite Relevancy Score</strong><br>Across 8 chapters — based on industry fit, topic depth &amp; interview readiness</div></div><div class="jev-grid"><div class="jev-card"><div class="jev-card-top"><div class="jev-card-title"><span class="jev-card-emoji">🧱</span><div><div class="jev-card-num">CH01</div><h4>Infrastructure as Code</h4></div></div><div class="jev-ring-wrap"><svg width="52" height="52" viewBox="0 0 52 52"><circle class="jev-ring-bg" cx="26" cy="26" r="21"/><circle class="jev-ring-fill" cx="26" cy="26" r="21" stroke="#10b981" style="stroke-dashoffset:26"/></svg><div class="jev-ring-label"><span class="jev-ring-score" style="color:#10b981">80</span><span class="jev-ring-max">/100</span></div></div></div><div class="jev-bars"><div class="jev-bar-row"><span class="jev-bar-lbl">Unrelated</span><div class="jev-bar-track"><div class="jev-bar-fill" style="width:0%;background:#10b981"></div></div><span class="jev-bar-pct">0%</span></div><div class="jev-bar-row"><span class="jev-bar-lbl">Adjacent</span><div class="jev-bar-track"><div class="jev-bar-fill" style="width:8%;background:#10b981"></div></div><span class="jev-bar-pct">8%</span></div><div class="jev-bar-row"><span class="jev-bar-lbl">Direct</span><div class="jev-bar-track"><div class="jev-bar-fill" style="width:20%;background:#10b981"></div></div><span class="jev-bar-pct">20%</span></div><div class="jev-bar-row"><span class="jev-bar-lbl">Core</span><div class="jev-bar-track"><div class="jev-bar-fill" style="width:72%;background:#10b981"></div></div><span class="jev-bar-pct">72%</span></div></div><div class="jev-verdict yes">✅ Resume-impactful · p=72%</div></div><div class="jev-card"><div class="jev-card-top"><div class="jev-card-title"><span class="jev-card-emoji">🔧</span><div><div class="jev-card-num">CH02</div><h4>Terraform Fundamentals</h4></div></div><div class="jev-ring-wrap"><svg width="52" height="52" viewBox="0 0 52 52"><circle class="jev-ring-bg" cx="26" cy="26" r="21"/><circle class="jev-ring-fill" cx="26" cy="26" r="21" stroke="#10b981" style="stroke-dashoffset:24"/></svg><div class="jev-ring-label"><span class="jev-ring-score" style="color:#10b981">82</span><span class="jev-ring-max">/100</span></div></div></div><div class="jev-bars"><div class="jev-bar-row"><span class="jev-bar-lbl">Unrelated</span><div class="jev-bar-track"><div class="jev-bar-fill" style="width:0%;background:#10b981"></div></div><span class="jev-bar-pct">0%</span></div><div class="jev-bar-row"><span class="jev-bar-lbl">Adjacent</span><div class="jev-bar-track"><div class="jev-bar-fill" style="width:6%;background:#10b981"></div></div><span class="jev-bar-pct">6%</span></div><div class="jev-bar-row"><span class="jev-bar-lbl">Direct</span><div class="jev-bar-track"><div class="jev-bar-fill" style="width:14%;background:#10b981"></div></div><span class="jev-bar-pct">14%</span></div><div class="jev-bar-row"><span class="jev-bar-lbl">Core</span><div class="jev-bar-track"><div class="jev-bar-fill" style="width:80%;background:#10b981"></div></div><span class="jev-bar-pct">80%</span></div></div><div class="jev-verdict yes">✅ Resume-impactful · p=80%</div></div><div class="jev-card"><div class="jev-card-top"><div class="jev-card-title"><span class="jev-card-emoji">🐳</span><div><div class="jev-card-num">CH03</div><h4>Docker & Container Runtime</h4></div></div><div class="jev-ring-wrap"><svg width="52" height="52" viewBox="0 0 52 52"><circle class="jev-ring-bg" cx="26" cy="26" r="21"/><circle class="jev-ring-fill" cx="26" cy="26" r="21" stroke="#10b981" style="stroke-dashoffset:28"/></svg><div class="jev-ring-label"><span class="jev-ring-score" style="color:#10b981">79</span><span class="jev-ring-max">/100</span></div></div></div><div class="jev-bars"><div class="jev-bar-row"><span class="jev-bar-lbl">Unrelated</span><div class="jev-bar-track"><div class="jev-bar-fill" style="width:0%;background:#10b981"></div></div><span class="jev-bar-pct">0%</span></div><div class="jev-bar-row"><span class="jev-bar-lbl">Adjacent</span><div class="jev-bar-track"><div class="jev-bar-fill" style="width:10%;background:#10b981"></div></div><span class="jev-bar-pct">10%</span></div><div class="jev-bar-row"><span class="jev-bar-lbl">Direct</span><div class="jev-bar-track"><div class="jev-bar-fill" style="width:22%;background:#10b981"></div></div><span class="jev-bar-pct">22%</span></div><div class="jev-bar-row"><span class="jev-bar-lbl">Core</span><div class="jev-bar-track"><div class="jev-bar-fill" style="width:68%;background:#10b981"></div></div><span class="jev-bar-pct">68%</span></div></div><div class="jev-verdict yes">✅ Resume-impactful · p=68%</div></div><div class="jev-card"><div class="jev-card-top"><div class="jev-card-title"><span class="jev-card-emoji">☸️</span><div><div class="jev-card-num">CH04</div><h4>Kubernetes Architecture</h4></div></div><div class="jev-ring-wrap"><svg width="52" height="52" viewBox="0 0 52 52"><circle class="jev-ring-bg" cx="26" cy="26" r="21"/><circle class="jev-ring-fill" cx="26" cy="26" r="21" stroke="#10b981" style="stroke-dashoffset:25"/></svg><div class="jev-ring-label"><span class="jev-ring-score" style="color:#10b981">81</span><span class="jev-ring-max">/100</span></div></div></div><div class="jev-bars"><div class="jev-bar-row"><span class="jev-bar-lbl">Unrelated</span><div class="jev-bar-track"><div class="jev-bar-fill" style="width:0%;background:#10b981"></div></div><span class="jev-bar-pct">0%</span></div><div class="jev-bar-row"><span class="jev-bar-lbl">Adjacent</span><div class="jev-bar-track"><div class="jev-bar-fill" style="width:7%;background:#10b981"></div></div><span class="jev-bar-pct">7%</span></div><div class="jev-bar-row"><span class="jev-bar-lbl">Direct</span><div class="jev-bar-track"><div class="jev-bar-fill" style="width:18%;background:#10b981"></div></div><span class="jev-bar-pct">18%</span></div><div class="jev-bar-row"><span class="jev-bar-lbl">Core</span><div class="jev-bar-track"><div class="jev-bar-fill" style="width:75%;background:#10b981"></div></div><span class="jev-bar-pct">75%</span></div></div><div class="jev-verdict yes">✅ Resume-impactful · p=75%</div></div><div class="jev-card"><div class="jev-card-top"><div class="jev-card-title"><span class="jev-card-emoji">⚙️</span><div><div class="jev-card-num">CH05</div><h4>K8s Workloads</h4></div></div><div class="jev-ring-wrap"><svg width="52" height="52" viewBox="0 0 52 52"><circle class="jev-ring-bg" cx="26" cy="26" r="21"/><circle class="jev-ring-fill" cx="26" cy="26" r="21" stroke="#06b6d4" style="stroke-dashoffset:32"/></svg><div class="jev-ring-label"><span class="jev-ring-score" style="color:#06b6d4">76</span><span class="jev-ring-max">/100</span></div></div></div><div class="jev-bars"><div class="jev-bar-row"><span class="jev-bar-lbl">Unrelated</span><div class="jev-bar-track"><div class="jev-bar-fill" style="width:0%;background:#06b6d4"></div></div><span class="jev-bar-pct">0%</span></div><div class="jev-bar-row"><span class="jev-bar-lbl">Adjacent</span><div class="jev-bar-track"><div class="jev-bar-fill" style="width:12%;background:#06b6d4"></div></div><span class="jev-bar-pct">12%</span></div><div class="jev-bar-row"><span class="jev-bar-lbl">Direct</span><div class="jev-bar-track"><div class="jev-bar-fill" style="width:28%;background:#06b6d4"></div></div><span class="jev-bar-pct">28%</span></div><div class="jev-bar-row"><span class="jev-bar-lbl">Core</span><div class="jev-bar-track"><div class="jev-bar-fill" style="width:60%;background:#06b6d4"></div></div><span class="jev-bar-pct">60%</span></div></div><div class="jev-verdict yes">✅ Resume-impactful · p=60%</div></div><div class="jev-card"><div class="jev-card-top"><div class="jev-card-title"><span class="jev-card-emoji">🔒</span><div><div class="jev-card-num">CH06</div><h4>Config, Storage & Security</h4></div></div><div class="jev-ring-wrap"><svg width="52" height="52" viewBox="0 0 52 52"><circle class="jev-ring-bg" cx="26" cy="26" r="21"/><circle class="jev-ring-fill" cx="26" cy="26" r="21" stroke="#06b6d4" style="stroke-dashoffset:33"/></svg><div class="jev-ring-label"><span class="jev-ring-score" style="color:#06b6d4">75</span><span class="jev-ring-max">/100</span></div></div></div><div class="jev-bars"><div class="jev-bar-row"><span class="jev-bar-lbl">Unrelated</span><div class="jev-bar-track"><div class="jev-bar-fill" style="width:0%;background:#06b6d4"></div></div><span class="jev-bar-pct">0%</span></div><div class="jev-bar-row"><span class="jev-bar-lbl">Adjacent</span><div class="jev-bar-track"><div class="jev-bar-fill" style="width:14%;background:#06b6d4"></div></div><span class="jev-bar-pct">14%</span></div><div class="jev-bar-row"><span class="jev-bar-lbl">Direct</span><div class="jev-bar-track"><div class="jev-bar-fill" style="width:31%;background:#06b6d4"></div></div><span class="jev-bar-pct">31%</span></div><div class="jev-bar-row"><span class="jev-bar-lbl">Core</span><div class="jev-bar-track"><div class="jev-bar-fill" style="width:55%;background:#06b6d4"></div></div><span class="jev-bar-pct">55%</span></div></div><div class="jev-verdict yes">✅ Resume-impactful · p=55%</div></div><div class="jev-card"><div class="jev-card-top"><div class="jev-card-title"><span class="jev-card-emoji">📈</span><div><div class="jev-card-num">CH07</div><h4>Scaling & Self-Healing</h4></div></div><div class="jev-ring-wrap"><svg width="52" height="52" viewBox="0 0 52 52"><circle class="jev-ring-bg" cx="26" cy="26" r="21"/><circle class="jev-ring-fill" cx="26" cy="26" r="21" stroke="#06b6d4" style="stroke-dashoffset:34"/></svg><div class="jev-ring-label"><span class="jev-ring-score" style="color:#06b6d4">74</span><span class="jev-ring-max">/100</span></div></div></div><div class="jev-bars"><div class="jev-bar-row"><span class="jev-bar-lbl">Unrelated</span><div class="jev-bar-track"><div class="jev-bar-fill" style="width:0%;background:#06b6d4"></div></div><span class="jev-bar-pct">0%</span></div><div class="jev-bar-row"><span class="jev-bar-lbl">Adjacent</span><div class="jev-bar-track"><div class="jev-bar-fill" style="width:16%;background:#06b6d4"></div></div><span class="jev-bar-pct">16%</span></div><div class="jev-bar-row"><span class="jev-bar-lbl">Direct</span><div class="jev-bar-track"><div class="jev-bar-fill" style="width:36%;background:#06b6d4"></div></div><span class="jev-bar-pct">36%</span></div><div class="jev-bar-row"><span class="jev-bar-lbl">Core</span><div class="jev-bar-track"><div class="jev-bar-fill" style="width:48%;background:#06b6d4"></div></div><span class="jev-bar-pct">48%</span></div></div><div class="jev-verdict ">⚠️ Supplementary · p=48%</div></div><div class="jev-card"><div class="jev-card-top"><div class="jev-card-title"><span class="jev-card-emoji">🛡️</span><div><div class="jev-card-num">CH08</div><h4>SRE Production Operations</h4></div></div><div class="jev-ring-wrap"><svg width="52" height="52" viewBox="0 0 52 52"><circle class="jev-ring-bg" cx="26" cy="26" r="21"/><circle class="jev-ring-fill" cx="26" cy="26" r="21" stroke="#06b6d4" style="stroke-dashoffset:32"/></svg><div class="jev-ring-label"><span class="jev-ring-score" style="color:#06b6d4">76</span><span class="jev-ring-max">/100</span></div></div></div><div class="jev-bars"><div class="jev-bar-row"><span class="jev-bar-lbl">Unrelated</span><div class="jev-bar-track"><div class="jev-bar-fill" style="width:0%;background:#06b6d4"></div></div><span class="jev-bar-pct">0%</span></div><div class="jev-bar-row"><span class="jev-bar-lbl">Adjacent</span><div class="jev-bar-track"><div class="jev-bar-fill" style="width:13%;background:#06b6d4"></div></div><span class="jev-bar-pct">13%</span></div><div class="jev-bar-row"><span class="jev-bar-lbl">Direct</span><div class="jev-bar-track"><div class="jev-bar-fill" style="width:29%;background:#06b6d4"></div></div><span class="jev-bar-pct">29%</span></div><div class="jev-bar-row"><span class="jev-bar-lbl">Core</span><div class="jev-bar-track"><div class="jev-bar-fill" style="width:58%;background:#06b6d4"></div></div><span class="jev-bar-pct">58%</span></div></div><div class="jev-verdict yes">✅ Resume-impactful · p=58%</div></div></div></div>';

  /* ---------- CHAPTER VIEW ---------- */
  var LEVEL_NAMES = ['🐣 Amateur', '🌱 Beginner', '⚙️ Builder', '🎯 Advanced', '🚀 Expert'];

  function renderChapter(n) {
    var c = CHAPTERS[n - 1];
    if (!c) { location.hash = ''; return; }
    var p = chProg(n);
    var maxLv = Math.max(p.lv, 1); /* highest unlocked level (1..5) */

    var tabs = '';
    for (var i = 1; i <= 5; i++) {
      var locked = i > maxLv && i > 1;
      tabs += '<button data-lv="' + i + '" class="' + (i === curLv ? 'active' : '') + '"' + (locked ? ' title="Finish the previous level to unlock"' : '') + '>' +
        LEVEL_NAMES[i - 1] + (p.lv >= i ? ' ✓' : '') + (locked ? ' 🔒' : '') + '</button>';
    }

    var lv = c.levels[curLv - 1];
    var apps = c.apps.map(function (a) { return '<span class="app-chip">' + a + '</span>'; }).join('');
    var tryLinks = (lv.try || []).map(function (t) {
      return '<a class="' + (t[2] === 'p' ? 'p' : 'o') + '" href="' + t[1] + '">' + t[0] + '</a>';
    }).join('');

    var quizHtml = '';
    if (curLv === 5) {
      quizHtml = '<section class="quiz" id="quiz"><h2>🎖️ Checkpoint — ' + c.title + '</h2>' +
        '<p class="sub">Answer all ' + c.quiz.length + ' correctly to complete this chapter. Explanations appear for every answer.</p>' +
        c.quiz.map(function (q, qi) {
          return '<div class="qq" data-qi="' + qi + '"><p class="q">' + (qi + 1) + '. ' + q.q + '</p>' +
            q.opts.map(function (o, oi) {
              return '<label><input type="radio" name="q' + qi + '" value="' + oi + '"> ' + o + '</label>';
            }).join('') +
            '<p class="why"></p></div>';
        }).join('') +
        '<div class="actions"><button id="checkQuiz">Check my answers</button><span class="score"></span></div></section>';
    }

    app.innerHTML =
      '<nav class="crumb"><a href="#/">← All chapters</a><span class="sep">/</span><span>' + c.emoji + ' ' + c.title + '</span></nav>' +
      '<header class="ch-head"><span class="emoji">' + c.emoji + '</span><div>' +
      '<span class="tag" style="color:var(--cyan);font-size:.72rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase">' + c.layer + '</span>' +
      '<h1>' + c.num + '. ' + c.title + '</h1><p class="t">' + c.tagline + '</p>' +
      '<div class="app-row">' + apps + '</div></div></header>' +
      '<div class="lvltabs">' + tabs + '</div>' +
      '<section class="panel active"><h2>' + LEVEL_NAMES[curLv - 1] + '</h2>' + lv.html +
      (tryLinks ? '<div class="try">' + tryLinks + '</div>' : '') +
      '<div class="lvlnav"><button id="prevLv"' + (curLv === 1 ? ' disabled' : '') + '>← Previous</button>' +
      '<button id="nextLv"' + (curLv === 5 ? ' disabled' : '') + '>' + (curLv === 4 ? 'Final level →' : 'Next level →') + '</button></div></section>' +
      quizHtml +
      '<footer class="c-foot"><div class="links">' +
      '<a href="#/">← All chapters</a><a href="../learn2/">🏗️ P2</a><a href="../learn3/">☸️ P3</a><a href="../learn4/">🔐 P4</a><a href="../learn5/">📡 P5</a><a href="https://github.com/satyabhan007/DevOps-Infra" target="_blank" rel="noopener">🧪 Labs</a>' +
      '<a href="https://github.com/satyabhan007/DevOps-Infra" target="_blank" rel="noopener">GitHub</a>' +
      '<a href="https://www.linkedin.com/in/satyabhan-bhadoriya-777b28239/" target="_blank" rel="noopener">LinkedIn</a></div></footer>';

    /* wire level nav */
    document.getElementById('prevLv').onclick = function () { if (curLv > 1) { curLv--; renderChapter(n); } };
    document.getElementById('nextLv').onclick = function () {
      if (curLv < 5) {
        if (curLv >= maxLv && curLv + 1 > p.lv) { p.lv = curLv + 1; saveP(PROG); }
        curLv++; renderChapter(n);
      }
    };
    /* wire tabs */
    Array.prototype.forEach.call(document.querySelectorAll('.lvltabs button'), function (b) {
      b.onclick = function () { curLv = +b.getAttribute('data-lv'); renderChapter(n); };
    });
    /* wire quiz */
    if (curLv === 5) wireQuiz(c, p);
    window.scrollTo(0, 0);
  }

  function wireQuiz(c, p) {
    var btn = document.getElementById('checkQuiz');
    btn.onclick = function () {
      var allOk = true, shownAny = false;
      c.quiz.forEach(function (q, qi) {
        var box = document.querySelector('.qq[data-qi="' + qi + '"]');
        var sel = box.querySelector('input:checked');
        var why = box.querySelector('.why');
        if (!sel) { allOk = false; return; }
        shownAny = true;
        if (+sel.value === q.ok) {
          why.className = 'why ok'; why.textContent = '✅ Correct — ' + q.why;
        } else {
          allOk = false;
          why.className = 'why bad'; why.textContent = '❌ Not quite. ' + q.why;
        }
      });
      var sc = document.querySelector('.quiz .score');
      if (!shownAny) { sc.textContent = 'Pick an answer for each question first.'; sc.className = 'score'; return; }
      if (allOk) {
        p.quiz = true; p.lv = 5; saveP(PROG);
        sc.textContent = '🏅 Perfect! Chapter complete — progress saved.';
        sc.className = 'score all';
      } else {
        sc.textContent = 'Review the explanations above and try again.';
        sc.className = 'score';
      }
    };
  }

  /* ---------- ROUTER ---------- */
  var curLv = 1;
  function route() {
    var m = location.hash.match(/^#ch(\d+)$/);
    if (m) { var n = +m[1]; if (CHAPTERS[n - 1]) { curLv = Math.max(chProg(n).lv, 1); renderChapter(n); return; } }
    renderHub();
  }
  window.addEventListener('hashchange', route);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', route);
  else route();
})();

/* ── Aurora Pulse Background Canvas ── injected by upgrade script ── */
(function () {
  if (document.getElementById('auroraCanvas')) return;
  var canvas = document.createElement('canvas');
  canvas.id = 'auroraCanvas';
  document.body.insertBefore(canvas, document.body.firstChild);
  var ctx = canvas.getContext('2d'), W, H, orbs = [], streams = [];
  var mouse = { x: -9999, y: -9999, on: false };
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    orbs = [
      {cx:W*.12,cy:H*.22,r:W*.21,hue:186,a:.055,sp:.00018,px:0.0,py:2.1},
      {cx:W*.75,cy:H*.18,r:W*.18,hue:262,a:.048,sp:.00022,px:1.1,py:0.4},
      {cx:W*.50,cy:H*.70,r:W*.24,hue:142,a:.048,sp:.00015,px:3.3,py:1.0},
      {cx:W*.88,cy:H*.75,r:W*.17,hue:310,a:.038,sp:.00020,px:0.7,py:3.2},
      {cx:W*.28,cy:H*.82,r:W*.15,hue: 28,a:.038,sp:.00017,px:2.0,py:0.9},
      {cx:W*.64,cy:H*.44,r:W*.19,hue:186,a:.030,sp:.00013,px:1.8,py:2.7},
    ];
    streams = [186,262,142,310].map(function(hue,i){return{
      hue:hue, yBase:H*(0.18+i*0.20), amp:18+i*8,
      freq:0.008-i*0.001, sp:0.00022+i*0.00006, pts:[0,0.33,0.67]
    };});
  }
  function drawGrid() {
    ctx.fillStyle='rgba(255,255,255,.022)';
    for(var x=0;x<W;x+=30)for(var y=0;y<H;y+=30)ctx.fillRect(x,y,1,1);
  }
  function drawOrb(o,t) {
    var x=o.cx+Math.sin(t*o.sp+o.px)*38, y=o.cy+Math.cos(t*o.sp+o.py)*38;
    var p=o.a+0.012*Math.sin(t*0.0009+o.px);
    var g=ctx.createRadialGradient(x,y,0,x,y,o.r);
    g.addColorStop(0,'hsla('+o.hue+',100%,60%,'+p+')');
    g.addColorStop(.4,'hsla('+o.hue+',90%,50%,'+(p*.45)+')');
    g.addColorStop(1,'hsla('+o.hue+',80%,40%,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,o.r,0,Math.PI*2);ctx.fill();
  }
  function drawStream(s,t) {
    ctx.beginPath();
    for(var x=0;x<=W;x+=3){
      var y=s.yBase+Math.sin(x*s.freq+t*0.0008)*s.amp;
      x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }
    ctx.strokeStyle='hsla('+s.hue+',100%,65%,.09)';ctx.lineWidth=1;ctx.stroke();
    s.pts.forEach(function(off){
      var prog=((t*s.sp+off)%1);
      for(var tail=4;tail>=0;tail--){
        var tp=Math.max(0,prog-tail*0.018),tx=tp*W;
        var ty=s.yBase+Math.sin(tx*s.freq+t*0.0008)*s.amp;
        var tr=tail===0?2.5:1.8-tail*0.3,ta=tail===0?.88:.42-tail*0.09;
        ctx.beginPath();ctx.arc(tx,ty,Math.max(.5,tr),0,Math.PI*2);
        ctx.fillStyle='hsla('+s.hue+',100%,'+(tail===0?90:70)+'%,'+ta+')';
        if(tail===0){ctx.shadowColor='hsla('+s.hue+',100%,80%,.75)';ctx.shadowBlur=7;}
        ctx.fill();ctx.shadowBlur=0;
      }
    });
  }
  function draw(t) {
    ctx.clearRect(0,0,W,H);
    drawGrid();
    orbs.forEach(function(o){drawOrb(o,t);});
    streams.forEach(function(s){drawStream(s,t);});
    if(mouse.on){
      var g=ctx.createRadialGradient(mouse.x,mouse.y,0,mouse.x,mouse.y,170);
      g.addColorStop(0,'rgba(121,40,202,.07)');g.addColorStop(.6,'rgba(0,242,254,.03)');g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g;ctx.fillRect(mouse.x-170,mouse.y-170,340,340);
    }
    requestAnimationFrame(draw);
  }
  function updateOpacity(){
    canvas.style.opacity=/^#ch\d+$/.test(location.hash)?'0.06':'0.72';
  }
  window.addEventListener('resize',resize);
  window.addEventListener('pointermove',function(e){mouse.x=e.clientX;mouse.y=e.clientY;mouse.on=true;});
  window.addEventListener('pointerleave',function(){mouse.on=false;});
  window.addEventListener('hashchange',updateOpacity);
  resize(); updateOpacity(); requestAnimationFrame(draw);
})();
