/* DevOps-Infra Learn — Part 5 · Chapter 8: On-Call & Incident Command */
window.CH[8] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>A page firing at 3 a.m. is not the hard part — the hard part is what happens in the next ten minutes. Without clear roles, five people ' +
      'jump on a call, all start debugging in different directions, and nobody is actually coordinating or talking to stakeholders.</p>' +
      '<pre><code>NO STRUCTURE     everyone debugs, nobody communicates, duplicate work, no decision-maker\n' +
      'INCIDENT COMMAND  one IC coordinates, others execute assigned workstreams, one channel of truth</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A fire scene, not a crowd of bystanders.</b> A fire captain does not personally ' +
      'hold the hose — they assess, assign roles (this crew enters, this crew ventilates, this person talks to the family), and track the overall ' +
      'picture. A house fire with five untrained people all grabbing hoses in different directions is chaos even if every one of them is capable.</p></div>',
      try: [
        ['📖 Google SRE Book — Managing Incidents', 'https://sre.google/sre-book/managing-incidents/', 'o'],
        ['🚨 Ch 7 — symptom-based & burn-rate alerting', '#ch7', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code>CORE INCIDENT ROLES\n' +
      '  Incident Commander (IC)   owns the response — coordinates, makes the final call, does NOT debug\n' +
      '  Ops/Tech Lead              drives technical investigation and mitigation\n' +
      '  Communications Lead        updates stakeholders/status page on a cadence, keeps the IC free to lead\n' +
      '  Scribe                     timestamps every action/decision in the incident channel, for the postmortem\n\n' +
      'SEVERITY LEVELS (example)\n' +
      '  SEV1  full outage, all hands, IC required, exec comms      SEV2  degraded, partial impact\n' +
      '  SEV3  minor, no user impact, handled during business hours</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>The <b>Incident Command System (ICS)</b>, adapted from emergency-services ' +
      'response and popularized in tech by Google\'s and PagerDuty\'s incident response practices, is the industry-standard structure: named roles, a ' +
      'single communication channel, and a clear chain of decision authority — so a crisis does not also become a coordination problem.</p></div>',
      try: [
        ['📖 PagerDuty — incident response documentation', 'https://response.pagerduty.com/', 'o'],
        ['📖 Google SRE Book — being on-call', 'https://sre.google/sre-book/being-on-call/', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>No incident commander, five parallel investigations.</b> A payments outage ' +
      'pages four engineers who all join the same call and immediately split off to debug different theories — one restarts a service (masking a ' +
      'symptom another engineer was about to diagnose), another rolls back a deploy that was not the cause, and 20 minutes pass with no one able to ' +
      'answer "what is actually being tried right now." Assigning an IC on the first page — even before root cause is known — means one person tracks ' +
      'all active workstreams and prevents exactly this collision.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The IC gets pulled into debugging and stops communicating.</b> An IC who is ' +
      'also the most senior engineer starts personally reading stack traces mid-incident, and stakeholder updates stop for 40 minutes while support ' +
      'tickets pile up with no information to give customers. The fix is role discipline: the IC\'s job is coordination and communication cadence, not ' +
      'being the best debugger in the room — hand technical digging to the ops lead and keep the IC seat free to lead.</p></div>' +
      '<p><b>Rule of thumb:</b> the IC role exists precisely so the most technically capable person in the room is free to delegate instead of ' +
      'personally becoming the bottleneck.</p>',
      try: [
        ['📖 PagerDuty — incident roles', 'https://response.pagerduty.com/before/roles_and_responsibilities/', 'o'],
        ['📝 Ch 12 — postmortems & blameless culture', '#ch12', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'No named IC, "everyone helps"              Assign an IC on page 1, even before severity is fully known —\n' +
      '                                            role clarity beats waiting for certainty.\n' +
      'IC personally debugging                     IC coordinates and communicates; delegate technical\n' +
      '                                            investigation to an ops/tech lead.\n' +
      'Status updates only when something changes  Communicate on a fixed cadence (e.g. every 15-30 min) even\n' +
      '                                            to say "still investigating" — silence reads as "nobody is working it."\n' +
      'One-person on-call rotation, no backup       A lone on-call burns out and becomes a single point of\n' +
      '                                            failure — pair with a secondary/escalation path.\n' +
      'No severity levels, everything is a fire     Define SEV1-3 with clear criteria in advance — severity\n' +
      '                                            drives urgency, staffing, and comms, and must not be improvised live.\n' +
      'No scribe / no timestamped record            Reconstructing a timeline after the fact from memory is\n' +
      '                                            unreliable — assign a scribe from minute one for the postmortem.</code></pre>' +
      '<p><b>Real test:</b> run a game-day drill (Ch 9) with a simulated SEV1 and time how long it takes for someone to explicitly claim the IC role — ' +
      'if it takes more than a minute or two of ambiguity, the on-call process needs a clearer, pre-agreed default.</p>',
      try: [
        ['💥 Ch 9 — chaos engineering & game days', '#ch9', 'o'],
        ['📖 Google SRE Workbook — incident management', 'https://sre.google/workbook/incident-response/', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>Incident command is a communication protocol disguised as an org chart — its entire value is removing ambiguity about who decides and who ' +
      'talks to whom, freeing technical staff to work the problem instead of negotiating coordination in real time. Mature programs rehearse this ' +
      'structure before it is needed (game days, Ch 9) so role assignment on a real SEV1 is muscle memory, not a live decision, and they treat the IC ' +
      'role as a skill distinct from technical seniority — a strong IC keeps a calm, structured cadence regardless of whether they personally ' +
      'understand the failing subsystem.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: What is the core job of an Incident Commander, and what should they explicitly NOT do?\n' +
      'A: Coordinate the response, assign workstreams, own communication cadence, and make final calls under\n' +
      '   ambiguity. They should not personally debug — that pulls their attention away from the coordination\n' +
      '   job only they are doing.\n\n' +
      'Q: Why assign an IC immediately, even before the severity or root cause is known?\n' +
      'A: Waiting for certainty before assigning roles means the first critical minutes happen with no\n' +
      '   coordination at all — role clarity from page one prevents duplicate/conflicting actions (like two\n' +
      "   people independently rolling back different deploys).\n\n" +
      'Q: Why does communicating on a fixed cadence matter even when there is no new information?\n' +
      'A: Silence during an incident is read as "nobody is working on it" by stakeholders and support teams —\n' +
      '   a scheduled "still investigating, next update in 15m" keeps trust intact even without progress to report.\n\n' +
      'Q: Why have a dedicated scribe role during an incident?\n' +
      'A: A timestamped, real-time record of actions and decisions is far more reliable than reconstructing a\n' +
      '   timeline from memory afterward, and it becomes the factual backbone of the postmortem.\n\n' +
      'Q: How do severity levels (SEV1-3) improve incident response?\n' +
      'A: They pre-define urgency, required staffing, and communication expectations, so severity is assessed\n' +
      "   against a known rubric in the moment rather than argued about while the incident is ongoing.</code></pre>",
      try: [
        ['📖 Google SRE Book — Managing Incidents', 'https://sre.google/sre-book/managing-incidents/', 'o'],
        ['📝 Ch 12 — postmortems & blameless culture', '#ch12', 'o']
      ] }
  ],

  quiz: [
    { q: 'What should an Incident Commander (IC) primarily focus on during an incident?',
      opts: [
        'Personally debugging the root cause as the most senior engineer available',
        'Coordinating the response, assigning workstreams, and owning communication cadence — while delegating technical investigation to others',
        'Writing the postmortem in real time',
        'Restarting services until something works'],
      ok: 1,
      why: 'The IC role exists to keep coordination and communication staffed even while technical investigation is delegated to an ops/tech lead.' },
    { q: 'Why should an IC be assigned immediately, even before an incident\'s severity or root cause is known?',
      opts: [
        'It is a formality with no real operational effect',
        'Without early role assignment, the first critical minutes proceed with no coordination, risking duplicate or conflicting actions from multiple responders',
        'ICs are only needed for SEV3 incidents',
        'The IC role can only be assigned by a manager'],
      ok: 1,
      why: 'Early role clarity prevents the exact chaos of multiple engineers independently taking conflicting actions during the most critical early minutes.' },
    { q: 'Why does an incident need a dedicated scribe role?',
      opts: [
        'To handle customer support tickets',
        'To keep a real-time, timestamped record of actions and decisions, which is far more reliable than reconstructing a timeline from memory and becomes the basis for the postmortem',
        'Scribes are not actually necessary if the IC is experienced',
        'To replace the need for monitoring dashboards'],
      ok: 1,
      why: 'A live timestamped record is the factual backbone that makes an accurate, blameless postmortem possible afterward.' }
  ]
};
