/* DevOps-Infra Learn — Part 4 · Chapter 12: Bastion, VPN &amp; Secure Remote Access */
window.CH[12] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>A database in a private subnet (Ch 1) has no internet route — on purpose. So how does an engineer actually connect to it to run a query? ' +
      'You need a controlled, audited doorway: a <b>bastion host</b> (a hardened jump box you connect through), a <b>VPN</b>, or a modern ' +
      '<b>session-manager</b> tool — never "just open port 22 to the internet," which is one of the most attacked configurations that exists.</p>' +
      '<pre><code>Engineer --SSH--> Bastion host (small, hardened, logged) --SSH--> private database server\n' +
      '            (bastion is the ONLY thing in the private subnet\'s security group allowed to connect)</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A single, monitored side entrance instead of every window left unlocked.</b> ' +
      'Opening port 22 on every private server to the internet is like leaving every window in a building unlocked because it\'s convenient. A ' +
      'bastion is one specific side door, watched by a guard who logs everyone who walks through, while every window stays locked. A modern ' +
      'session-manager tool goes further: no door at all — you\'re teleported in after proving your identity, with zero exposed entry point to attack.</p></div>',
      try: [
        ['📖 AWS — Systems Manager Session Manager', 'https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html', 'o'],
        ['🔗 Ch 1 — the private subnets this access reaches into', '#ch1', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code>SESSION MANAGER (no open inbound port, no bastion to patch, full audit log) — the modern default\n' +
      '  aws ssm start-session --target i-0123456789abcdef0\n' +
      '  # the SSM agent on the instance opens an OUTBOUND connection to AWS; nothing listens for inbound\n' +
      '  # SSH at all. Every session is logged to CloudTrail/CloudWatch: who connected, when, for how long.\n\n' +
      'BASTION HOST (when you need a traditional SSH jump box)\n' +
      '  security group on the bastion: inbound 22 ONLY from a specific corporate IP range / VPN CIDR\n' +
      '  security group on the target:  inbound 22 ONLY from the bastion\'s security group, nothing else\n' +
      '  # the bastion itself is small, patched aggressively, and logs every session — it is the ONE thing\n' +
      '  # exposed, so it gets the most scrutiny of anything in the account.\n\n' +
      'CLIENT VPN — an encrypted tunnel that puts your laptop virtually "inside" the VPC for the session.</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>AWS Systems Manager ' +
      '<a href="https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html" target="_blank" rel="noopener">Session Manager</a> ' +
      '(no open inbound ports, full audit trail, IAM-controlled) is the modern standard over a traditional bastion; ' +
      '<a href="https://goteleport.com/docs/" target="_blank" rel="noopener">Teleport</a> is a popular cross-cloud, cross-protocol equivalent for ' +
      'SSH/Kubernetes/database access with the same zero-open-port philosophy.</p></div>',
      try: [
        ['📖 AWS — SSM Session Manager audit logging', 'https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-logging.html', 'o'],
        ['📖 Teleport — access platform docs', 'https://goteleport.com/docs/', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The bastion that was the whole breach.</b> ' +
      'A bastion host is provisioned once and then forgotten — never patched again, running an SSH version with a known vulnerability two years later. ' +
      'It\'s the one instance in the account with a public IP and an open port, making it the single most attacked target, and it\'s eventually ' +
      'compromised via an unpatched CVE, handing the attacker a foothold with network access to every private subnet it could reach. Fix: migrate to ' +
      'Session Manager (no open port to attack in the first place) or, if a bastion is kept, put it in an auto-scaling group with an AMI rebuilt and ' +
      'patched on a schedule — never a hand-maintained pet server.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The shared bastion credential.</b> ' +
      'A team shares one SSH key for bastion access "to keep it simple." When an engineer leaves, rotating them out means regenerating and ' +
      're-distributing the key to everyone else — in practice this gets postponed, and the departed engineer\'s copy of the key remains valid for ' +
      'months. Individual, revocable access (per-user IAM-backed Session Manager access, or per-user SSH certificates with short TTLs) means removing ' +
      'one person is a one-line IAM change, not a fleet-wide credential rotation.</p></div>' +
      '<p><b>Rule of thumb:</b> if revoking one person\'s access requires touching a shared secret, the access model is already broken — access must ' +
      'be individually attributable and individually revocable.</p>',
      try: [
        ['📖 AWS — least privilege for SSM access via IAM', 'https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-getting-started-restrict-access-examples.html', 'o'],
        ['🔗 Ch 5 — IAM roles governing who can start a session', '#ch5', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                               FIX\n' +
      'Port 22 open to 0.0.0.0/0 on any instance     Never — restrict SSH to a bastion\'s security group or\n' +
      '                                              eliminate inbound SSH entirely via Session Manager.\n' +
      'A hand-maintained, rarely-patched bastion      Auto-scaling group with a scheduled, rebuilt/patched AMI —\n' +
      '  "pet" server                                  or eliminate it in favor of an agent-based tool with no\n' +
      '                                              open inbound port at all.\n' +
      'One shared SSH key/credential for a team       Individual, IAM-backed access (Session Manager) or short-\n' +
      '                                              lived per-user SSH certificates — one person = one revoke.\n' +
      'No session logging/audit trail                 Log every session (who, when, duration, commands where\n' +
      '                                              possible) — remote access is exactly what an incident\n' +
      '                                              review needs to reconstruct first.\n' +
      'VPN grants broad network-level access           Pair a VPN with per-app authorization (Ch 6 zero trust)\n' +
      '  once connected                                 rather than treating "on the VPN" as sufficient trust.</code></pre>' +
      '<p><b>The real test:</b> offboard a test user and time how long it takes until every remote-access path they had is provably closed — if the ' +
      'answer involves finding and rotating a shared secret, the design has already failed the test.</p>',
      try: [
        ['📖 AWS — SSM Session Manager: restricting access with IAM policies', 'https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-getting-started-restrict-access-examples.html', 'o'],
        ['🔗 Ch 6 — why "on the VPN" is not itself a security decision', '#ch6', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, secure remote access is judged by two properties: <b>zero standing open inbound ports</b> (nothing for an internet-wide ' +
      'scanner to even find) and <b>individually attributable, individually revocable</b> access (every session traces to exactly one identity, and ' +
      'removing that identity fully closes their access with no shared-secret cleanup). Everything else — bastion vs. VPN vs. agent-based tooling — ' +
      'is implementation detail in service of those two properties.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Why is an agent-based tool (Session Manager, Teleport) considered more secure than a traditional bastion\n' +
      '   host, even a well-maintained one?\n' +
      'A: The agent opens an OUTBOUND connection; there is no listening inbound port for an internet-wide\n' +
      '   scanner to find and attack in the first place. A bastion, however well-patched, is still an exposed\n' +
      '   inbound target and a single point of compromise if a zero-day or misconfiguration slips through.\n\n' +
      'Q: Why is a shared SSH key for bastion access a serious anti-pattern?\n' +
      'A: Revoking one person\'s access requires rotating and redistributing the key to everyone else, which in\n' +
      '   practice gets delayed — meaning a departed or compromised individual\'s access often outlives the\n' +
      '   decision to revoke it. Individual, IAM-backed credentials make revocation a single, immediate action.\n\n' +
      'Q: A bastion host was compromised via an unpatched SSH CVE two years after being provisioned. What two\n' +
      '   separate failures does this reveal?\n' +
      'A: (1) No patching/lifecycle process for a "pet" server that should have been rebuilt from an updated,\n' +
      '   patched AMI on a schedule; (2) the bastion had no time-boxed exposure reduction — e.g. it could have\n' +
      '   been replaced entirely by an agent-based tool with no inbound port to exploit.\n\n' +
      'Q: How does secure remote access design interact with the zero-trust model from Ch 6?\n' +
      'A: A VPN or bastion only gets you ONTO the network; zero trust means that alone should not grant broad\n' +
      '   reach — per-app/per-resource authorization is still checked independently, so being "on the VPN" is\n' +
      '   necessary but never sufficient for accessing anything specific.\n\n' +
      'Q: What should a remote-access audit log capture to be useful during an incident?\n' +
      'A: Who (individual identity, not a shared account), when, source, target resource, session duration, and\n' +
      '   where possible the commands/actions taken during the session — enough to reconstruct exactly what a\n' +
      '   given identity did without needing to correlate against a shared credential\'s ambiguous usage.</code></pre>',
      try: [
        ['📖 AWS — Session Manager best practices', 'https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-best-practices.html', 'o'],
        ['🔗 Ch 14 — revoking remote access fast during a breach', '#ch14', 'o']
      ] }
  ],

  quiz: [
    { q: 'Why is an agent-based access tool (e.g. AWS Session Manager) considered more secure than even a well-maintained bastion host?',
      opts: [
        'It is cheaper to run',
        'The agent opens an outbound connection, so there is no listening inbound port for an internet-wide scanner to find and attack in the first place',
        'It does not require any authentication',
        'It works without an internet connection'],
      ok: 1,
      why: 'Removing the inbound listening port entirely eliminates a whole class of exposure that even a hardened, patched bastion still carries.' },
    { q: 'Why is a single shared SSH key for a team\'s bastion access a serious problem?',
      opts: [
        'SSH keys expire automatically after 24 hours',
        'Revoking one person\'s access requires rotating and redistributing the key to everyone else, which in practice gets delayed, leaving a departed or compromised individual\'s access valid much longer than intended',
        'Shared keys cannot be used with bastion hosts',
        'It violates the SSH protocol specification'],
      ok: 1,
      why: 'Individual, attributable, independently revocable credentials avoid the operational drag (and resulting delay) of rotating a shared secret every time one person needs to be removed.' },
    { q: 'In a zero-trust model, why isn\'t being connected via VPN or through a bastion considered sufficient access on its own?',
      opts: [
        'VPNs and bastions are being deprecated entirely',
        'They only get a user onto the network; per-app/per-resource authorization is still independently checked, since network position alone should never imply trust',
        'They only work for read-only access',
        'They require a hardware token that most users don\'t have'],
      ok: 1,
      why: 'Consistent with zero trust (Ch 6), reaching the network via VPN/bastion is a necessary step but not itself an authorization decision for any specific resource.' }
  ]
};
