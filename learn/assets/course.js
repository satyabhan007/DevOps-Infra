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