/* DevOps-Infra Learn — Part 3 · Chapter 6: Ingress, Gateway API & Traffic Management */
window.CH[6] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>Pods and Services only exist inside the cluster\'s private network. An <b>Ingress</b> (or the newer <b>Gateway API</b>) is the front door: ' +
      'a controller (nginx, Traefik, or a cloud load balancer) watches Ingress/Gateway objects and configures a real, internet-facing load balancer to ' +
      'route <code>example.com/api</code> and <code>example.com/app</code> to the right Service inside.</p>' +
      '<pre><code>internet -&gt; cloud LB -&gt; Ingress controller pod -&gt; matches host/path -&gt; Service -&gt; Pod</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A building\'s front reception desk.</b> Dozens of departments (Services) sit ' +
      'behind locked internal doors nobody outside can just walk into. Reception (Ingress) is the one public entrance: it reads your destination ' +
      '("Accounting", "/api") off a sign-in sheet and routes you to the right internal door — visitors never need to know the building\'s internal ' +
      'layout.</p></div>',
      try: [
        ['📖 Kubernetes — Ingress', 'https://kubernetes.io/docs/concepts/services-networking/ingress/', 'o'],
        ['☸️ Ch 5 — Ingress gets traffic IN, a mesh manages it once inside', '#ch5', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code># classic Ingress — path-based routing\n' +
      'apiVersion: networking.k8s.io/v1\n' +
      'kind: Ingress\n' +
      'metadata:\n' +
      '  name: my-app\n' +
      '  annotations: { cert-manager.io/cluster-issuer: letsencrypt }   # TLS via cert-manager (Ch 1)\n' +
      'spec:\n' +
      '  tls: [{ hosts: [example.com], secretName: example-com-tls }]\n' +
      '  rules:\n' +
      '  - host: example.com\n' +
      '    http:\n' +
      '      paths:\n' +
      '      - path: /api\n' +
      '        pathType: Prefix\n' +
      '        backend: { service: { name: api-svc, port: { number: 80 } } }\n\n' +
      '# the newer Gateway API — more expressive, portable across controllers\n' +
      'apiVersion: gateway.networking.k8s.io/v1\n' +
      'kind: HTTPRoute\n' +
      'metadata: { name: my-app }\n' +
      'spec:\n' +
      '  parentRefs: [{ name: my-gateway }]\n' +
      '  rules: [{ matches: [{ path: { value: /api } }], backendRefs: [{ name: api-svc, port: 80 }] }]</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p><b>Gateway API</b> is the CNCF/SIG-Network-endorsed successor to Ingress — role-' +
      'oriented (infra team owns <code>Gateway</code>, app teams own <code>HTTPRoute</code>), portable across implementations, and supports traffic ' +
      'splitting/header matching natively without vendor annotations. <b>ingress-nginx</b> remains the most widely deployed classic controller; new ' +
      'setups are increasingly starting directly on Gateway API.</p></div>',
      try: [
        ['📖 Kubernetes — Gateway API', 'https://gateway-api.sigs.k8s.io/', 'o'],
        ['📖 cert-manager — Securing Ingress with TLS', 'https://cert-manager.io/docs/usage/ingress/', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>TLS termination "works" but browsers show a certificate warning.</b> ' +
      'An Ingress is annotated for cert-manager but the Certificate never issues — <code>kubectl describe certificate</code> shows a stuck ' +
      '<code>CertificateRequest</code> because the ACME HTTP-01 challenge could not reach the cluster (DNS still points at the old load balancer). ' +
      'Fix: check <code>kubectl describe challenge</code> for the exact ACME failure, and confirm DNS resolves to the CURRENT ingress controller\'s ' +
      'external IP before assuming cert-manager itself is broken.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>A path-routing rule that "works" until a trailing slash.</b> ' +
      'An Ingress routes <code>/api</code> with <code>pathType: Prefix</code>, but a request to exactly <code>/apiV2</code> unexpectedly also matches, ' +
      'because Prefix matching is path-segment aware in theory but a controller-specific quirk (or a Regex-mode annotation someone copy-pasted) treats it ' +
      'as a raw string prefix. Fix: test path rules explicitly with <code>curl</code> against real paths before trusting the spec\'s semantics — behavior ' +
      'can differ subtly between ingress-nginx, ALB Ingress Controller, and others despite using the "same" Kubernetes API.</p></div>' +
      '<p><b>Migrating Ingress to Gateway API incrementally:</b> both can coexist pointed at the same backend Services during migration — cut traffic over ' +
      'host-by-host, verify each, and only then decommission the old Ingress objects.</p>',
      try: [
        ['📖 Gateway API — Migrating from Ingress', 'https://gateway-api.sigs.k8s.io/guides/migrating-from-ingress/', 'o'],
        ['☸️ Ch 1 — cert-manager Certificate CRDs behind the scenes', '#ch1', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'Vendor-specific annotations sprinkled      Prefer Gateway API\'s portable fields (HTTPRoute matches/\n' +
      '  everywhere for routing logic               filters) where possible — annotations lock you to one\n' +
      '                                              controller and rarely have consistent semantics across them.\n' +
      'Assuming DNS + TLS just "work" after        DNS propagation and ACME challenge completion both take real\n' +
      '  applying an Ingress                        time; check `kubectl describe certificate/challenge`, don\'t\n' +
      '                                              assume a stuck cert means cert-manager itself is broken.\n' +
      'No rate limiting / connection limits on     A single public entry point with no limits is a trivial\n' +
      '  the ingress controller                     target for one bad client or bug to take the whole cluster\'s\n' +
      '                                              ingress capacity down.\n' +
      'Ingress controller running as a              A crashed/OOMKilled sole replica means the whole cluster is\n' +
      '  single replica                              unreachable from outside; always run &gt;=2 replicas with\n' +
      '                                              PodDisruptionBudget.\n' +
      'Testing routing rules only via the spec,    pathType Prefix/Exact semantics have real implementation\n' +
      '  never with a real curl                     differences between controllers — always curl-test the\n' +
      '                                              actual paths you care about.</code></pre>' +
      '<p><b>The real test:</b> scale the ingress controller to zero replicas for ten seconds (in a test cluster). If DNS/health checks do not fail over ' +
      'cleanly and traffic does not resume the instant it is back, the controller\'s own availability was never actually load-tested.</p>',
      try: [
        ['📖 ingress-nginx — Documentation', 'https://kubernetes.github.io/ingress-nginx/', 'o'],
        ['☸️ Ch 7 — a shared ingress controller across tenants needs isolation too', '#ch7', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>Expert-level traffic management treats the ingress layer as a <b>shared, high-blast-radius piece of platform infrastructure</b>, not an app ' +
      'team concern: one misbehaving route or an under-provisioned controller affects every tenant behind it. The Gateway API\'s split of ' +
      '<code>Gateway</code> (infra-owned) from <code>HTTPRoute</code>/<code>TCPRoute</code> (app-owned) exists precisely to formalize that boundary — ' +
      'app teams get self-service routing without ever touching the shared listener/TLS/LB configuration a platform team is responsible for keeping ' +
      'available.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Why is Gateway API considered the successor to Ingress rather than just an alternative?\n' +
      'A: Ingress\'s spec is minimal and pushed almost all real functionality (rewrites, header matching, TLS\n' +
      '   details) into non-portable per-controller annotations. Gateway API expresses that functionality as\n' +
      '   first-class portable fields AND splits ownership (Gateway = infra team, HTTPRoute = app team) —\n' +
      '   something Ingress never modeled.\n\n' +
      'Q: A Certificate tied to an Ingress never issues. What are the first two things you check?\n' +
      "A: `kubectl describe certificate` for the CertificateRequest status, then `kubectl describe challenge`\n" +
      "   for the exact ACME failure — usually DNS not yet pointing at the current ingress controller's IP, or\n" +
      '   the HTTP-01 challenge path being blocked before it reaches the controller.\n\n' +
      'Q: Why should an ingress controller never run as a single replica in production?\n' +
      'A: It is the single entry point for all external traffic to every service behind it — one crashed/\n' +
      '   OOMKilled replica with no redundancy takes down the entire cluster\'s inbound traffic, not just one app.\n\n' +
      'Q: How do you migrate from Ingress to Gateway API without an outage?\n' +
      'A: Run both concurrently pointed at the same backend Services, cut traffic over host-by-host (via DNS or\n' +
      '   a canary weight), verify each cutover, and only decommission the old Ingress objects once every host\n' +
      '   is confirmed working on Gateway API.\n\n' +
      'Q: Why treat the ingress layer as shared platform infrastructure rather than an app-team concern?\n' +
      'A: It has the largest blast radius in the whole traffic path — every tenant\'s traffic flows through the\n' +
      "   same controller/LB. A platform team should own its capacity, availability, and rate-limiting defaults,\n" +
      "   exposing only scoped self-service routing (HTTPRoute) to app teams, not the shared listener config.</code></pre>",
      try: [
        ['📖 Gateway API — Concepts (role-oriented API)', 'https://gateway-api.sigs.k8s.io/concepts/api-overview/', 'o'],
        ['☸️ Ch 16 — ingress/Gateway as one shared layer of the reference architecture', '#ch16', 'o']
      ] }
  ],

  quiz: [
    { q: 'What is the key structural difference the Gateway API introduces compared to classic Ingress?',
      opts: [
        'It removes the need for TLS entirely',
        'It splits ownership into infra-owned Gateway resources and app-owned HTTPRoute resources, with portable fields instead of vendor-specific annotations',
        'It only works with one specific cloud provider',
        'It eliminates the need for an ingress controller'],
      ok: 1,
      why: 'Gateway API is role-oriented (Gateway = platform team, HTTPRoute/TCPRoute = app teams) and expresses routing behavior as portable fields rather than non-portable annotations.' },
    { q: 'A Certificate attached to an Ingress never issues. What should you check first?',
      opts: [
        'Restart the entire cluster',
        '`kubectl describe certificate` and `kubectl describe challenge` to find the exact ACME failure — often DNS not yet pointing at the current ingress controller',
        'Delete and recreate the Ingress with no further investigation',
        'Assume cert-manager is broken and reinstall it'],
      ok: 1,
      why: 'Certificate/CertificateRequest/Challenge status usually pinpoints the exact failure (commonly stale DNS) rather than requiring a blind cert-manager reinstall.' },
    { q: 'Why should an ingress controller never run as a single replica in production?',
      opts: [
        'It has no effect on availability',
        'It is the single entry point for ALL external traffic to every backend service — one crashed replica with no redundancy takes down the whole cluster\'s inbound traffic',
        'Single replicas are actually recommended for stability',
        'Multiple replicas are not supported by any ingress controller'],
      ok: 1,
      why: 'The ingress controller sits on the critical path for every external request; running it with only one replica creates a severe single point of failure.' }
  ]
};
