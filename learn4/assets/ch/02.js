/* DevOps-Infra Learn — Part 4 · Chapter 2: Load Balancing &amp; Ingress Patterns */
window.CH[2] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>A <b>load balancer</b> sits in front of a fleet of servers and decides which one handles each request, so no single server ' +
      'is overwhelmed and a dead server is quietly skipped. In Kubernetes, an <b>Ingress</b> is the same idea one layer up: a single entry ' +
      'point that routes HTTP requests to the right internal Service based on hostname or path.</p>' +
      '<pre><code>Internet --> Load Balancer --> [ server A, server B, server C ]\n' +
      '                 |\n' +
      '                 checks health every N seconds, stops sending traffic to a sick server</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>The host at a restaurant.</b> Guests (requests) arrive at one door. The host ' +
      '(load balancer) glances at which tables (servers) are free and seats guests there — never sending a party to a table that\'s on fire ' +
      '(a failed health check). Ingress is the host also reading the reservation name ("api.example.com" vs "app.example.com") to decide which ' +
      'section of the restaurant (which backend Service) to walk the guest to.</p></div>',
      try: [
        ['📖 AWS — What is Elastic Load Balancing', 'https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/what-is-load-balancing.html', 'o'],
        ['📖 Kubernetes — Ingress concepts', 'https://kubernetes.io/docs/concepts/services-networking/ingress/', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code>L4 (transport layer) LOAD BALANCER — e.g. AWS Network Load Balancer (NLB)\n' +
      '  routes on IP + TCP/UDP port only. Does not look at HTTP. Extremely fast, preserves client IP,\n' +
      '  good for raw TCP, gRPC, or when you terminate TLS on the backend yourself.\n\n' +
      'L7 (application layer) LOAD BALANCER — e.g. AWS Application Load Balancer (ALB), NGINX, Envoy\n' +
      '  reads the HTTP request: host header, path, headers, cookies. Can route /api/* to one backend\n' +
      '  and /static/* to another from a SINGLE listener. Terminates TLS. Needed for Ingress.\n\n' +
      'HEALTH CHECK (the part everyone under-configures)\n' +
      '  path: /healthz   interval: 10s   timeout: 5s   unhealthy_threshold: 2   healthy_threshold: 2\n' +
      '  Too lax -> traffic keeps flowing to a dying pod. Too strict -> one slow GC pause = false ejection.\n\n' +
      'KUBERNETES INGRESS (NGINX Ingress Controller)\n' +
      '  apiVersion: networking.k8s.io/v1\n' +
      '  kind: Ingress\n' +
      '  spec:\n' +
      '    rules:\n' +
      '    - host: api.example.com\n' +
      '      http:\n' +
      '        paths:\n' +
      '        - path: /v1\n' +
      '          pathType: Prefix\n' +
      '          backend: { service: { name: api-v1-svc, port: { number: 80 } } }</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>For Kubernetes, <b>ingress-nginx</b> (or a cloud-native equivalent like the ' +
      '<a href="https://kubernetes-sigs.github.io/aws-load-balancer-controller/latest/" target="_blank" rel="noopener">AWS Load Balancer Controller</a>) ' +
      'is the de-facto standard Ingress implementation, and <a href="https://www.envoyproxy.io/docs" target="_blank" rel="noopener">Envoy</a> ' +
      'is the standard L7 proxy underneath most modern service meshes and API gateways.</p></div>',
      try: [
        ['📖 ingress-nginx — official docs', 'https://kubernetes.github.io/ingress-nginx/', 'o'],
        ['📖 AWS — ALB vs NLB comparison', 'https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/comparison.html', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The sticky-session outage.</b> ' +
      'A legacy app stores session state in server memory instead of a shared cache. It works fine behind a round-robin load balancer during ' +
      'testing (one server, one browser). In production, the LB spreads each user\'s requests across three servers and users get logged out mid-' +
      'checkout every few clicks whenever a request lands on a server that doesn\'t have their session. The real fix is not "enable sticky sessions" ' +
      '(that just re-creates the single point of failure per user) — it\'s moving session state to a shared store like Redis so any server can ' +
      'serve any request.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The health check that lied.</b> ' +
      'A health check endpoint returns <code>200 OK</code> unconditionally without checking the database connection pool. When the database ' +
      'becomes unreachable, every app server still reports "healthy" — the load balancer keeps sending traffic to servers that can only 500. ' +
      'The fix: a real health check that verifies dependencies the request path actually needs (DB ping, cache reachability) with a short ' +
      'timeout, plus a separate lightweight liveness check so a slow DB doesn\'t cascade into killing otherwise-fine pods.</p></div>' +
      '<p><b>Rule of thumb:</b> readiness checks (can this instance take traffic right now?) and liveness checks (should this process be restarted?) ' +
      'are different questions — conflating them is the single most common Ingress/LB misconfiguration in Kubernetes.</p>',
      try: [
        ['📖 Kubernetes — configure liveness, readiness probes', 'https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/', 'o'],
        ['🔗 Ch 9 — network security &amp; the WAF layer in front of the LB', '#ch9', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'Session state in server memory             Store sessions in a shared cache (Redis) so any backend\n' +
      '                                           can serve any request — never rely on LB stickiness alone.\n' +
      'Health check that ignores dependencies      Check what the request path actually needs (DB, cache) with\n' +
      '                                           a tight timeout; separate readiness from liveness.\n' +
      'One giant Ingress for every service          Split by domain/team where it maps to ownership; a single\n' +
      '                                           misconfigured rule should not risk every route at once.\n' +
      'TLS terminated only at the LB, plaintext     Re-encrypt LB-to-backend (or use mTLS) inside the VPC —\n' +
      '  all the way to the backend                 "internal network" is not a security boundary by itself.\n' +
      'No connection draining on deploy              Enable draining/deregistration delay so in-flight requests\n' +
      '                                           finish before a pod is killed during a rolling update.\n' +
      'L7 routing logic duplicated in app code       Push host/path routing to the Ingress/LB layer — keep\n' +
      '                                           routing decisions in one declarative place, not scattered code.</code></pre>' +
      '<p><b>The real test:</b> kill a backend instance mid-request during a load test. A correctly configured LB/Ingress finishes the in-flight ' +
      'request via draining, stops routing new traffic within one health-check interval, and the client never sees an error.</p>',
      try: [
        ['📖 AWS — connection draining / deregistration delay', 'https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html', 'o'],
        ['🔗 Ch 8 — mTLS between LB and backend', '#ch8', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, load balancing is a <b>feedback control problem</b>, not a routing table: health checks, connection draining, outlier ' +
      'detection (ejecting a backend that is erroring even while "healthy"), and retry budgets all interact. Get the interaction wrong — e.g. ' +
      'aggressive client-side retries plus an already-overloaded backend — and you build a self-inflicted DDoS called a retry storm.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: When would you choose an NLB (L4) over an ALB (L7)?\n' +
      'A: When you need raw TCP/UDP (e.g. gRPC over HTTP/2 the app terminates itself), need to preserve the\n' +
      '   client source IP without proxy protocol, need extreme low latency/high throughput, or the backend\n' +
      '   terminates its own TLS. ALB wins whenever you need host/path routing, WAF integration, or native\n' +
      '   HTTP features.\n\n' +
      'Q: What is a retry storm and how do you prevent one?\n' +
      'A: Clients retrying failed requests against an already-overloaded backend, multiplying load exactly when\n' +
      '   capacity is lowest. Prevent it with capped retries, exponential backoff with jitter, and a retry\n' +
      '   budget (e.g. Envoy\'s circuit breaker / outlier detection) that stops retrying once error rates spike.\n\n' +
      'Q: Why separate readiness and liveness probes?\n' +
      'A: Liveness answers "should this process be killed and restarted" — a hung process. Readiness answers\n' +
      '   "can this instance take traffic right now" — e.g. still warming a cache. Conflating them means a\n' +
      '   temporary dependency blip (readiness should fail) triggers unnecessary pod restarts (liveness fires).\n\n' +
      'Q: How do you roll out a new backend version with zero dropped requests?\n' +
      'A: Add new instances, wait for them to pass health checks, shift traffic gradually (or all at once for\n' +
      '   small fleets), then deregister old instances with a draining period long enough for in-flight\n' +
      '   requests to complete before the connection is force-closed.\n\n' +
      'Q: What is outlier detection and why is it different from a health check?\n' +
      'A: A health check asks a dedicated endpoint "are you okay"; outlier detection watches REAL request\n' +
      '   outcomes (5xx rate, latency) and ejects a backend that is failing real traffic even if its health\n' +
      '   endpoint still returns 200 — catching failures a synthetic check misses.</code></pre>',
      try: [
        ['📖 Envoy — outlier detection', 'https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/outlier', 'o'],
        ['🔗 Ch 15 — a live outage walkthrough', '#ch15', 'o']
      ] }
  ],

  quiz: [
    { q: 'What is the key difference between an L4 (NLB) and an L7 (ALB) load balancer?',
      opts: [
        'L4 is always slower than L7',
        'L4 routes on IP/port only without reading HTTP; L7 reads the HTTP request (host, path, headers) and can route accordingly',
        'L7 cannot terminate TLS',
        'There is no functional difference'],
      ok: 1,
      why: 'L4 operates purely on transport-layer info; L7 understands the application protocol, enabling host/path-based routing that Ingress relies on.' },
    { q: 'A health check endpoint returns 200 OK unconditionally, even when the database is unreachable. What is the consequence?',
      opts: [
        'None — the load balancer checks the database itself',
        'The load balancer keeps routing traffic to servers that can only fail the actual request, since the check never reflects real dependency health',
        'The server automatically restarts',
        'TLS certificates expire faster'],
      ok: 1,
      why: 'A health check must verify what the request path actually depends on, or it becomes a false signal that traffic keeps flowing to broken instances.' },
    { q: 'What is a "retry storm" and how is it typically prevented?',
      opts: [
        'A DNS propagation delay; prevented by lowering TTL',
        'Clients retrying failed requests against an already-overloaded backend, multiplying load; prevented with capped retries, backoff with jitter, and retry budgets/circuit breakers',
        'A load balancer restarting repeatedly; prevented by disabling health checks',
        'A certificate renewal loop; prevented by cert-manager'],
      ok: 1,
      why: 'Uncontrolled client retries against a struggling backend compound the overload. Backoff, jitter, and retry budgets keep retries from amplifying an outage.' }
  ]
};
