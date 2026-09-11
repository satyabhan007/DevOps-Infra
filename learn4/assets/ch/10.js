/* DevOps-Infra Learn — Part 4 · Chapter 10: Compliance Basics — CIS Benchmarks &amp; Audit */
window.CH[10] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p><b>Compliance</b> is proving, with evidence, that the controls from every earlier chapter (IAM, encryption, network security) are actually ' +
      'in place — not just believed to be. A <b>CIS Benchmark</b> is a specific, checkable list ("root account MFA enabled: yes/no") published by the ' +
      'Center for Internet Security; an <b>audit</b> (SOC2, ISO 27001) is a third party independently checking your evidence against a standard.</p>' +
      '<pre><code>Control: "root/admin account has MFA enabled"\n' +
      '  Automated check: query IAM, confirm MFA device attached to the root account -> PASS/FAIL, timestamped</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A building fire-safety inspection, not a New Year\'s resolution.</b> Saying ' +
      '"we care about security" is a resolution; a CIS benchmark scan is the fire marshal actually checking that the extinguishers are charged, the ' +
      'exits are unblocked, and the alarm was tested this month — with a signed checklist, not a promise. An audit is that inspection performed by ' +
      'someone with no stake in the answer.</p></div>',
      try: [
        ['📖 CIS Benchmarks — overview', 'https://www.cisecurity.org/cis-benchmarks', 'o'],
        ['🔗 Ch 5 — IAM controls a benchmark checks first', '#ch5', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code>RUNNING A CIS BENCHMARK SCAN (AWS example, via an open-source tool)\n' +
      '  prowler aws --compliance cis_2.0_aws\n' +
      '  # checks things like: is CloudTrail enabled in all regions? is the root account\'s access key\n' +
      '  # deleted? are S3 buckets with public access blocked by default? each check -> PASS/FAIL + evidence\n\n' +
      'CONTINUOUS COMPLIANCE (the standard approach — not a scan once a year)\n' +
      '  AWS Config rule: s3-bucket-public-read-prohibited\n' +
      '    -> evaluates EVERY S3 bucket continuously, flags/auto-remediates a bucket that drifts into\n' +
      '       public-read, and keeps a timestamped compliance history an auditor can pull directly\n\n' +
      'SOC2 EVIDENCE TYPES an auditor actually asks for\n' +
      '  - access review records (who had access to prod, reviewed quarterly)\n' +
      '  - change management records (every prod change went through review/approval)\n' +
      '  - incident response records (an incident happened, here is the runbook that was followed)</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p><a href="https://www.cisecurity.org/cis-benchmarks" target="_blank" rel="noopener">' +
      'CIS Benchmarks</a> are the industry-standard baseline checks across every major cloud; ' +
      '<a href="https://docs.aws.amazon.com/config/latest/developerguide/WhatIsConfig.html" target="_blank" rel="noopener">AWS Config</a> ' +
      '(or the cloud-native equivalent) running rules continuously is the standard mechanism for generating audit evidence automatically instead of ' +
      'scrambling before an audit.</p></div>',
      try: [
        ['📖 AWS Config — developer guide', 'https://docs.aws.amazon.com/config/latest/developerguide/WhatIsConfig.html', 'o'],
        ['📖 AICPA — SOC 2 overview', 'https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The pre-audit scramble.</b> ' +
      'A company\'s first SOC2 audit is scheduled, and the team discovers they have no systematic record of who reviewed production access over the ' +
      'past year — access reviews happened informally in Slack threads that weren\'t archived. Two weeks are spent manually reconstructing evidence ' +
      'from partial logs and people\'s memories, and one gap (a departed contractor\'s access that was never formally reviewed) becomes an audit ' +
      'finding. The fix: treat evidence generation as a continuous, automated byproduct of doing the work (Ch 5\'s access reviews, logged) rather ' +
      'than something reconstructed under deadline pressure.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The compliant-on-paper S3 bucket.</b> ' +
      'A CIS benchmark scan passes "S3 buckets block public access" as compliant because a bucket policy technically blocks anonymous reads — but a ' +
      'separate, overly broad IAM policy grants an entire department read access to a bucket that should be restricted to two services. The scan ' +
      'checked a specific known misconfiguration pattern, not the actual intent of least privilege. Lesson: automated benchmark checks are a floor, ' +
      'not a ceiling — passing every CIS check does not mean the deeper IAM design (Ch 5) is actually least-privilege.</p></div>' +
      '<p><b>Rule of thumb:</b> compliance evidence that has to be assembled by hand right before an audit is evidence that the underlying control ' +
      'wasn\'t really continuous.</p>',
      try: [
        ['📖 CIS — AWS Foundations Benchmark', 'https://www.cisecurity.org/benchmark/amazon_web_services', 'o'],
        ['🔗 Ch 5 — access reviews that generate this evidence automatically', '#ch5', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                               FIX\n' +
      'Compliance evidence assembled manually        Automate evidence generation as a byproduct of normal\n' +
      '  right before an audit                        operations (Config rules, logged access reviews, CI gates).\n' +
      'Treating a passed CIS scan as "we are           Treat it as a floor — review the intent behind checks\n' +
      '  secure"                                        (e.g. least privilege) that a pattern-matching scan can miss.\n' +
      'One annual point-in-time compliance check       Run checks continuously (e.g. AWS Config rules) so drift\n' +
      '                                                is caught within hours/days, not once a year.\n' +
      'No auto-remediation for common drift             Auto-remediate well-understood violations (e.g. a bucket\n' +
      '  (e.g. a bucket going public)                    that drifted public) rather than only alerting on them.\n' +
      'Compliance owned entirely by one team,           Make evidence generation part of every team\'s normal\n' +
      '  disconnected from engineering                   workflow (PR review, IaC scanning) not a separate chore.</code></pre>' +
      '<p><b>The real test:</b> ask for evidence of a specific control from six months ago with no advance notice. If producing it takes days of ' +
      'digging instead of a query, the control wasn\'t continuously enforced/logged in the first place.</p>',
      try: [
        ['📖 AWS — Security Hub (aggregated compliance findings)', 'https://docs.aws.amazon.com/securityhub/latest/userguide/what-is-securityhub.html', 'o'],
        ['🔗 Ch 9 — the network controls CIS benchmarks check', '#ch9', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, compliance is <b>engineering, not paperwork</b> — the goal is a system where every control from prior chapters emits its ' +
      'own evidence continuously (a Config rule result, an access-review log entry, a cert-manager renewal record), so an audit becomes "here is the ' +
      'query" instead of a multi-week evidence-collection project. Passing a checklist and being genuinely secure are related but distinct goals, ' +
      'and expert practitioners optimize for the latter while the former falls out as a side effect.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: What is the difference between a CIS Benchmark and a SOC2 audit?\n' +
      'A: A CIS Benchmark is a specific, technical, checkable list of configuration controls (e.g. "is MFA\n' +
      '   enabled on the root account") you can self-scan against continuously. SOC2 is a broader, formal\n' +
      '   third-party audit of your ENTIRE control environment (technical AND process — change management,\n' +
      '   incident response, access reviews) over a period of time, producing an attestation report.\n\n' +
      'Q: Why is "we passed every CIS check" not the same as "we are secure"?\n' +
      'A: CIS checks are pattern-matched against known misconfigurations; they can\'t evaluate whether an IAM\n' +
      '   policy that technically passes every check is still overly broad in intent, or catch a novel\n' +
      '   misconfiguration the benchmark doesn\'t yet cover. It\'s a floor, not a ceiling.\n\n' +
      'Q: How do you design compliance evidence collection so it doesn\'t become a pre-audit scramble?\n' +
      'A: Make evidence a byproduct of normal operations — Config rules continuously evaluating resources,\n' +
      '   access reviews logged in a system of record (not Slack threads), IaC scans gating every PR — so an\n' +
      '   auditor\'s question is answered by a query against existing records, not reconstruction from memory.\n\n' +
      'Q: What is the value of auto-remediation over alert-only compliance checks?\n' +
      'A: For well-understood, low-risk-of-false-positive violations (e.g. a bucket drifting to public-read),\n' +
      '   auto-remediation closes the gap before it can be exploited; alert-only checks depend on a human\n' +
      '   noticing and acting in time, adding a window of exposure that scales with team load and time of day.\n\n' +
      'Q: A CIS scan passes an S3 bucket as compliant, but an IAM policy elsewhere grants an entire department\n' +
      '   broad read access to it. What does this reveal about the limits of benchmark scanning?\n' +
      'A: Benchmark checks typically evaluate one resource\'s configuration in isolation against known bad\n' +
      '   patterns; they don\'t reason about the full effective-permissions graph across IAM policies, resource\n' +
      '   policies, and group memberships — that requires a broader least-privilege review (Ch 5), not just a\n' +
      '   passing scan.</code></pre>',
      try: [
        ['📖 CIS — Controls (broader than cloud benchmarks)', 'https://www.cisecurity.org/controls', 'o'],
        ['🔗 Ch 14 — incident response evidence an auditor will also ask for', '#ch14', 'o']
      ] }
  ],

  quiz: [
    { q: 'Why is "we passed every CIS benchmark check" not equivalent to "we are secure"?',
      opts: [
        'CIS benchmarks are only advisory suggestions with no real checks',
        'Benchmark checks pattern-match known misconfigurations on individual resources; they cannot fully evaluate broader intent like whether an IAM policy is truly least-privilege across the whole permissions graph',
        'CIS benchmarks only apply to on-premise infrastructure',
        'Passing a CIS scan means an audit is unnecessary'],
      ok: 1,
      why: 'A CIS benchmark is a checkable floor of known-pattern misconfigurations, not a full security assessment of intent and effective permissions.' },
    { q: 'What is the main problem with assembling compliance evidence manually right before an audit?',
      opts: [
        'It is against SOC2 rules to prepare evidence in advance',
        'It signals the underlying control was not continuously enforced/logged in the first place, and gaps (like an unreviewed departed contractor\'s access) surface as findings during reconstruction',
        'Manual evidence is always rejected by auditors',
        'It takes less time than automated evidence collection'],
      ok: 1,
      why: 'Evidence that must be reconstructed under deadline pressure usually means the control itself was not continuously operating and logging as intended.' },
    { q: 'What is the advantage of auto-remediation over alert-only compliance checks for well-understood violations?',
      opts: [
        'Auto-remediation eliminates the need for any monitoring',
        'It closes a known, low-false-positive-risk gap (e.g. a bucket drifting to public) immediately, rather than depending on a human noticing and acting within an exposure window',
        'It is required by every compliance framework',
        'It removes the need for CIS benchmarks entirely'],
      ok: 1,
      why: 'Auto-remediation shrinks the exposure window for well-understood drift compared to relying on a human to see and act on an alert.' }
  ]
};
