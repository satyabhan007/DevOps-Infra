/* ============================================================
   AI-ML GitHub Pages — Main JavaScript
   Handles: smooth scroll, copy code, animations, dynamic year
   ============================================================ */

(function () {
    'use strict';

    /* ---- Dynamic year in footer ---- */
    function updateYear() {
        const yearEl = document.getElementById('current-year');
        if (yearEl) {
            yearEl.textContent = new Date().getFullYear();
        }
    }

    /* ---- Copy code button ---- */
    function initCopyButtons() {
        const buttons = document.querySelectorAll('.copy-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const target = this.getAttribute('data-target');
                const codeEl = document.querySelector(target);
                if (!codeEl) return;
                const text = codeEl.textContent || codeEl.innerText;
                navigator.clipboard.writeText(text).then(() => {
                    const original = this.textContent;
                    this.textContent = '✓ Copied!';
                    this.style.background = 'var(--green)';
                    this.style.color = 'var(--bg)';
                    setTimeout(() => {
                        this.textContent = original;
                        this.style.background = '';
                        this.style.color = '';
                    }, 1500);
                }).catch(() => {
                    this.textContent = '✗ Failed';
                    setTimeout(() => { this.textContent = 'Copy'; }, 1500);
                });
            });
        });
    }

    /* ---- Smooth scroll for anchor links ---- */
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    /* ---- Scroll reveal animation ---- */
    function initScrollReveal() {
        const revealElements = document.querySelectorAll('.reveal');
        if (!revealElements.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

        revealElements.forEach(el => observer.observe(el));
    }

    /* ---- Navbar background on scroll ---- */
    function initNavScroll() {
        const header = document.querySelector('.site-header');
        if (!header) return;
        const toggleBg = () => {
            header.style.background = window.scrollY > 10
                ? 'rgba(11, 15, 25, 0.95)'
                : 'rgba(11, 15, 25, 0.85)';
        };
        window.addEventListener('scroll', toggleBg);
        toggleBg();
    }

    /* ---- Phase card progress indicators ---- */
    function initPhaseLinks() {
        // Add click handlers for phase cards that link to sections
        document.querySelectorAll('.phase-card a').forEach(link => {
            link.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        });
    }

    /* ---- Init ---- */
    document.addEventListener('DOMContentLoaded', function () {
        updateYear();
        initCopyButtons();
        initSmoothScroll();
        initScrollReveal();
        initNavScroll();
        initPhaseLinks();
    });
})();

/* ── Aurora Pulse Background Canvas ── injected by upgrade script ── */
(function () {
  if (document.getElementById('auroraCanvas-started')) return;

  var canvas = document.getElementById('auroraCanvas');
  if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'auroraCanvas';
      document.body.insertBefore(canvas, document.body.firstChild);
  }

  // mark as started
  var marker = document.createElement('div');
  marker.id = 'auroraCanvas-started';
  marker.style.display = 'none';
  document.body.appendChild(marker);

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

/* ---- Terminal Simulator Logic ---- */
(function() {
    'use strict';
    function initTerminalSimulator() {
        const runButtons = document.querySelectorAll('.run-btn');
        const termWindow = document.getElementById('terminal-sim');
        if (!termWindow) return;
        const termBody = termWindow.querySelector('.terminal-body');
        const termClose = termWindow.querySelector('.terminal-close');

        const outputs = {
            '#cmd-clone': [
                "Cloning into 'DevOps-Infra'...",
                "remote: Enumerating objects: 1542, done.",
                "remote: Counting objects: 100% (342/342), done.",
                "remote: Compressing objects: 100% (180/180), done.",
                "remote: Total 1542 (delta 182), reused 298 (delta 156), pack-reused 1200",
                "Receiving objects: 100% (1542/1542), 4.2 MB | 8.1 MB/s, done.",
                "Resolving deltas: 100% (802/802), done."
            ],
            '#cmd-test': [
                "================ test session starts =================",
                "platform linux -- Python 3.10.12",
                "rootdir: /tmp/DevOps-Infra",
                "collected 15 items",
                "",
                "lab/validate.py ................................ [100%]",
                "",
                "================ 15 passed in 0.42s ================="
            ],
            '#cmd-lab': [
                "Initializing the backend...",
                "",
                "Successfully configured the backend \"local\"! Terraform will automatically",
                "use this backend unless the backend configuration changes.",
                "",
                "Initializing provider plugins...",
                "- Finding latest version of hashicorp/random...",
                "- Installing hashicorp/random v3.5.1...",
                "- Installed hashicorp/random v3.5.1 (signed by HashiCorp)",
                "",
                "Terraform has been successfully initialized!"
            ]
        };

        if (termClose) {
            termClose.addEventListener('click', () => {
                termWindow.style.display = 'none';
            });
        }

        let activeTimeout = null;
        runButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();

                if (activeTimeout) {
                    clearTimeout(activeTimeout);
                }

                const targetId = this.getAttribute('data-target');
                const outputLines = outputs[targetId] || ["Command execution started..."];

                termWindow.style.display = 'block';
                termWindow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

                termBody.innerHTML = '';

                // Typing effect
                let lineIdx = 0;
                function typeLine() {
                    if (lineIdx < outputLines.length) {
                        const p = document.createElement('div');
                        p.className = 'term-line';
                        p.textContent = outputLines[lineIdx];
                        termBody.appendChild(p);
                        termWindow.scrollTop = termWindow.scrollHeight;
                        lineIdx++;
                        activeTimeout = setTimeout(typeLine, Math.random() * 200 + 50);
                    } else {
                        const p = document.createElement('div');
                        p.className = 'term-line prompt';
                        p.innerHTML = '<span class="prompt-user">user@host</span>:<span class="prompt-dir">~/DevOps-Infra</span>$ <span class="blink">_</span>';
                        termBody.appendChild(p);
                        termWindow.scrollTop = termWindow.scrollHeight;
                    }
                }

                // Initial prompt
                const cmdText = document.querySelector(targetId).textContent;
                const p = document.createElement('div');
                p.className = 'term-line prompt initial';
                p.innerHTML = '<span class="prompt-user">user@host</span>:<span class="prompt-dir">~/DevOps-Infra</span>$ ' + cmdText;
                termBody.appendChild(p);

                activeTimeout = setTimeout(typeLine, 400);
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTerminalSimulator);
    } else {
        initTerminalSimulator();
    }
})();
