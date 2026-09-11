/* DevOps-Infra Learn — Part 4 · Chapter 1: VPC Design */
window.CH[1] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>Every cloud resource in this course lives inside a <b>VPC (Virtual Private Cloud)</b> — your own private slice of the cloud\'s network, ' +
      'with its own address space, subnets, and rules about what can talk to what. Get the address plan wrong on day one and you will be re-architecting ' +
      'networking in year two while production traffic is flowing.</p>' +
      '<pre><code>VPC            a private network, e.g. 10.4.0.0/16  (~65,000 addresses)\n' +
      '  ├─ public subnet    has a route to the internet — load balancers, bastions\n' +
      '  ├─ private subnet   no direct internet route — app servers, databases\n' +
      '  └─ route table      the rules deciding where traffic from each subnet goes</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A gated office building.</b> The VPC is the building; subnets are floors. ' +
      'The ground floor (public subnet) has a street entrance — visitors (internet traffic) can walk in. Upper floors (private subnets) have no ' +
      'street door — you can only reach them via the elevator (a load balancer or bastion), and floor plans (CIDR ranges) are drawn once, ' +
      'expensive to redraw once the building is occupied.</p></div>',
      try: [
        ['📖 AWS — VPC and subnet basics', 'https://docs.aws.amazon.com/vpc/latest/userguide/configure-subnets.html', 'o'],
        ['🏗️ Part 2: Terraform modules (the VPC module pattern)', '../learn2/#ch1', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code>CIDR PLANNING\n' +
      '  a VPC of 10.4.0.0/16 gives ~65,000 IPs. Carve it into /20 or /24 subnets PER AVAILABILITY ZONE\n' +
      '  and per tier (public / private / data), leaving room to add zones/tiers later without re-CIDRing.\n' +
      '  RESERVE non-overlapping ranges across ALL your VPCs/accounts up front — peering or a transit\n' +
      '  gateway later requires non-overlapping CIDRs, and re-IP\'ing a live VPC is extremely painful.\n\n' +
      'THE STANDARD 3-TIER LAYOUT (per availability zone, x3 for HA)\n' +
      '  public subnet    ALB / NAT gateway / bastion      — has an Internet Gateway route\n' +
      '  private subnet   app servers, EKS nodes           — routes OUTBOUND via the NAT gateway only\n' +
      '  data subnet      RDS, ElastiCache                 — no internet route at all, most restricted\n\n' +
      'ROUTE TABLES  one per subnet type; the public one has a 0.0.0.0/0 -> Internet Gateway route,\n' +
      '  private ones route 0.0.0.0/0 -> NAT Gateway (outbound-only), data subnets often have no default route.</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>The <b>3-tier VPC</b> (public / private / data, x N availability zones) is the ' +
      'industry-standard reference layout, provisioned via Terraform\'s official ' +
      '<a href="https://registry.terraform.io/modules/terraform-aws-modules/vpc/aws/latest" target="_blank" rel="noopener">terraform-aws-modules/vpc</a> ' +
      '(or the cloud-native equivalent). You rarely hand-write VPC resources from scratch — you configure the standard module\'s CIDR, AZ count, and ' +
      'subnet sizing for your scale.</p></div>',
      try: [
        ['📖 terraform-aws-modules/vpc — the standard module', 'https://registry.terraform.io/modules/terraform-aws-modules/vpc/aws/latest', 'o'],
        ['📖 AWS — VPC design (Well-Architected)', 'https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_planning_network_topology_plan_network_topology.html', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The CIDR that ran out.</b> ' +
      'A startup provisions a VPC with a /24 (256 addresses) "because that\'s plenty" — two years and one Kubernetes migration later, every pod gets ' +
      'its own IP in the VPC CIDR and they run out of addresses mid-incident, unable to scale up during a traffic spike. Fix (the hard way): a ' +
      'secondary CIDR block added to the existing VPC, new subnets carved from it, workloads gradually migrated. Lesson from day one: size for ' +
      '10x growth — a /16 VPC costs nothing extra over a /24 and buys years of headroom.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The peering that could not happen.</b> ' +
      'Two VPCs — one per acquired company — both provisioned independently with <code>10.0.0.0/16</code>. A business requirement to connect them via ' +
      'VPC peering hits an immediate wall: peering requires non-overlapping CIDRs, and both networks are already full of live resources on that range. ' +
      'The fix is a costly re-IP migration. Prevention: maintain a company-wide <b>CIDR allocation spreadsheet</b> before any VPC is created — ' +
      'every account/environment gets a reserved, non-overlapping block up front.</p></div>' +
      '<p><b>Subnet sizing rule of thumb:</b> size private/app subnets generously (a /20 per AZ = 4,096 IPs) since container platforms consume IPs ' +
      'fast; data subnets can be small since databases rarely scale horizontally to thousands of instances.</p>',
      try: [
        ['📖 AWS — VPC IP addressing guide', 'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-ip-addressing.html', 'o'],
        ['🔐 Ch 4 — VPC peering & transit gateways', '#ch4', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                          FIX\n' +
      'A tiny CIDR "because it is plenty"     Size for 10x growth from day one — a /16 costs nothing extra\n' +
      '                                       and container platforms consume IPs fast.\n' +
      'No company-wide CIDR allocation plan    Reserve non-overlapping ranges across every VPC/account\n' +
      '                                       BEFORE creation — peering/transit gateways need it later.\n' +
      'Databases in a "private" subnet with     Give data resources their OWN subnet tier with no default\n' +
      '  outbound internet access               internet route at all — outbound access is an exfil risk.\n' +
      'One subnet, one AZ                       Always spread subnets (and therefore workloads) across at\n' +
      '                                       least 3 AZs for HA — one AZ outage should not be an outage.\n' +
      'Public subnets sized like private ones   Public subnets host only LBs/NAT/bastions — a /24 is plenty;\n' +
      '                                       spend your address space on private/app subnets instead.\n' +
      'Hand-writing VPC Terraform from scratch   Use the standard module (terraform-aws-modules/vpc or\n' +
      '                                       equivalent) — VPC plumbing is well-solved, undifferentiated work.</code></pre>' +
      '<p><b>The VPC is the one thing you cannot easily undo.</b> Compute, storage, even databases can usually be migrated with some pain; ' +
      're-architecting the address plan of a live network touching every other resource is one of the most disruptive changes in infrastructure. ' +
      'Spend real time on this chapter before you provision anything else.</p>',
      try: [
        ['📖 AWS — VPC design patterns whitepaper', 'https://docs.aws.amazon.com/whitepapers/latest/building-scalable-secure-multi-vpc-network-infrastructure/introduction.html', 'o'],
        ['🔐 Ch 16 — the secure cloud landing zone', '#ch16', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, VPC design is <b>organisation design in disguise</b>: the CIDR allocation plan, the account/VPC boundary strategy, and the ' +
      'peering/transit topology all encode who can talk to whom, and changing them later means touching every team\'s infrastructure at once. Treat the ' +
      'initial network plan with the same rigor as a schema migration on a database everyone depends on.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Design the VPC layout for a new production environment. Walk me through it.\n' +
      'A: A /16 VPC (headroom for growth) across 3 AZs for HA. Per AZ: a small public subnet (LB/NAT/bastion,\n' +
      '   internet-gateway route), a generous private subnet (app/container workloads, NAT-gateway outbound\n' +
      '   only), and a small data subnet (databases, no internet route at all). CIDR reserved from a company-\n' +
      '   wide allocation plan so it never overlaps a VPC we might later peer with.\n\n' +
      'Q: Why size the CIDR much larger than current needs?\n' +
      'A: Re-IP\'ing a live VPC is one of the most disruptive migrations in infrastructure. A /16 vs a /24\n' +
      '   costs nothing and buys years of headroom, especially once a container platform starts consuming an\n' +
      '   IP per pod.\n\n' +
      'Q: Two VPCs both used 10.0.0.0/16 and now need to be peered. What is the real fix?\n' +
      'A: Peering requires non-overlapping CIDRs; with both already populated with live resources, the fix is\n' +
      '   a costly re-IP migration of one side. Prevention is a company-wide CIDR allocation plan before any\n' +
      '   VPC is created.\n\n' +
      'Q: Why give the data tier its own subnet with no internet route, rather than reusing the private subnet?\n' +
      'A: Defense in depth — even if the app subnet is compromised, a database subnet with no outbound\n' +
      '   internet route cannot be used to exfiltrate data directly, and it is one less thing that needs a NAT\n' +
      '   gateway route at all.\n\n' +
      'Q: What is undifferentiated about most VPC Terraform, and why not hand-write it?\n' +
      'A: Subnets, route tables, NAT/internet gateways, and AZ spreading are well-solved, standard patterns.\n' +
      '   The official community module (terraform-aws-modules/vpc) encodes years of edge cases; hand-writing\n' +
      "   it from scratch re-derives bugs that module has already fixed.</code></pre>",
      try: [
        ['📖 AWS — Multi-account network design (Well-Architected)', 'https://docs.aws.amazon.com/whitepapers/latest/organizing-your-aws-environment/organizing-your-aws-environment.html', 'o'],
        ['🔐 Ch 4 — connecting VPCs safely (peering & transit)', '#ch4', 'o']
      ] }
  ],

  quiz: [
    { q: 'Why should a VPC CIDR be sized much larger than current needs (e.g. a /16 instead of a /24)?',
      opts: [
        'Larger CIDRs are cheaper',
        'Re-IP\'ing a live VPC is extremely disruptive; a larger CIDR costs nothing extra and provides years of headroom, especially once container platforms consume an IP per pod',
        'AWS requires a minimum of /16',
        'It has no real benefit'],
      ok: 1,
      why: 'Address space is essentially free at creation time but painful to expand later on a live network. Sizing generously avoids a costly future migration.' },
    { q: 'Two VPCs were both created with the same 10.0.0.0/16 CIDR and now need to be connected via peering. What goes wrong?',
      opts: [
        'Nothing, peering works fine with identical CIDRs',
        'VPC peering requires non-overlapping CIDR ranges; with both VPCs already populated, resolving this requires a costly re-IP migration — prevented by a company-wide CIDR allocation plan up front',
        'Peering is only possible within the same AWS account',
        'The VPCs need to be in the same region'],
      ok: 1,
      why: 'Overlapping address spaces cannot be routed between each other. Reserving non-overlapping ranges across the whole organization before any VPC is created avoids this.' },
    { q: 'Why give the data tier (databases) its own subnet with no internet route, rather than placing it in the same private subnet as application servers?',
      opts: [
        'It reduces AWS billing',
        'Defense in depth — even if the app tier is compromised, a data subnet with no outbound internet route removes a direct path for exfiltrating data',
        'Databases cannot be placed in private subnets',
        'It is required for encryption at rest'],
      ok: 1,
      why: 'Separating the data tier with no internet egress is a network-level control that limits the blast radius of a compromise elsewhere in the stack.' }
  ]
};
