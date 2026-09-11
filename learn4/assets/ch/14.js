/* DevOps-Infra Learn — Part 4 · Chapter 14: Incident Response for a Security Breach */
window.CH[14] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>Every control in this part reduces the CHANCE of a breach; this chapter is about what happens the moment one occurs anyway. The classic ' +
      'incident response phases are <b>contain, eradicate, recover</b> — stop the bleeding first, then remove the attacker\'s access completely, then ' +
      'bring systems back cleanly. Skipping straight to "clean up and move on" without containing first is how attackers get back in.</p>' +
      '<pre><code>1. CONTAIN    isolate the affected system(s) — don\'t let it spread further, don\'t tip off the attacker\n' +
      '2. ERADICATE  remove the actual foothold — the malware, the stolen credential, the backdoor account\n' +
      '3. RECOVER    restore service from a known-good state, with monitoring watching for a repeat attempt</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A hospital handling an infection, not a fire drill.</b> You don\'t just ' +
      'evacuate (shut everything down) — you isolate the infected area (contain), treat the actual infection so it can\'t come back (eradicate), then ' +
      'carefully bring the patient back to full activity while watching vitals (recover). Rushing to "recover" before eradicating is like discharging ' +
      'a patient mid-infection because the fever briefly went down.</p></div>',
      try: [
        ['📖 NIST SP 800-61 — computer security incident handling guide', 'https://csrc.nist.gov/pubs/sp/800/61/r2/final', 'o'],
        ['🔗 Ch 7 — the secrets you\'ll need to rotate during eradication', '#ch7', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code>THE FIRST HOUR (a real runbook skeleton)\n' +
      '  00:00  detection: alert fires (Ch 10\'s Config drift, an IDS signature, an anomalous IAM action)\n' +
      '  00:05  declare an incident, page the on-call security responder, open a dedicated incident channel\n' +
      '  00:10  CONTAIN: isolate the affected resource — revoke its IAM credentials, quarantine the security\n' +
      '         group/instance, do NOT power it off yet (you may need forensic evidence from memory/disk)\n' +
      '  00:20  scope: what else did the compromised identity/resource touch? (check CloudTrail/audit logs)\n' +
      '  00:45  begin credential rotation for everything the compromised identity had access to\n' +
      '  ...    eradicate the actual entry point, then recover from known-good infrastructure (redeploy from\n' +
      '         IaC/known-good images, never "clean" a compromised host and trust it again)</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p><a href="https://csrc.nist.gov/pubs/sp/800/61/r2/final" target="_blank" rel="noopener">' +
      'NIST SP 800-61</a> is the reference incident-handling framework; the ' +
      '<a href="https://docs.aws.amazon.com/whitepapers/latest/aws-security-incident-response-guide/aws-security-incident-response-guide.html" target="_blank" rel="noopener">' +
      'AWS Security Incident Response Guide</a> gives cloud-specific playbooks (isolating an instance, rotating IAM credentials) built on the same ' +
      'contain/eradicate/recover model.</p></div>',
      try: [
        ['📖 AWS — security incident response guide', 'https://docs.aws.amazon.com/whitepapers/latest/aws-security-incident-response-guide/aws-security-incident-response-guide.html', 'o'],
        ['🔗 Ch 5 — IAM credential rotation mechanics', '#ch5', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The rebuild that reintroduced the attacker.</b> ' +
      'After detecting a compromised web server, a team "cleans" it in place — removes the malicious process they found, patches the CVE, and puts it ' +
      'back into service. Two weeks later the same server is compromised again: the initial cleanup missed a second backdoor (a cron job, a rogue SSH ' +
      'key) the attacker had also planted. The lesson, learned the expensive way: never trust a compromised host again — eradicate means replacing it ' +
      'entirely from known-good infrastructure (a fresh instance from IaC/a clean AMI), not surgically removing what you happened to find.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The incident with no runbook, discovered live.</b> ' +
      'A company\'s first real breach happens with no pre-written incident response plan — the team spends the first critical hour deciding WHO should ' +
      'be doing WHAT instead of executing, arguing in real time about whether to take the affected system offline (tipping off the attacker) or leave ' +
      'it running to gather more evidence. A pre-written runbook with clear roles (incident commander, comms, technical lead) and pre-agreed ' +
      'decision criteria turns that same hour into execution instead of debate.</p></div>' +
      '<p><b>Rule of thumb:</b> the middle of an active incident is the worst possible time to design your incident response process for the first ' +
      'time — the runbook has to already exist and have been practiced.</p>',
      try: [
        ['📖 SANS — incident handler\'s handbook', 'https://www.sans.org/white-papers/33901/', 'o'],
        ['🔗 Ch 12 — revoking remote access as part of containment', '#ch12', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                               FIX\n' +
      '"Cleaning" a compromised host in place       Never trust a compromised host again — replace it entirely\n' +
      '  and returning it to service                 from known-good IaC/images; treat it as forensic evidence.\n' +
      'No written incident response runbook           Write and PRACTICE (game days) a runbook with clear roles\n' +
      '  before the first real incident                (incident commander, comms, technical lead) beforehand.\n' +
      'Rotating only the ONE obviously-compromised    Rotate everything the compromised identity/resource had\n' +
      '  credential                                    access to — scope the blast radius from logs, not guesses.\n' +
      'Powering off a compromised system immediately   Isolate (network-level quarantine) before powering off —\n' +
      '                                                you may lose volatile forensic evidence (memory) otherwise.\n' +
      'Post-incident: no blameless writeup             Run a blameless post-mortem focused on which control gaps\n' +
      '                                                (from earlier chapters) let this happen, and close them.</code></pre>' +
      '<p><b>The real test:</b> run a tabletop exercise (a simulated breach, no real systems touched) and time how long it takes the team to reach a ' +
      '"contained" state using only the written runbook — if the runbook can\'t get you there, fix the runbook before the real thing happens.</p>',
      try: [
        ['📖 AWS — playbook examples in the incident response guide', 'https://docs.aws.amazon.com/whitepapers/latest/aws-security-incident-response-guide/appendix-a-managed-services-guides.html', 'o'],
        ['🔗 Ch 10 — the post-breach report as compliance evidence', '#ch10', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, incident response quality is set almost entirely BEFORE the incident: whether logs exist to scope the blast radius, ' +
      'whether infrastructure is defined as code so "replace, don\'t clean" is fast and routine, whether credentials are short-lived enough that ' +
      '"rotate everything" is cheap, and whether the team has actually practiced the runbook. The incident itself mostly executes decisions that were ' +
      'made calmly, in advance.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Walk through contain, eradicate, recover for a compromised production web server.\n' +
      'A: Contain: network-isolate it (quarantine security group) without powering off, preserving forensic\n' +
      '   state; revoke its IAM credentials immediately. Eradicate: determine the actual entry point from logs,\n' +
      '   then REPLACE the instance entirely from known-good IaC/AMI rather than cleaning in place — a partially\n' +
      '   cleaned host may retain a second backdoor. Recover: redeploy, verify against baseline, monitor closely\n' +
      '   for repeat compromise attempts before declaring the incident closed.\n\n' +
      'Q: Why is "clean the compromised host and put it back into service" considered a serious anti-pattern?\n' +
      'A: You can only be sure you removed what you found, not everything the attacker did — a second backdoor\n' +
      '   (cron job, SSH key, modified binary) can easily be missed. Infrastructure-as-code makes full\n' +
      '   replacement cheap enough that there\'s rarely a good reason to trust a "cleaned" host again.\n\n' +
      'Q: How do you scope the blast radius of a compromised credential — what do you actually check?\n' +
      'A: Audit/CloudTrail-style logs for everything that credential/identity touched during the suspected\n' +
      '   compromise window — API calls, resource access, other credentials it could have read (e.g. from a\n' +
      '   secrets manager) — and rotate/investigate everything in that scope, not just the one obviously\n' +
      '   affected resource.\n\n' +
      'Q: Why practice incident response with game days/tabletop exercises before a real incident happens?\n' +
      'A: The first real incident is the worst time to discover gaps in the runbook, unclear roles, or missing\n' +
      '   log coverage needed to scope the breach — practicing surfaces those gaps when the stakes are zero,\n' +
      '   and gives the team pre-built muscle memory for executing under real pressure.\n\n' +
      'Q: What makes a post-incident report actually useful, beyond documenting what happened?\n' +
      'A: A blameless root-cause analysis that identifies which SPECIFIC control gaps (missing MFA, an overly\n' +
      '   broad IAM policy, an un-rotated credential, a missing WAF rule) allowed the breach, tied to concrete\n' +
      '   remediation items with owners and deadlines — the report\'s value is in what changes afterward, not\n' +
      '   the narrative of what happened.</code></pre>',
      try: [
        ['📖 NIST SP 800-61 — full incident handling lifecycle', 'https://csrc.nist.gov/pubs/sp/800/61/r2/final', 'o'],
        ['🔗 Ch 15 — a live outage walkthrough using the same triage discipline', '#ch15', 'o']
      ] }
  ],

  quiz: [
    { q: 'Why is "clean a compromised host in place and return it to service" considered a serious anti-pattern?',
      opts: [
        'It takes longer than replacing the host',
        'You can only be certain you removed what you found; a second, undiscovered backdoor (e.g. a cron job or added SSH key) can remain, leading to re-compromise',
        'Cleaning in place is not technically possible',
        'It violates PCI-DSS by definition'],
      ok: 1,
      why: 'Full replacement from known-good infrastructure-as-code removes any uncertainty about what else the attacker may have planted, which surgical cleanup cannot guarantee.' },
    { q: 'During containment, why isolate a compromised system at the network level rather than immediately powering it off?',
      opts: [
        'Powering off is always faster and should be preferred',
        'Powering off can destroy volatile forensic evidence (e.g. memory contents) needed to understand the attack; network isolation stops further spread while preserving that evidence',
        'Network isolation is not possible on cloud instances',
        'Powering off automatically notifies the attacker'],
      ok: 1,
      why: 'Immediate power-off loses memory-resident forensic data; isolating the network path contains the threat while preserving evidence for the eradication/investigation phase.' },
    { q: 'Why is practicing incident response (tabletop exercises/game days) important before a real breach occurs?',
      opts: [
        'It is a regulatory requirement with no other value',
        'The first real incident is the worst time to discover gaps in the runbook, unclear team roles, or missing log coverage — practicing surfaces these when the stakes are zero',
        'It replaces the need for any written runbook',
        'It guarantees no breach will ever happen'],
      ok: 1,
      why: 'Practicing exposes gaps in tooling, logging, and process coordination in a low-stakes setting, so the real incident executes a proven plan instead of improvising one.' }
  ]
};
