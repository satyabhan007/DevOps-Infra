/* DevOps-Infra Learn — Part 4 · Chapter 8: Certificate Management &amp; mTLS */
window.CH[8] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>A <b>TLS certificate</b> proves a server (or in mTLS, both sides) is who it claims to be, and encrypts the traffic between them. Manually ' +
      'issuing and renewing certificates does not survive contact with a fleet of hundreds of services — certificates expire, humans forget, and an ' +
      'expired cert takes down a service just as hard as a code bug does.</p>' +
      '<pre><code>Client --- "prove you are api.example.com" --> Server presents a certificate\n' +
      '        <-- signed by a Certificate Authority (CA) the client already trusts --\n' +
      'mTLS adds: Server also asks the CLIENT to prove ITS identity with its own certificate</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A notarized ID card with an expiration date.</b> A TLS certificate is like a ' +
      'passport — issued by a trusted authority, and useless once it expires. One-way TLS is a bouncer checking YOUR passport; <b>mTLS</b> is a ' +
      'bouncer and a guest checking each other\'s passports before either will talk — standard for service-to-service traffic where both sides need ' +
      'to be sure who they\'re connected to.</p></div>',
      try: [
        ['📖 cert-manager — overview', 'https://cert-manager.io/docs/', 'o'],
        ['🔗 Ch 6 — mTLS as a zero-trust building block', '#ch6', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code>CERT-MANAGER — automatic issuance/renewal in Kubernetes\n' +
      '  apiVersion: cert-manager.io/v1\n' +
      '  kind: Certificate\n' +
      '  metadata: { name: api-tls, namespace: default }\n' +
      '  spec:\n' +
      '    secretName: api-tls-secret\n' +
      '    duration: 2160h        # 90 days\n' +
      '    renewBefore: 360h      # renew 15 days before expiry, automatically, no human involved\n' +
      '    dnsNames: [api.example.com]\n' +
      '    issuerRef: { name: letsencrypt-prod, kind: ClusterIssuer }\n\n' +
      'mTLS WITH ISTIO (STRICT mode requires a valid client cert on every call in the namespace)\n' +
      '  apiVersion: security.istio.io/v1\n' +
      '  kind: PeerAuthentication\n' +
      '  spec: { mtls: { mode: STRICT } }\n' +
      '  # Istio\'s own CA issues and auto-rotates short-lived workload certs — nobody hand-manages these.</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p><a href="https://cert-manager.io/docs/" target="_blank" rel="noopener">cert-manager</a> ' +
      'is the standard Kubernetes-native certificate controller, typically backed by ' +
      '<a href="https://letsencrypt.org/docs/" target="_blank" rel="noopener">Let\'s Encrypt</a> for public certs; for internal service-to-service ' +
      'mTLS, a service mesh like <a href="https://istio.io/latest/docs/concepts/security/" target="_blank" rel="noopener">Istio</a> automates short-lived ' +
      'workload certificate issuance and rotation entirely.</p></div>',
      try: [
        ['📖 Let\'s Encrypt — how it works', 'https://letsencrypt.org/how-it-works/', 'o'],
        ['📖 cert-manager — ACME issuers', 'https://cert-manager.io/docs/configuration/acme/', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The 2 a.m. page for an expired certificate.</b> ' +
      'A certificate manually issued and installed by an engineer 11 months ago silently expires at 2 a.m. on a Saturday, taking down the public API ' +
      'with a browser-scary "your connection is not private" error for every customer. Nobody had a reminder set, because the process was "someone ' +
      'remembers to renew it." The fix: migrate every certificate to cert-manager with automatic renewal well before expiry, and alert on ' +
      'certificate age/expiry as a monitored metric — expiring certs should never be a surprise, let alone an outage.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The mTLS rollout that broke a health check.</b> ' +
      'A team enables STRICT mTLS on a namespace, and the Kubernetes liveness probe — which calls the pod directly over plain HTTP from the kubelet, ' +
      'not through the mesh — starts failing because the pod now refuses unauthenticated connections, and the pod gets killed and restarted in a ' +
      'loop. The fix: exclude the health-check port from mTLS enforcement (mesh-specific config for probe ports) so kubelet-originated liveness ' +
      'checks are allowed through while real traffic between services still requires mTLS.</p></div>' +
      '<p><b>Rule of thumb:</b> automated renewal is not optional at any scale beyond a handful of certs — the human-remembers-to-renew model has a ' +
      '100% eventual failure rate.</p>',
      try: [
        ['📖 Istio — excluding ports from mTLS/inbound interception', 'https://istio.io/latest/docs/ops/configuration/traffic-management/traffic-routing/', 'o'],
        ['🔗 Ch 2 — health checks that the LB/kubelet perform', '#ch2', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                               FIX\n' +
      'Manually issued/installed certificates        Automate issuance AND renewal with cert-manager (or mesh-\n' +
      '                                            native CA) — no cert should depend on human memory.\n' +
      'No alerting on certificate expiry              Monitor cert age/expiry as a first-class metric with an\n' +
      '                                            alert well before the renewal window even begins.\n' +
      'Long-lived certificates (years) for internal   Prefer short-lived (hours/days) workload certs auto-\n' +
      '  service-to-service traffic                    rotated by the mesh CA — smaller window if a key leaks.\n' +
      'mTLS enabled without excluding probe/health     Explicitly exclude kubelet-originated health checks from\n' +
      '  check traffic                                 mTLS enforcement so liveness/readiness probes still work.\n' +
      'Private keys stored/copied outside the           Keep private keys inside the secret store/mesh CA that\n' +
      '  certificate management system                  generated them — never export/email/Slack a private key.</code></pre>' +
      '<p><b>The real test:</b> let a non-critical certificate approach expiry on purpose in a test environment and confirm the automated renewal ' +
      'actually fires — an untested "automatic" renewal pipeline is exactly as unreliable as the manual process it replaced.</p>',
      try: [
        ['📖 cert-manager — troubleshooting renewal', 'https://cert-manager.io/docs/troubleshooting/', 'o'],
        ['🔗 Ch 14 — revoking/rotating a compromised certificate\'s key', '#ch14', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, certificate management is <b>PKI operations</b> — you\'re not just renewing certs, you\'re running a trust hierarchy: ' +
      'a root CA (kept offline, rarely used), intermediate CAs (do the actual day-to-day signing), and short-lived leaf/workload certs issued and ' +
      'rotated automatically. The shorter the leaf cert lifetime, the smaller the damage window from a leaked key — the whole system is designed ' +
      'around minimizing how long any one certificate matters.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Walk through the certificate trust chain from root CA to a leaf certificate.\n' +
      'A: A root CA (offline, heavily protected, rarely touched) signs one or more intermediate CAs; an\n' +
      '   intermediate CA does the actual day-to-day signing of leaf/end-entity certificates. Clients trust the\n' +
      '   root; the server presents the full chain (leaf + intermediates) so the client can verify each link\n' +
      '   back to a root it already trusts.\n\n' +
      'Q: Why do modern systems favor very short-lived certificates (hours to days) over year-long ones for\n' +
      '   internal service-to-service traffic?\n' +
      'A: A shorter lifetime shrinks the window a leaked private key remains useful — a leaked key on a cert\n' +
      '   that expires in 24h is a much smaller incident than one valid for a year, and automated mesh CAs make\n' +
      '   frequent rotation free (no manual renewal cost) so there is little reason not to.\n\n' +
      'Q: An mTLS rollout broke Kubernetes liveness probes. Why, and how do you fix it without disabling mTLS?\n' +
      'A: Kubelet calls the pod directly over plain HTTP for probes, bypassing the mesh — under STRICT mTLS the\n' +
      '   pod refuses that unauthenticated connection. Fix by excluding the probe port from mTLS enforcement\n' +
      '   (mesh-specific traffic policy) while keeping STRICT mode for real service traffic.\n\n' +
      'Q: What is certificate pinning and what is its tradeoff?\n' +
      'A: The client hard-codes (pins) which exact certificate or CA it will accept, rejecting anything else\n' +
      '   even if otherwise valid — stronger against a compromised/rogue CA, but it turns routine cert\n' +
      '   rotation into a client-side deployment that must ship before the old pinned cert expires.\n\n' +
      'Q: Why did an 11-month-old manually installed certificate cause a Saturday 2 a.m. outage, and what\'s the\n' +
      '   systemic fix, not just the immediate one?\n' +
      'A: It expired with no automated renewal and no monitored alert on expiry — a process depending on a\n' +
      '   human remembering has a 100% eventual failure rate at scale. The systemic fix is cert-manager (or\n' +
      '   equivalent) for every certificate plus an expiry-age alert, removing humans from the renewal path.</code></pre>',
      try: [
        ['📖 cert-manager — ClusterIssuer &amp; CA hierarchy concepts', 'https://cert-manager.io/docs/concepts/issuer/', 'o'],
        ['🔗 Ch 16 — PKI as part of the landing zone reference architecture', '#ch16', 'o']
      ] }
  ],

  quiz: [
    { q: 'Why do modern systems favor short-lived (hours/days) internal service certificates over year-long ones?',
      opts: [
        'Short-lived certs are cheaper to purchase',
        'A shorter lifetime shrinks the window a leaked private key remains useful, and automated mesh CAs make frequent rotation free, removing the usual cost of short lifetimes',
        'Certificate authorities do not allow certs longer than a day',
        'Short-lived certs do not require a trust chain'],
      ok: 1,
      why: 'Automated issuance/rotation removes the manual cost of short-lived certs, so teams get the security benefit (small leak window) without the old operational pain.' },
    { q: 'An mTLS rollout in STRICT mode broke Kubernetes liveness probes. What is the root cause?',
      opts: [
        'Liveness probes are incompatible with all forms of TLS',
        'Kubelet calls the pod directly over plain HTTP, bypassing the mesh, and STRICT mTLS refuses that unauthenticated connection unless the probe port is explicitly excluded',
        'The certificate had already expired',
        'mTLS disables all networking to the pod'],
      ok: 1,
      why: 'Kubelet-originated health checks do not go through the mesh sidecar, so under strict enforcement they need an explicit exclusion to keep working.' },
    { q: 'What is the practical tradeoff of certificate pinning?',
      opts: [
        'It has no downside and should always be used',
        'It hardens against a compromised/rogue CA accepting a fraudulent cert, but turns routine certificate rotation into a client-side deployment that must ship before the pinned cert expires',
        'It makes certificates never expire',
        'It removes the need for a certificate authority entirely'],
      ok: 1,
      why: 'Pinning trades operational flexibility (easy rotation) for stronger guarantees against a specific CA-compromise threat model.' }
  ]
};
