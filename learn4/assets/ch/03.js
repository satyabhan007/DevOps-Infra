/* DevOps-Infra Learn — Part 4 · Chapter 3: DNS at Scale */
window.CH[3] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p><b>DNS</b> turns a name like <code>api.example.com</code> into an IP address so a browser or service knows where to connect. Everything ' +
      'else in this course — load balancers, VPCs, IAM federation — is reachable by a name that DNS resolves first, which makes DNS the one system ' +
      'that, when it breaks, makes EVERYTHING else look broken too.</p>' +
      '<pre><code>Client asks: "where is api.example.com?"\n' +
      '  -> Root DNS servers        "ask the .com servers"\n' +
      '  -> .com TLD servers        "ask example.com\'s nameservers"\n' +
      '  -> example.com nameservers "it\'s 203.0.113.10" (cached per the record\'s TTL)</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A phone book that everyone caches in their pocket.</b> DNS records are phone-book ' +
      'entries; the TTL (time-to-live) is how long you\'re allowed to keep your own copy before checking for an update. A short TTL means everyone ' +
      'gets updates fast (good during a failover) but calls the phone company (the nameserver) constantly; a long TTL is cheap but means a changed ' +
      'number takes a long time to reach everyone — exactly the tradeoff you tune before an incident, not during one.</p></div>',
      try: [
        ['📖 AWS — Route 53 developer guide', 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/Welcome.html', 'o'],
        ['🔗 Ch 1 — VPCs, the network DNS routes into', '#ch1', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code>COMMON RECORD TYPES\n' +
      '  A       name -> IPv4 address                     api.example.com.  A     203.0.113.10\n' +
      '  AAAA    name -> IPv6 address\n' +
      '  CNAME   name -> another name (cannot coexist with other records at the same name)\n' +
      '  ALIAS/ANAME  cloud-specific: CNAME-like behavior allowed at the zone apex (e.g. Route 53 Alias)\n' +
      '  TXT     arbitrary text — domain verification, SPF/DKIM for email\n' +
      '  NS      which nameservers are authoritative for this zone\n\n' +
      'HEALTH-CHECKED FAILOVER RECORD (Route 53)\n' +
      '  aws route53 create-health-check --caller-reference r1 \\\n' +
      '    --health-check-config Type=HTTPS,ResourcePath=/healthz,FullyQualifiedDomainName=api.example.com\n' +
      '  # then attach a PRIMARY record pointing at region A and a SECONDARY at region B,\n' +
      '  # Route 53 stops answering with the primary\'s IP once its health check fails.\n\n' +
      'SPLIT-HORIZON DNS\n' +
      '  the SAME name (internal.example.com) resolves differently depending on who is asking:\n' +
      '  a private hosted zone answers with a private IP for clients inside the VPC, a public zone\n' +
      '  answers with a public IP (or NXDOMAIN) for everyone else.</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>For cloud-hosted DNS, ' +
      '<a href="https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/Welcome.html" target="_blank" rel="noopener">AWS Route 53</a> ' +
      '(or the equivalent Cloud DNS/Azure DNS) with health-checked failover routing is the standard; for internal Kubernetes service discovery, ' +
      '<a href="https://coredns.io/" target="_blank" rel="noopener">CoreDNS</a> is the CNCF-graduated standard resolver running inside every ' +
      'modern cluster.</p></div>',
      try: [
        ['📖 CoreDNS — official docs', 'https://coredns.io/manual/toc/', 'o'],
        ['📖 AWS — Route 53 health checks &amp; failover', 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover.html', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The TTL that turned a 2-minute fix into a 6-hour incident.</b> ' +
      'A team sets a DNS record\'s TTL to 24 hours "to reduce nameserver load." When the backing IP needs to change during an emergency migration, ' +
      'the change is instant at the nameserver — but resolvers and ISP caches around the world keep serving the stale IP for up to 24 hours, so a ' +
      'chunk of users can\'t reach the service long after the "fix" shipped. Lesson: drop the TTL to something like 60s BEFORE a planned migration ' +
      '(giving caches time to pick up the short TTL ahead of the actual cutover), and never run a critical record at a multi-hour TTL by default.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The split-horizon leak.</b> ' +
      'An internal admin dashboard is given a real public DNS record (<code>admin.example.com</code>) pointing at a private IP, with the intent that ' +
      '"nobody outside the VPC can resolve the private IP anyway." A security scan finds the record is fully enumerable in public DNS, handing an ' +
      'attacker the exact hostname of an internal admin panel to target. The fix: put internal-only names in a private hosted zone that simply does ' +
      'not exist in public DNS at all — security through "they can\'t route there" is not the same as "they can\'t find out it exists."</p></div>' +
      '<p><b>Rule of thumb:</b> treat public DNS records as public information — anything resolvable is effectively an index of your infrastructure ' +
      'for anyone who queries it.</p>',
      try: [
        ['📖 AWS — private hosted zones', 'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/hosted-zones-private.html', 'o'],
        ['🔗 Ch 6 — zero trust (don\'t rely on "internal" as a security boundary)', '#ch6', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                               FIX\n' +
      'Multi-hour TTL on a record you may need     Keep critical records at a short TTL (60-300s) always, or\n' +
      '  to fail over quickly                       lower it well before a planned cutover.\n' +
      'Internal hostnames in public DNS             Use a private hosted zone; never publish internal-only\n' +
      '                                            names even if they resolve to private, unroutable IPs.\n' +
      'A single DNS provider/registrar with no     Health-checked failover routing to a secondary region;\n' +
      '  failover plan                              know your registrar\'s incident process before you need it.\n' +
      'Wildcard records with no ownership review    Audit *.example.com wildcards — they silently answer for\n' +
      '                                            any subdomain, including ones an attacker chooses.\n' +
      'DNSSEC left unconfigured on a public zone     Enable DNSSEC on zones that matter — it stops cache-\n' +
      '                                            poisoning attacks that spoof a record\'s answer.\n' +
      'CNAME at the zone apex (example.com itself)   Use a provider\'s ALIAS/ANAME (or a flattened CNAME) —\n' +
      '                                            the CNAME spec forbids coexisting records at that name.</code></pre>' +
      '<p><b>The real test:</b> point a health check at a broken backend and watch how long it takes real client traffic to stop hitting it — ' +
      'if the answer is "the TTL," you find out during the incident, not before it.</p>',
      try: [
        ['📖 ICANN — DNSSEC explained', 'https://www.icann.org/resources/pages/dnssec-what-is-it-why-important-2019-03-05-en', 'o'],
        ['🔗 Ch 2 — load balancers behind the failover record', '#ch2', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, DNS design is <b>blast-radius engineering</b>: every name is a dependency edge, and DNS sits underneath every other ' +
      'system\'s failure domain. A DNS outage doesn\'t just take down one service — it takes down every service that resolves a name during the ' +
      'incident, including your own status page and monitoring, which is why runbooks should include IPs to fall back to when DNS itself is the ' +
      'thing that\'s down.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: You need to migrate a production service to a new IP with zero downtime. Walk through the DNS steps.\n' +
      'A: Days ahead, lower the record\'s TTL (e.g. to 60s) and wait at least the OLD TTL so caches worldwide\n' +
      '   pick up the shorter one. Bring up the new IP, verify it works, then flip the record. Monitor traffic\n' +
      '   on both old and new IPs to confirm the cutover completed before decommissioning the old one.\n\n' +
      'Q: What is split-horizon DNS and when do you need it?\n' +
      'A: The same hostname resolves differently depending on whether the query originates inside or outside\n' +
      '   your network — e.g. an internal load balancer\'s private IP for VPC clients, a public IP (or nothing)\n' +
      '   for the internet. Needed whenever a service has both internal and external consumers.\n\n' +
      'Q: Why can\'t you put a CNAME record at a zone apex (example.com with no subdomain)?\n' +
      'A: DNS spec forbids other records (like the required NS/SOA records) coexisting with a CNAME at the same\n' +
      '   name. Cloud DNS providers offer an ALIAS/ANAME type that behaves like a CNAME but is resolved\n' +
      '   server-side, satisfying the spec.\n\n' +
      'Q: What does DNSSEC actually protect against, and what does it NOT protect against?\n' +
      'A: It cryptographically signs records so a resolver can verify an answer wasn\'t forged/tampered with in\n' +
      '   transit (cache poisoning). It does NOT encrypt the query itself (that\'s DNS-over-HTTPS/TLS) and does\n' +
      '   not stop someone from seeing which domains you\'re looking up.\n\n' +
      'Q: Your monitoring dashboard is down during what looks like a full outage — first DNS-related thing to check?\n' +
      'A: Whether the outage is DNS resolution itself (dig the name from multiple resolvers/locations) versus\n' +
      '   the backend being unreachable after correct resolution — these require completely different fixes, and\n' +
      '   confusing them wastes the most valuable minutes of an incident.</code></pre>',
      try: [
        ['📖 Cloudflare — how DNS works', 'https://www.cloudflare.com/learning/dns/what-is-dns/', 'o'],
        ['🔗 Ch 15 — a live outage walkthrough', '#ch15', 'o']
      ] }
  ],

  quiz: [
    { q: 'A record\'s TTL is set to 24 hours. What is the practical consequence during an emergency IP change?',
      opts: [
        'None, DNS changes are always instant',
        'Resolvers and caches around the world keep serving the stale IP for up to 24 hours after the change, delaying how fast the fix actually reaches users',
        'The record automatically fails over',
        'It only affects internal DNS'],
      ok: 1,
      why: 'TTL governs how long a resolver is allowed to cache an answer before re-querying. A long TTL directly delays how quickly a change propagates.' },
    { q: 'What is split-horizon DNS used for?',
      opts: [
        'Speeding up DNS resolution globally',
        'Resolving the same hostname differently depending on whether the query comes from inside or outside the network — e.g. a private IP internally, a public IP externally',
        'Encrypting DNS queries',
        'Splitting a domain across two registrars'],
      ok: 1,
      why: 'Split-horizon (private hosted zone vs public zone) lets internal clients reach internal IPs while external clients get a different (or no) answer for the same name.' },
    { q: 'Why should internal-only hostnames not be published in public DNS, even if they resolve to unroutable private IPs?',
      opts: [
        'Public DNS is more expensive',
        'Publicly resolvable records are effectively public information — anyone can enumerate them, handing an attacker the exact hostnames of internal systems to target',
        'Private IPs cannot be stored in DNS records at all',
        'It violates the DNS specification'],
      ok: 1,
      why: 'Even if an attacker can\'t route to the private IP, learning that "admin.example.com" exists is reconnaissance they should not get for free from public DNS.' }
  ]
};
