/* DevOps-Infra Learn — Part 5 · Chapter 12: Postmortems & Blameless Culture */
window.CH[12] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>The instinct after an outage is to ask "who broke it." That question makes people defensive, hide information, and guarantees the same ' +
      'class of failure happens again — because the real, systemic cause never gets examined honestly.</p>' +
      '<pre><code>BLAME-FOCUSED    "Why did you deploy without checking X" -&gt; defensiveness, hidden details, no real fix\n' +
      'BLAMELESS         "Why did our process/tooling make it possible to deploy without checking X" -&gt; a real fix</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>An aviation accident investigation, not a courtroom.</b> Air-crash investigators ' +
      'do not exist to punish the pilot — they exist to find the systemic cause (a missing check, an ambiguous warning light) precisely because a fair, ' +
      'blame-free process is what gets people to report what actually happened, honestly, instead of covering it up.</p></div>',
      try: [
        ['📖 Google SRE Book — Postmortem Culture', 'https://sre.google/sre-book/postmortem-culture/', 'o'],
        ['📟 Ch 8 — on-call & incident command', '#ch8', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code>POSTMORTEM DOCUMENT — the standard shape\n' +
      '  Summary          what happened, impact, duration, in 2-3 sentences\n' +
      '  Timeline          timestamped, factual, pulled from the incident scribe\'s record (Ch 8)\n' +
      '  Root cause(s)      the systemic "why," usually more than one contributing factor\n' +
      '  What went well     what limited the blast radius or sped up detection/recovery\n' +
      '  Action items       specific, owned, tracked to completion — not vague "improve monitoring"\n\n' +
      '# a good action item vs a bad one\n' +
      'BAD    "Improve alerting"\n' +
      'GOOD   "Add burn-rate alert on checkout error budget, owner: @maria, due: next sprint, ticket: OBS-482"</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>Google\'s SRE <b>blameless postmortem</b> practice is the industry-standard model ' +
      '— write it up within days while memory is fresh, focus on systemic and process causes over individual actions, and treat the document as a ' +
      'learning artifact the whole org can read, not a disciplinary record.</p></div>',
      try: [
        ['📖 Google SRE Workbook — postmortem practices', 'https://sre.google/sre-book/postmortem-culture/', 'o'],
        ['📖 PagerDuty — postmortem template', 'https://postmortems.pagerduty.com/', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>A postmortem that stops at "human error."</b> An engineer fat-fingers a ' +
      'config value during a manual deploy, causing an outage, and the postmortem\'s root cause reads "engineer made a typo." Nothing changes, and six ' +
      'months later a different engineer makes a different typo with the same blast radius. Digging one level deeper — why was a typo-prone manual ' +
      'step on the critical path at all — leads to the real fix: schema-validated config with a CI check that would have caught the typo before it ' +
      'ever reached production.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>Action items that are written and never done.</b> A postmortem lists eight ' +
      'action items with no owner and no due date; a year later, seven of the eight are still open, and the exact failure mode recurs because the one ' +
      'item that would have prevented it was never actually completed. Tracking action items in the same ticketing system as regular work, with a ' +
      'named owner and a review cadence that checks completion, is what turns a postmortem from a write-once document into an actual fix.</p></div>' +
      '<p><b>Rule of thumb:</b> if a postmortem\'s root cause is a person\'s name or "human error" full stop, the analysis stopped one level too ' +
      'early — ask "why was that mistake possible" at least one more time.</p>',
      try: [
        ['📖 Etsy — the debriefing facilitation guide (blameless postmortems)', 'https://github.com/etsy/debriefing-facilitation-guide', 'o'],
        ['🚨 Ch 7 — symptom-based & burn-rate alerting', '#ch7', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'Root cause = "human error" / a name         Ask "why was that mistake possible" repeatedly (the 5-Whys\n' +
      '                                            style) until you reach a process/tooling gap you can fix.\n' +
      'Action items with no owner or due date       Every action item gets a named owner, a due date, and a\n' +
      '                                            ticket tracked to completion like any other engineering work.\n' +
      'Postmortem written weeks after the fact      Write it within a few days while the timeline and details\n' +
      '                                            are still fresh and accurate — memory degrades fast.\n' +
      'Postmortem only shared with the on-call team  Publish broadly (with appropriate redaction) — the whole\n' +
      '                                            org learns faster from a shared incident than a siloed one.\n' +
      'Postmortems only for SEV1 outages             Near-misses and smaller incidents often reveal the same\n' +
      '                                            systemic gaps before they cause a bigger one — write those up too.\n' +
      'A blameless process undermined by             If leadership reacts to a postmortem by quietly punishing\n' +
      '  quiet consequences afterward                  someone, the honesty stops immediately — blamelessness must be real, not stated.</code></pre>' +
      '<p><b>Real test:</b> six months after a postmortem, check whether its action items are actually closed and whether the same class of failure ' +
      'has recurred — a postmortem whose fixes were never implemented did not prevent anything, it just documented the incident.</p>',
      try: [
        ['📖 Google SRE Book — Postmortem Culture', 'https://sre.google/sre-book/postmortem-culture/', 'o'],
        ['📟 Ch 8 — on-call & incident command', '#ch8', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>A blameless postmortem culture is a trust infrastructure investment: its entire value depends on engineers believing, based on consistent ' +
      'past behavior, that honest disclosure of their own mistakes will not be used against them — one violation of that trust (a quiet consequence ' +
      'after a "blameless" review) poisons every future postmortem\'s honesty for years. The expert discipline treats postmortems as a data source, not ' +
      'just a ritual: patterns across many postmortems (recurring root-cause categories, repeatedly-missed action items) reveal systemic organizational ' +
      'gaps that no single incident\'s writeup would surface alone.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: What does "blameless" actually mean in a blameless postmortem — and what does it NOT mean?\n' +
      'A: It means focusing analysis on systemic/process causes rather than individual fault, on the premise\n' +
      '   that people acted reasonably given the information and tools they had. It does NOT mean ignoring\n' +
      '   human actions in the timeline — it means asking why the system made that mistake possible.\n\n' +
      'Q: Why is "human error" as a stated root cause considered incomplete?\n' +
      'A: It stops the analysis at the symptom instead of the cause — the real question is why a process or\n' +
      "   tooling gap allowed that error to have production impact, and fixing THAT prevents recurrence,\n" +
      '   fixing the person does not.\n\n' +
      'Q: What makes a postmortem action item effective versus decorative?\n' +
      'A: A named owner, a due date, and tracking in the same system as regular engineering work — vague,\n' +
      '   unowned items like "improve monitoring" rarely get done and provide no real prevention.\n\n' +
      'Q: Why write postmortems for near-misses, not just full outages?\n' +
      'A: A near-miss often shares the same systemic root cause as a future full outage, just with less\n' +
      '   impact this time — catching and fixing it at the near-miss stage is strictly cheaper.\n\n' +
      'Q: What single organizational behavior most reliably destroys a blameless postmortem culture?\n' +
      "A: Quietly punishing someone after a postmortem that was presented as blameless — even one instance\n" +
      "   teaches everyone that honesty in postmortems is unsafe, and disclosure quality collapses org-wide.</code></pre>",
      try: [
        ['📖 Google SRE Book — Postmortem Culture', 'https://sre.google/sre-book/postmortem-culture/', 'o'],
        ['🚑 Ch 15 — debugging a production incident, live walkthrough', '#ch15', 'o']
      ] }
  ],

  quiz: [
    { q: 'Why is stating "human error" as a postmortem\'s root cause considered incomplete?',
      opts: [
        'Human error is never actually a contributing factor',
        'It stops the analysis at the symptom rather than asking why the process or tooling made that mistake possible with production impact — fixing that systemic gap is what prevents recurrence',
        'Postmortems should never mention what any individual did',
        'It is complete, and no further analysis is needed'],
      ok: 1,
      why: 'A blameless postmortem digs past "who made the mistake" to "why did our systems allow that mistake to cause impact."' },
    { q: 'What makes a postmortem action item effective rather than decorative?',
      opts: [
        'Being written in formal language',
        'Having a named owner, a due date, and being tracked to completion in the same system as regular engineering work',
        'Being assigned to the entire team collectively with no individual owner',
        'Being reviewed only once, immediately after the postmortem meeting'],
      ok: 1,
      why: 'Unowned, undated action items rarely get completed — ownership and tracking are what turn a postmortem into an actual fix.' },
    { q: 'What single behavior most reliably destroys a "blameless" postmortem culture?',
      opts: [
        'Publishing postmortems broadly across the organization',
        'Quietly punishing someone after a postmortem that was presented as blameless — it teaches everyone that honest disclosure is unsafe',
        'Writing postmortems within a few days of the incident',
        'Including a timestamped timeline in the document'],
      ok: 1,
      why: 'Blamelessness only works if consistently honored — any hidden consequence after the fact collapses trust in the entire process going forward.' }
  ]
};
