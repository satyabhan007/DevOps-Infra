/* DevOps-Infra Learn — Part 4 · Chapter 4: VPC Peering, Transit Gateways &amp; Hybrid Connectivity */
window.CH[4] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>Chapter 1 built one VPC. Real organizations have dozens — one per team, environment, or acquired company — and those VPCs often need ' +
      'to talk to each other, and sometimes to an on-prem data center too. <b>Peering</b>, <b>transit gateways</b>, and <b>VPNs</b> are the three ' +
      'tools that connect networks without exposing everything to the public internet.</p>' +
      '<pre><code>VPC Peering        direct 1-to-1 link between two VPCs (no transitive routing through a third)\n' +
      'Transit Gateway    a hub every VPC connects to once — any-to-any routing through one place\n' +
      'Site-to-Site VPN   an encrypted tunnel between your VPC and an on-prem network over the internet\n' +
      'Direct Connect     a private physical/leased-line link to on-prem, bypassing the internet entirely</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>Peering is a private phone line between two offices;</b> a transit gateway is a ' +
      'company switchboard every office plugs into once, so any office can call any other without laying a new line each time. A site-to-site VPN ' +
      'is a locked, armored courier route between your building and a partner\'s over public roads; Direct Connect is your own private road that ' +
      'never touches the public street at all.</p></div>',
      try: [
        ['📖 AWS — What is VPC peering', 'https://docs.aws.amazon.com/vpc/latest/peering/what-is-vpc-peering.html', 'o'],
        ['🔗 Ch 1 — VPC CIDR planning (read this first)', '#ch1', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code>WHEN PEERING BREAKS DOWN: no transitive routing\n' +
      '  VPC-A peered with VPC-B, and VPC-B peered with VPC-C, does NOT let A reach C.\n' +
      '  At N VPCs, full mesh peering needs N*(N-1)/2 connections — unmanageable past a handful.\n\n' +
      'TRANSIT GATEWAY (the fix at scale)\n' +
      '  aws ec2 create-transit-gateway --description "org-hub"\n' +
      '  aws ec2 create-transit-gateway-vpc-attachment --transit-gateway-id tgw-123 --vpc-id vpc-abc \\\n' +
      '    --subnet-ids subnet-1 subnet-2\n' +
      '  # each VPC attaches ONCE; a route table on the TGW decides who can reach whom —\n' +
      '  # you can segment (e.g. prod TGW route table cannot reach dev\'s attachment) in one place.\n\n' +
      'SITE-TO-SITE VPN (hybrid connectivity)\n' +
      '  a customer gateway (your on-prem router\'s public IP) + a virtual private gateway (AWS side)\n' +
      '  negotiate an IPsec tunnel; BGP advertises routes dynamically so failover between two tunnels\n' +
      '  is automatic if one goes down.</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>The <b>hub-and-spoke transit gateway</b> pattern is the industry-standard topology ' +
      'once you exceed ~4-5 VPCs — see AWS\'s own ' +
      '<a href="https://docs.aws.amazon.com/vpc/latest/tgw/what-is-transit-gateway.html" target="_blank" rel="noopener">Transit Gateway</a> guidance ' +
      '(GCP\'s equivalent is Network Connectivity Center, Azure\'s is Virtual WAN) — full-mesh peering is treated as a startup-scale shortcut, not a ' +
      'target architecture.</p></div>',
      try: [
        ['📖 AWS — Transit Gateway user guide', 'https://docs.aws.amazon.com/vpc/latest/tgw/what-is-transit-gateway.html', 'o'],
        ['📖 AWS — Site-to-Site VPN', 'https://docs.aws.amazon.com/vpn/latest/s2svpn/VPC_VPN.html', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The peering mesh nobody could reason about.</b> ' +
      'A company grows to 12 VPCs, each peered directly to whichever others needed connectivity "at the time" — 30+ ad hoc peering connections with ' +
      'no central record. A security review asks a simple question — "can the contractor VPC reach production databases?" — and nobody can answer ' +
      'without manually tracing peering tables and route tables VPC by VPC. The fix is a migration to a transit gateway with an explicit, reviewable ' +
      'route-table policy: each VPC\'s reachability is one line in one place, not an emergent property of 30 pairwise connections.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The VPN that failed over into a black hole.</b> ' +
      'A site-to-site VPN is set up with two tunnels for redundancy, but only one is ever tested — the second tunnel\'s BGP session was misconfigured ' +
      'and never actually came up. When the primary tunnel\'s ISP link drops during a routine maintenance window, on-prem connectivity goes dark ' +
      'for two hours because the "redundant" path was never truly redundant. Lesson: redundant paths must be tested by actually failing the primary, ' +
      'not just provisioned and assumed to work.</p></div>' +
      '<p><b>Rule of thumb:</b> if you can\'t answer "what can reach what" from one route table view, your connectivity has grown past what peering ' +
      'alone can safely manage.</p>',
      try: [
        ['📖 AWS — Transit Gateway route tables (segmentation)', 'https://docs.aws.amazon.com/vpc/latest/tgw/tgw-route-tables.html', 'o'],
        ['🔗 Ch 1 — non-overlapping CIDR planning', '#ch1', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'Full-mesh VPC peering past ~5 VPCs         Migrate to a hub-and-spoke transit gateway — one\n' +
      '                                          attachment per VPC, reachability policy in one place.\n' +
      'Overlapping CIDRs discovered at peering     Reserve non-overlapping ranges org-wide BEFORE any VPC\n' +
      '  time                                      is created (see Ch 1) — peering cannot fix this after.\n' +
      'Redundant VPN tunnel provisioned but         Actually fail the primary tunnel in a game day; a\n' +
      '  never tested                               "redundant" path you haven\'t proven is not redundant.\n' +
      'No segmentation on the transit gateway       Use separate TGW route tables per trust zone (prod/dev/\n' +
      '  route table (everything reaches            shared-services) so an attachment only reaches what its\n' +
      '  everything)                                zone is meant to reach.\n' +
      'Hybrid connectivity over the public          Prefer Direct Connect / ExpressRoute for latency-sensitive\n' +
      '  internet for latency-critical traffic       or high-volume on-prem traffic; VPN over internet for\n' +
      '                                          everything else, ideally as Direct Connect\'s backup path.</code></pre>' +
      '<p><b>The real test:</b> pick any two VPCs/subnets in your org and answer "can X reach Y, and why" using only route tables — if that takes ' +
      'more than a few minutes, your topology has outgrown ad hoc peering.</p>',
      try: [
        ['📖 AWS — building a scalable, secure multi-VPC network', 'https://docs.aws.amazon.com/whitepapers/latest/building-scalable-secure-multi-vpc-network-infrastructure/introduction.html', 'o'],
        ['🔗 Ch 16 — landing zone reference architecture', '#ch16', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, hybrid and multi-VPC connectivity is an exercise in making <b>reachability an explicit, auditable policy</b> rather ' +
      'than an emergent property of accumulated peering connections. The transit gateway route table (or its GCP/Azure equivalent) becomes the ' +
      'single source of truth a security review can actually read — which is the entire point of centralizing it.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Why doesn\'t VPC peering support transitive routing, and why does that matter at scale?\n' +
      'A: Peering is a point-to-point relationship; A-B and B-C peering does not let A reach C. At N VPCs, full\n' +
      '   mesh needs N*(N-1)/2 connections, which becomes unmanageable and unauditable past a handful — this\n' +
      '   is exactly the problem a transit gateway\'s hub-and-spoke model solves.\n\n' +
      'Q: How do you segment a transit gateway so prod and dev cannot reach each other, even though both attach\n' +
      '   to the same TGW?\n' +
      'A: Use separate TGW route tables per trust zone and associate each attachment with the route table for\n' +
      '   its zone; routes are only propagated where you explicitly allow, so dev\'s route table simply never\n' +
      '   gets a route to prod\'s CIDR.\n\n' +
      'Q: When do you need Direct Connect instead of a site-to-site VPN?\n' +
      'A: When you need consistent low latency, high throughput, or predictable cost for high-volume on-prem\n' +
      '   traffic — VPN over the public internet has variable latency and is bandwidth-capped by the tunnel;\n' +
      '   Direct Connect is often paired WITH a VPN as its automatic failover path.\n\n' +
      'Q: A redundant VPN setup with two tunnels still caused a 2-hour outage. What was the process failure?\n' +
      'A: The second tunnel was provisioned but never tested by actually failing the primary — redundancy that\n' +
      '   has not been exercised in a game day is unverified, not redundant.\n\n' +
      'Q: How would you answer "can the contractor VPC reach the production database" in an org with 12 VPCs?\n' +
      'A: With a transit gateway, read the TGW route table associated with the contractor VPC\'s attachment —\n' +
      '   one place, one answer. With ad hoc peering, you\'d have to trace every peering connection and route\n' +
      '   table by hand, which is itself the argument for migrating.</code></pre>',
      try: [
        ['📖 AWS — Transit Gateway network segmentation whitepaper', 'https://docs.aws.amazon.com/whitepapers/latest/building-a-multi-vpc-environment-aws-transit-gateway/introduction.html', 'o'],
        ['🔗 Ch 5 — IAM fundamentals (the identity side of segmentation)', '#ch5', 'o']
      ] }
  ],

  quiz: [
    { q: 'Why does VPC peering not scale well past a handful of VPCs?',
      opts: [
        'Peering has a hard limit of 3 VPCs',
        'Peering is point-to-point with no transitive routing, so a full mesh at N VPCs needs N*(N-1)/2 connections, quickly becoming unmanageable and unauditable',
        'Peering is more expensive than a transit gateway at any scale',
        'Peering does not support IPv4'],
      ok: 1,
      why: 'Because A-B and B-C peering does not let A reach C, connecting every VPC to every other requires a combinatorially growing number of pairwise links.' },
    { q: 'How do you prevent a production and a dev VPC from reaching each other even though both attach to the same transit gateway?',
      opts: [
        'It is impossible — anything attached to the same TGW can always reach everything else',
        'Use separate TGW route tables per trust zone, associating each attachment only with the route table for its zone so routes are never propagated across',
        'Give prod and dev overlapping CIDRs',
        'Disable BGP on the dev attachment'],
      ok: 1,
      why: 'A transit gateway supports multiple route tables; segmentation comes from associating attachments with the route table appropriate to their trust zone.' },
    { q: 'A team provisions two VPN tunnels for redundancy but never tests failover. What is the risk this creates?',
      opts: [
        'None — dual tunnels are always automatically redundant',
        'The second tunnel may be silently misconfigured (e.g. a broken BGP session) and only discovered during a real outage when it fails to take over',
        'Two tunnels always cost double for no benefit',
        'BGP requires exactly one tunnel per VPC'],
      ok: 1,
      why: 'Redundancy that has never been exercised by actually failing the primary path is unverified — a misconfiguration in the standby path can hide until it is needed.' }
  ]
};
