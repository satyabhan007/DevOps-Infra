/* DevOps-Infra Learn — Part 4 · Chapter 9: Network Security */
window.CH[9] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>Beyond IAM (who can call an API) there\'s a separate layer of control over <b>what can talk to what over the network at all</b> — ' +
      'security groups, network ACLs, Kubernetes NetworkPolicies, and a WAF (Web Application Firewall) sitting in front of anything public. Think of ' +
      'it as defense in depth: even a perfectly-scoped IAM identity shouldn\'t be reachable from everywhere on the network.</p>' +
      '<pre><code>Internet --> [WAF: blocks known attack patterns] --> [LB] --> [Security Group: only port 443 from LB] --> app</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>Concentric fences, not one big wall.</b> A WAF is a guard checking IDs and bags ' +
      'at the outer gate for obviously bad actors. A security group is a locked door on each building that only opens for specific visitors from a ' +
      'specific other building. Even if someone gets past the outer gate, the locked doors mean they still can\'t wander into a building they have ' +
      'no reason to be in.</p></div>',
      try: [
        ['📖 AWS — security groups for your VPC', 'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html', 'o'],
        ['🔗 Ch 1 — the VPC these controls sit inside', '#ch1', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code>SECURITY GROUP — stateful, allow-list only (AWS)\n' +
      '  Inbound:  port 443  from sg-loadbalancer-only     (NOT 0.0.0.0/0 — only the LB\'s security group)\n' +
      '  Outbound: port 5432 to   sg-database-only\n' +
      '  # "stateful" = the return traffic of an allowed connection is automatically allowed back\n\n' +
      'KUBERNETES NETWORKPOLICY — deny-by-default, then explicit allows\n' +
      '  apiVersion: networking.k8s.io/v1\n' +
      '  kind: NetworkPolicy\n' +
      '  metadata: { name: allow-api-from-gateway, namespace: payments }\n' +
      '  spec:\n' +
      '    podSelector: { matchLabels: { app: payments-api } }\n' +
      '    policyTypes: [Ingress]\n' +
      '    ingress:\n' +
      '    - from: [{ podSelector: { matchLabels: { app: api-gateway } } }]\n' +
      '      ports: [{ port: 8080 }]\n' +
      '  # WITHOUT any NetworkPolicy, Kubernetes pods can reach each other by default — deny-by-default\n' +
      '  # only kicks in once at least one policy selects a pod.</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p><b>Kubernetes NetworkPolicies</b> (enforced by a CNI like Calico or Cilium) are the ' +
      'standard for pod-to-pod segmentation; <a href="https://docs.aws.amazon.com/waf/latest/developerguide/waf-chapter.html" target="_blank" rel="noopener">' +
      'AWS WAF</a> (or Cloudflare/Azure equivalents) using the ' +
      '<a href="https://owasp.org/www-project-top-ten/" target="_blank" rel="noopener">OWASP Top 10</a> as its baseline rule set is the standard ' +
      'for public-facing application-layer protection.</p></div>',
      try: [
        ['📖 Kubernetes — network policies', 'https://kubernetes.io/docs/concepts/services-networking/network-policies/', 'o'],
        ['📖 AWS WAF — developer guide', 'https://docs.aws.amazon.com/waf/latest/developerguide/waf-chapter.html', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The security group that allowed "just for now."</b> ' +
      'During debugging, an engineer opens a database\'s security group to <code>0.0.0.0/0</code> on port 5432 to test a connection from home, ' +
      'intending to revert it after. A different, unrelated incident three months later turns out to be a credential-stuffing bot that found the ' +
      'now-forgotten open port and had been probing it for weeks. The fix isn\'t just reverting the rule — it\'s a policy that any <code>0.0.0.0/0</code> ' +
      'rule on a non-load-balancer resource triggers an automated alert and a mandatory expiry, so "just for now" can\'t silently become permanent.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The flat Kubernetes namespace.</b> ' +
      'A cluster runs dozens of services in one namespace with no NetworkPolicies at all — Kubernetes\' default-allow means every pod can reach every ' +
      'other pod. When one internet-facing service is compromised via a dependency vulnerability, the attacker can reach the internal admin service ' +
      'and the database directly, because nothing on the network layer said otherwise. Retrofitting deny-by-default NetworkPolicies after the fact ' +
      'is painful (mapping every legitimate call path first) — the lesson is to start with default-deny from day one, adding explicit allows as ' +
      'services are built.</p></div>' +
      '<p><b>Rule of thumb:</b> a security rule opened "temporarily" needs an expiry and an owner, or it becomes permanent by default — nobody\'s ' +
      'job is to remember to close it.</p>',
      try: [
        ['📖 OWASP — Top 10 web application risks', 'https://owasp.org/www-project-top-ten/', 'o'],
        ['🔗 Ch 6 — zero trust: don\'t rely on network position alone', '#ch6', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                               FIX\n' +
      '0.0.0.0/0 inbound rules on internal          Scope security group rules to specific source security\n' +
      '  resources "for debugging"                    groups/CIDRs; alert on any broad rule automatically.\n' +
      'No NetworkPolicies (default-allow) in         Start every namespace with a default-deny NetworkPolicy,\n' +
      '  Kubernetes                                    adding explicit allow rules per real call path.\n' +
      'WAF in "count" mode indefinitely, never        Move to "block" mode for well-understood rule groups once\n' +
      '  actually blocking                             false-positive rate is verified low — count mode alone\n' +
      '                                                blocks nothing.\n' +
      'Security rules with no owner/expiry            Track WHO opened a rule and WHY, with automated expiry\n' +
      '                                              review for anything broader than the norm.\n' +
      'One security group shared by unrelated tiers   Separate security groups per tier (web/app/data) so a\n' +
      '                                              rule change for one tier can\'t accidentally loosen another.</code></pre>' +
      '<p><b>The real test:</b> from a compromised pod/instance in the least-trusted tier, try to reach the data tier directly. If it succeeds, your ' +
      'network security is a compliance checkbox, not a working control.</p>',
      try: [
        ['📖 AWS — WAF rule groups &amp; managed rules', 'https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups-list.html', 'o'],
        ['🔗 Ch 10 — CIS benchmarks that audit exactly these misconfigurations', '#ch10', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, network security is a <b>layered, redundant control</b> — you assume any single layer (IAM, security group, WAF rule) will ' +
      'eventually be misconfigured or bypassed, so the layers together are what actually stop lateral movement. Auditing "what can reach what" should ' +
      'be answerable from configuration alone, without needing to trace live traffic.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: What is the difference between a security group and a network ACL in AWS, and when do you need both?\n' +
      'A: Security groups are stateful (return traffic auto-allowed) and attach to instances/ENIs; NACLs are\n' +
      '   stateless (you must explicitly allow both directions) and apply at the subnet level as a coarser,\n' +
      '   secondary layer — most designs rely primarily on security groups and use NACLs sparingly for\n' +
      '   subnet-wide deny rules (e.g. explicitly blocking a known-bad CIDR range).\n\n' +
      'Q: Why is Kubernetes\' default pod-to-pod connectivity dangerous, and how do you fix it without breaking\n' +
      '   everything at once?\n' +
      'A: Without any NetworkPolicy, all pods can reach all other pods by default, so one compromised service\n' +
      '   can reach anything. Fix by mapping real call paths, then rolling out default-deny NetworkPolicies\n' +
      '   namespace by namespace with explicit allows, testing in a non-prod cluster first to catch missed paths.\n\n' +
      'Q: What does a WAF protect against that a security group cannot?\n' +
      'A: A security group only sees IP/port — it can\'t tell a legitimate HTTP request from a SQL injection\n' +
      '   payload both arriving on port 443. A WAF inspects the actual HTTP request content against rules (e.g.\n' +
      '   OWASP Top 10 patterns) to block application-layer attacks that a network-layer control is blind to.\n\n' +
      'Q: A 0.0.0.0/0 rule was opened "temporarily" for debugging and forgotten for months. What systemic\n' +
      '   control (not just a one-time fix) prevents recurrence?\n' +
      'A: Automated detection/alerting on any newly-created broad ingress rule, tied to a required owner and\n' +
      '   expiry at creation time — making the unsafe state visible and time-boxed instead of relying on\n' +
      '   someone remembering to revert it.\n\n' +
      'Q: How do you audit "what can reach the production database" across security groups, NACLs, and\n' +
      '   NetworkPolicies without manually tracing every rule?\n' +
      'A: Use a policy-as-code / graph analysis tool (e.g. AWS VPC Reachability Analyzer, or Cloud custodian-\n' +
      '   style policy checks) that computes actual reachability from configuration, and treat any unexpected\n' +
      '   reachable path as a finding — the same principle as Ch 4\'s transit gateway route-table auditability.</code></pre>',
      try: [
        ['📖 AWS — VPC Reachability Analyzer', 'https://docs.aws.amazon.com/vpc/latest/reachability/what-is-reachability-analyzer.html', 'o'],
        ['🔗 Ch 4 — the same auditability principle for cross-VPC routing', '#ch4', 'o']
      ] }
  ],

  quiz: [
    { q: 'Why is Kubernetes\' default pod-to-pod connectivity a security risk?',
      opts: [
        'Pods cannot communicate by default, breaking most apps',
        'Without any NetworkPolicy, all pods can reach all other pods by default, so a single compromised service can reach anything else in the cluster',
        'It only affects traffic leaving the cluster',
        'NetworkPolicies are enabled by default and must be manually disabled'],
      ok: 1,
      why: 'Kubernetes is default-allow at the network layer until at least one NetworkPolicy selects a pod — deny-by-default must be deliberately configured.' },
    { q: 'What can a WAF catch that a security group cannot?',
      opts: [
        'A WAF blocks all traffic on a given port',
        'A security group only inspects IP/port; a WAF inspects actual HTTP request content, catching application-layer attacks like SQL injection that arrive on an otherwise-allowed port',
        'Security groups cannot be used with load balancers',
        'A WAF replaces the need for TLS'],
      ok: 1,
      why: 'Security groups operate at IP/port granularity and are blind to malicious payloads within an otherwise-permitted connection; a WAF inspects that content.' },
    { q: 'A security group rule opening 0.0.0.0/0 "temporarily for debugging" stayed open for months undetected. What systemic control prevents this?',
      opts: [
        'Manually reviewing all security groups once a year',
        'Automated detection/alerting on any newly created broad ingress rule, tied to a required owner and expiry at creation time',
        'Disabling security groups entirely in favor of a WAF',
        'Using a longer, harder-to-guess port number'],
      ok: 1,
      why: 'Relying on a human to remember to revert a rule reliably fails at scale; automated detection and mandatory expiry make the unsafe window bounded and visible.' }
  ]
};
