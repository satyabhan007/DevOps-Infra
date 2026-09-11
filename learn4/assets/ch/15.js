/* DevOps-Infra Learn — Part 4 · Chapter 15: Debugging a Network Outage — a Live Walkthrough */
window.CH[15] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>This chapter is a <b>case study</b>: a walkthrough of a real-shaped incident — "everything suddenly can\'t reach the database" — read top ' +
      'to bottom the way it actually unfolds, using the tools from every earlier chapter in this part (VPC route tables, security groups, DNS, IAM) ' +
      'as the actual diagnostic toolkit, not abstract theory.</p>' +
      '<pre><code>09:14  PagerDuty fires: error rate on checkout-api spikes to 80%\n' +
      '09:15  on-call opens the dashboard: every backend pod is failing DB connection attempts, timing out\n' +
      '09:16  first question, always: "did anything change recently?" — check the deploy log and change log</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A detective, not a firefighter.</b> The instinct under pressure is to start ' +
      'changing things (restart the service! reboot the database!) — but a detective doesn\'t start moving evidence around before understanding the ' +
      'scene. The first move is always to gather signal (logs, metrics, recent changes) methodically, narrowing from "everything is broken" to the ' +
      'ONE layer that actually broke, before touching anything.</p></div>',
      try: [
        ['📖 AWS — VPC flow logs (the evidence in this walkthrough)', 'https://docs.aws.amazon.com/vpc/latest/userguide/flow-logs.html', 'o'],
        ['🔗 Ch 1 — VPC route tables referenced throughout this triage', '#ch1', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code>THE TRIAGE, STEP BY STEP\n' +
      '09:16  change log shows: a "routine" security group cleanup ran at 09:10 — 4 minutes before the spike\n' +
      '09:18  diff the security group: the cleanup removed a rule allowing port 5432 from the app tier\'s\n' +
      '       security group to the database tier\'s security group, thinking it was an unused legacy rule\n' +
      '09:20  confirm via VPC Flow Logs: connections from app instances to the DB on port 5432 show REJECT,\n' +
      '       not just timeout — this is a security group denial, not a DNS or routing problem, not a DB crash\n' +
      '09:22  fix: re-add the exact rule that was removed (app-tier SG -> db-tier SG, port 5432)\n' +
      '09:24  error rate drops to baseline within one health-check interval; incident declared resolved\n\n' +
      '  aws ec2 describe-flow-logs --filter "Name=resource-id,Values=vpc-0abc123"\n' +
      '  # REJECT records at the exact timestamp are the smoking gun that ends the guessing</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>' +
      '<a href="https://docs.aws.amazon.com/vpc/latest/userguide/flow-logs.html" target="_blank" rel="noopener">VPC Flow Logs</a> are the standard ' +
      'evidence source for exactly this class of "which layer rejected the connection" question — REJECT vs. no record at all vs. ACCEPT-then-timeout ' +
      'each point to a completely different layer being at fault.</p></div>',
      try: [
        ['📖 AWS — VPC flow log records reference', 'https://docs.aws.amazon.com/vpc/latest/userguide/flow-logs-records.html', 'o'],
        ['🔗 Ch 9 — the security groups whose diff caused this incident', '#ch9', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The change log that made this a 10-minute incident instead of a 2-hour one.</b> ' +
      'The single fastest step in this walkthrough was step one: checking what changed right before the spike. Without a change log correlating the ' +
      '09:10 security group edit to the 09:14 alert, the team would have had to independently rule out DNS, routing, the database itself, and ' +
      'application code before ever reaching the security group — each a plausible suspect for "can\'t reach the database." A searchable, timestamped ' +
      'change log across every layer (IaC applies, manual console edits, deploys) is what turns "everything is broken, why" into "what changed 4 ' +
      'minutes ago."</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The "unused legacy rule" that wasn\'t.</b> ' +
      'The security group cleanup that caused the incident was well-intentioned — removing rules that looked unused. The rule LOOKED unused because ' +
      'nobody had annotated WHY it existed; a rule with no owner, no linked ticket, and no comment is indistinguishable from genuine cruft during a ' +
      'cleanup. The longer-term fix, beyond re-adding the rule: tag every security group rule with a reason/owner, and treat rule removal as a change ' +
      'that requires the same review as any other production change, not a background cleanup task.</p></div>' +
      '<p><b>Rule of thumb:</b> "what changed right before it broke" answers the majority of real incidents faster than any deep technical ' +
      'investigation — always check it first.</p>',
      try: [
        ['📖 Google SRE — effective troubleshooting', 'https://sre.google/sre-book/effective-troubleshooting/', 'o'],
        ['🔗 Ch 14 — the same triage discipline applied to a security breach', '#ch14', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                               FIX\n' +
      'Restarting/rebooting things before             Check the change log and recent deploys FIRST — most\n' +
      '  checking what changed                          production incidents trace to a recent, identifiable change.\n' +
      'Security group/network cleanup without           Require review for rule removal like any other prod\n' +
      '  ownership annotations on rules                  change, and tag every rule with its reason/owner.\n' +
      'Guessing which layer is at fault                Use flow logs / packet-level evidence to know FOR SURE\n' +
      '                                                whether it\'s a security group reject, a routing issue, or\n' +
      '                                                something else — REJECT vs. timeout are different bugs.\n' +
      'Declaring an incident resolved right after       Watch metrics through at least one full health-check/\n' +
      '  applying the fix                                 deploy cycle before declaring done — a partial fix can\n' +
      '                                                look resolved briefly and then relapse.\n' +
      'No blameless writeup after a fast recovery       Even a 10-minute incident deserves a short writeup — this\n' +
      '                                                one revealed a process gap (unannotated SG rules) worth\n' +
      '                                                fixing regardless of how quickly it was resolved.</code></pre>' +
      '<p><b>The real test:</b> could a different on-call engineer, using only the change log and flow logs, reach the same root cause in the same ' +
      'time — or did this resolution depend on one person\'s memory of "I think I saw something about security groups earlier"?</p>',
      try: [
        ['📖 Google SRE book — the incident management chapter', 'https://sre.google/sre-book/managing-incidents/', 'o'],
        ['🔗 Ch 2 — how the load balancer health check reacted during this incident', '#ch2', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, this walkthrough is less about the specific bug (a removed security group rule) and more about the <b>triage discipline</b> ' +
      'that got to it in 10 minutes: correlate against recent changes first, use hard evidence (flow logs) over guessing, and fix the process gap ' +
      '(unannotated rules) that let it happen, not just the immediate symptom. Every part of this book\'s security layer — VPCs, security groups, IAM, ' +
      'DNS — becomes the vocabulary this kind of investigation is conducted in.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Walk me through how you\'d triage "the app suddenly can\'t reach the database" from scratch.\n' +
      'A: First, correlate the alert time against the recent change log / deploy history — most such incidents\n' +
      '   trace to something that changed minutes before. In parallel, check whether it\'s DNS (can the name\n' +
      '   resolve?), routing/security groups (VPC Flow Logs — REJECT vs. no record vs. timeout tell different\n' +
      '   stories), or the database itself (is it actually up and accepting connections from ANY source?).\n\n' +
      'Q: A connection attempt shows as a timeout, not an explicit reject. What does that tell you versus a\n' +
      '   REJECT record?\n' +
      'A: A REJECT means something actively denied the connection (security group, NACL) — fast, deterministic.\n' +
      '   A timeout with no REJECT suggests the packet never got a response at all — could be a routing issue\n' +
      '   (no route to the destination), an overloaded/unresponsive target, or a security group silently\n' +
      '   dropping with no log, which points the investigation in a different direction entirely.\n\n' +
      'Q: Why did a "routine security group cleanup" cause a production incident, and what process change\n' +
      '   prevents recurrence?\n' +
      'A: The removed rule had no ownership annotation, making it indistinguishable from genuine unused cruft.\n' +
      '   Fix: tag every rule with an owner/reason at creation, and treat rule REMOVAL with the same change-\n' +
      '   review rigor as any other production change, not as a background/automatic cleanup task.\n\n' +
      'Q: Why check "what changed recently" before diving into deep technical investigation?\n' +
      'A: The overwhelming majority of production incidents correlate with a recent, identifiable change (a\n' +
      '   deploy, a config edit, an infra change) — checking this first is the highest-value, lowest-cost step\n' +
      '   and often resolves the investigation before a deep technical dive is even needed.\n\n' +
      'Q: The fix restored service within one health-check interval. Why not declare the incident resolved\n' +
      '   immediately at that point?\n' +
      'A: A partial or superficially-correct fix can look resolved briefly before relapsing — watching metrics\n' +
      '   through at least one full cycle (deploy, health check, or relevant time window) confirms the fix is\n' +
      '   durable, not just momentarily masking the symptom.</code></pre>',
      try: [
        ['📖 Google SRE workbook — troubleshooting case studies', 'https://sre.google/workbook/table-of-contents/', 'o'],
        ['🔗 Ch 16 — the reference architecture this incident happened inside', '#ch16', 'o']
      ] }
  ],

  quiz: [
    { q: 'In this walkthrough, what is the single highest-value first step when triaging "everything can\'t reach the database"?',
      opts: [
        'Immediately restart every affected service',
        'Check the recent change log / deploy history first — the overwhelming majority of such incidents correlate with something that changed minutes before',
        'Reboot the database server',
        'Escalate directly to the database vendor\'s support line'],
      ok: 1,
      why: 'Correlating against recent changes is the fastest, highest-value diagnostic step and is what turned this into a 10-minute incident rather than a long investigation.' },
    { q: 'What does a VPC Flow Log REJECT record tell you that a plain connection timeout does not?',
      opts: [
        'Nothing — they mean exactly the same thing',
        'REJECT means something actively and deterministically denied the connection (e.g. a security group rule), pointing straight at a network ACL/security group cause rather than routing, an overloaded target, or a silent drop',
        'REJECT only appears for DNS failures',
        'REJECT means the database itself crashed'],
      ok: 1,
      why: 'An explicit REJECT record narrows the search directly to a security group or NACL denial, versus a bare timeout which could stem from several different causes.' },
    { q: 'Why did an "unused legacy" security group rule turn out to be load-bearing, and what prevents this recurring?',
      opts: [
        'It was actually not related to the incident at all',
        'The rule had no ownership annotation or documented reason, making it indistinguishable from genuine cruft during cleanup; tagging rules with an owner/reason and reviewing removals like any other prod change prevents recurrence',
        'Security group rules cannot be removed once created',
        'The cleanup tool had a software bug'],
      ok: 1,
      why: 'Without documented ownership, a load-bearing rule looks identical to genuine dead configuration — annotation and change review close that gap.' }
  ]
};
