/* DevOps-Infra Learn — Part 5 · Chapter 14: Runbooks & Automated Remediation */
window.CH[14] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>A page fires at 3 a.m. for a system the responder has never personally debugged before. Without a runbook, the first ten minutes are spent ' +
      'reconstructing what a more experienced engineer would already know — with one, those ten minutes are spent actually fixing the problem.</p>' +
      '<pre><code>NO RUNBOOK    "let me think about what could cause this..." -&gt; 20 minutes of cold-start investigation\n' +
      'RUNBOOK        alert links straight to: "1. check X. 2. if Y, run Z. 3. if that fails, escalate to..."</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A pilot\'s emergency checklist, not "remember your training."</b> A pilot facing ' +
      'an engine failure does not rely purely on memory under stress — they pull a physical checklist with exact, ordered steps, because a checklist ' +
      'executed calmly beats even excellent training recalled under panic.</p></div>',
      try: [
        ['📖 Google SRE Book — Eliminating Toil', 'https://sre.google/sre-book/eliminating-toil/', 'o'],
        ['🚨 Ch 7 — symptom-based & burn-rate alerting (alert-to-runbook links)', '#ch7', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code># a good runbook entry — specific, executable, no ambiguity\n' +
      '## Alert: CheckoutHighErrorRate\n' +
      '1. Check the trace exemplar linked on the alert -&gt; identify the failing span/service\n' +
      '2. If failing service = payments-gateway: check its /healthz and upstream provider status page\n' +
      '3. If provider outage confirmed: enable fallback provider via feature flag `payments.fallback=true`\n' +
      '4. If not resolved in 10 min: page payments-team secondary, escalate to SEV2\n\n' +
      '# automated remediation — the SAFE subset of runbooks, executed without a human\n' +
      'if error_rate(service) &gt; 0.05 for 5m and known_cause == "stuck_worker_pool":\n' +
      '    auto_restart(service, max_per_hour=1)   # bounded, logged, reversible, alerts if it fires</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>Runbooks are typically stored as version-controlled markdown/wiki pages linked ' +
      'directly from alerts, while automated remediation is implemented with tools like <b>AWS Systems Manager Automation</b>, <b>Rundeck</b>, or a ' +
      'custom operator/controller — always scoped to known, well-understood, reversible failure modes, never open-ended.</p></div>',
      try: [
        ['📖 AWS Systems Manager — Automation runbooks', 'https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-automation.html', 'o'],
        ['📖 Google SRE Book — Eliminating Toil', 'https://sre.google/sre-book/eliminating-toil/', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>A runbook that is a wall of prose nobody can follow under stress.</b> A ' +
      'team\'s runbook for a common failure is a five-paragraph narrative written by the original author, full of context but with no clear numbered ' +
      'steps — a new on-call engineer at 3 a.m. cannot extract "what do I actually type right now" from it fast enough. Rewriting it as short, ' +
      'numbered, copy-pasteable commands with explicit decision branches ("if X, do Y; if not, do Z") turns a 20-minute confused read into a 2-minute ' +
      'execution.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>Auto-remediation that masks a worsening problem.</b> An auto-restart rule ' +
      'silently restarts a stuck worker pool every time it happens, and it happens more and more often over weeks as an underlying memory leak grows — ' +
      'but because the symptom auto-resolves before anyone gets paged, nobody notices the leak until the restart frequency finally exceeds the safety ' +
      'cap and a real outage occurs. The fix is not removing the automation — it is alerting on the automation firing repeatedly, so the underlying ' +
      'trend surfaces to a human before it becomes an incident.</p></div>' +
      '<p><b>Rule of thumb:</b> automate the fix only for failure modes you deeply understand and can bound safely — automation that fires silently on ' +
      'an unbounded or worsening problem just delays the incident, it does not prevent it.</p>',
      try: [
        ['📖 Google SRE Book — Automation: enough machine, please', 'https://sre.google/sre-book/automation-at-google/', 'o'],
        ['📟 Ch 8 — on-call & incident command', '#ch8', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'Runbook is narrative prose, no clear steps  Numbered, copy-pasteable commands with explicit decision\n' +
      '                                            branches — optimized for execution under stress, not reading comprehension.\n' +
      'Runbook lives in someone\'s head/Slack DMs    Version-controlled, linked directly from the alert that\n' +
      '                                            triggers it — findable in seconds, not "ask Dave."\n' +
      'Auto-remediation with no cap or alerting    Bound every auto-action (max N per hour) and alert when it\n' +
      '                                            fires, so a worsening underlying trend surfaces to a human.\n' +
      'Automating an unbounded/poorly-understood     Automate only known, well-understood, reversible failure\n' +
      '  failure mode                                modes — automating a mystery risks masking or worsening it.\n' +
      'Runbook never tested until a real incident    Rehearse it during a chaos game day (Ch 9) — a runbook\n' +
      '                                            with a broken command in step 3 is worse than no runbook.\n' +
      'Runbook never updated after the system         Runbooks rot as the system changes; review/update them\n' +
      '  changes                                       as part of any change to the failure mode they cover.</code></pre>' +
      '<p><b>Real test:</b> hand the runbook to someone who has never touched the system and have them execute it live during a drill — every place ' +
      'they hesitate or ask "wait, what does this mean" is a gap to fix before the next real 3 a.m. page.</p>',
      try: [
        ['💥 Ch 9 — chaos engineering & game days (rehearsing runbooks)', '#ch9', 'o'],
        ['📖 Rundeck — runbook automation', 'https://www.rundeck.com/runbook-automation', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>Runbooks and auto-remediation sit on a deliberate spectrum: pure documentation for failure modes still requiring human judgment, and full ' +
      'automation only for failure modes understood and bounded well enough that a human\'s judgment adds nothing a script cannot. The expert discipline ' +
      'is treating "graduate this runbook to automation" as an earned step — a runbook executed correctly by multiple different humans, multiple times, ' +
      'with a well-understood blast radius, is a strong automation candidate; a rarely-seen or poorly-understood failure mode should stay a runbook ' +
      'until it is not rare or poorly understood anymore.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: What makes a runbook usable during an actual 3am incident versus merely existing?\n' +
      'A: Numbered, specific, copy-pasteable steps with explicit decision branches, linked directly from the\n' +
      '   triggering alert — a narrative wall of prose fails under time pressure and sleep deprivation exactly\n' +
      '   when it is needed most.\n\n' +
      'Q: What criteria should a failure mode meet before it is a good candidate for auto-remediation?\n' +
      'A: It must be well-understood, have a bounded and reversible fix, and be safe to apply repeatedly\n' +
      '   without human judgment — a poorly-understood or high-blast-radius failure should stay a runbook\n' +
      "   requiring a human's judgment call.\n\n" +
      'Q: Why must auto-remediation actions be capped and alerted on, not silent?\n' +
      'A: An uncapped, silent auto-fix can mask a worsening underlying problem (e.g. a growing memory leak)\n' +
      '   until it finally exceeds the automation\'s ability to compensate — alerting on the automation firing\n' +
      "   surfaces the trend to a human before that happens.\n\n" +
      'Q: How should runbooks be validated before relying on them during a real incident?\n' +
      'A: Rehearse them during chaos engineering game days (Ch 9) with someone unfamiliar with the system\n' +
      '   executing the steps live — any hesitation or broken command found in a drill is a gap fixed cheaply,\n' +
      "   instead of expensively during a real page.\n\n" +
      'Q: How do runbooks and automation relate to reducing toil?\n' +
      "A: A runbook turns repeated manual toil into a fast, consistent procedure; graduating a proven runbook\n" +
      "   to automation removes the human from the loop entirely for that specific, well-bounded case,\n" +
      "   freeing on-call time for the failures that still genuinely need judgment.</code></pre>",
      try: [
        ['📖 Google SRE Book — Eliminating Toil', 'https://sre.google/sre-book/eliminating-toil/', 'o'],
        ['🚑 Ch 15 — debugging a production incident, live walkthrough', '#ch15', 'o']
      ] }
  ],

  quiz: [
    { q: 'What makes a runbook usable during an actual high-stress incident?',
      opts: [
        'A detailed narrative explaining the full history of the system',
        'Numbered, specific, copy-pasteable steps with explicit decision branches, linked directly from the alert that triggers it',
        'A single paragraph summary with no steps',
        'Storing it only in one senior engineer\'s memory'],
      ok: 1,
      why: 'Under time pressure and sleep deprivation, a runbook needs to be executable, not merely informative.' },
    { q: 'What criteria should a failure mode meet before it becomes a good candidate for auto-remediation?',
      opts: [
        'Any failure mode is a good candidate for automation',
        'It should be well-understood, have a bounded and reversible fix, and be safe to apply repeatedly without requiring human judgment',
        'It should be a failure mode nobody has seen before',
        'Auto-remediation should never be capped or limited'],
      ok: 1,
      why: 'Automation is appropriate only where the fix is well-understood and safely bounded; poorly-understood failures still need human judgment.' },
    { q: 'Why must auto-remediation actions be capped (e.g. max N per hour) and alert when they fire?',
      opts: [
        'To make the automation run faster',
        'An uncapped, silent auto-fix can mask a worsening underlying problem until it finally exceeds what the automation can compensate for — alerting on it firing surfaces the trend to a human early',
        'Capping has no operational benefit',
        'It is only relevant for cost reasons'],
      ok: 1,
      why: 'Capping and alerting on automated fixes prevents silent masking of a degrading situation that eventually becomes a full incident.' }
  ]
};
