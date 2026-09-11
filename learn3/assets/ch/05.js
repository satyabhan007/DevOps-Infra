/* DevOps-Infra Learn — Part 3 · Chapter 5: Service Mesh — Istio/Linkerd Fundamentals */
window.CH[5] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>A <b>service mesh</b> injects a small proxy ("sidecar") next to every pod so it, not your application code, handles service-to-service ' +
      'traffic — encryption, retries, timeouts, and traffic splitting all happen at the network layer, invisibly to the app. Your app just calls ' +
      '<code>http://payments</code> like always; the sidecar next to it and the sidecar next to <code>payments</code> quietly encrypt and manage that ' +
      'call in between.</p>' +
      '<pre><code>without mesh:  app --------------------- HTTP, plaintext --------------------&gt; app\n' +
      'with mesh:     app -&gt; sidecar --- mTLS, retries, metrics ---&gt; sidecar -&gt; app</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A translator/bodyguard standing next to every diplomat.</b> Each diplomat ' +
      '(your app) speaks their own language and never worries about security in transit — their assigned aide (the sidecar) handles encryption, ' +
      'retries a dropped message, and reports back on every conversation, without the diplomat changing how they talk at all.</p></div>',
      try: [
        ['📖 Istio — What is Istio?', 'https://istio.io/latest/docs/overview/what-is-istio/', 'o'],
        ['📖 Linkerd — Architecture', 'https://linkerd.io/2/reference/architecture/', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code># enable sidecar injection for a namespace (Istio)\n' +
      'kubectl label namespace payments istio-injection=enabled\n\n' +
      '# traffic splitting for a canary — 90% v1, 10% v2\n' +
      'apiVersion: networking.istio.io/v1beta1\n' +
      'kind: VirtualService\n' +
      'metadata: { name: payments }\n' +
      'spec:\n' +
      '  hosts: [payments]\n' +
      '  http:\n' +
      '  - route:\n' +
      '    - destination: { host: payments, subset: v1 }\n' +
      '      weight: 90\n' +
      '    - destination: { host: payments, subset: v2 }\n' +
      '      weight: 10\n\n' +
      '# enforce mesh-wide mTLS\n' +
      'apiVersion: security.istio.io/v1beta1\n' +
      'kind: PeerAuthentication\n' +
      'metadata: { name: default, namespace: istio-system }\n' +
      'spec: { mtls: { mode: STRICT } }</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p><b>Istio</b> (feature-rich, Envoy-proxy based) and <b>Linkerd</b> (lighter, ' +
      'Rust-proxy, simpler operationally) are the two CNCF-graduated meshes in production use. Both implement the <b>SMI</b>/mesh-agnostic patterns for ' +
      'mTLS and traffic splitting; Istio\'s API (VirtualService/DestinationRule) is the most widely referenced in job postings and docs.</p></div>',
      try: [
        ['📖 Istio — Traffic Management', 'https://istio.io/latest/docs/concepts/traffic-management/', 'o'],
        ['📖 Istio — Mutual TLS Migration', 'https://istio.io/latest/docs/tasks/security/authentication/mtls-migration/', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>A sidecar-injection failure that looks like a networking bug.</b> ' +
      'A pod is annotated for injection but comes up with only one container — the mutating webhook that injects the sidecar was down (or the ' +
      'namespace label was applied after the pod already existed) — traffic bypasses the mesh entirely and mTLS policy silently does not apply to it. ' +
      'Fix: <code>kubectl get pod -o jsonpath=\'{.spec.containers[*].name}\'</code> should show <code>istio-proxy</code>; if missing, check the webhook ' +
      '(<code>kubectl get mutatingwebhookconfigurations</code>) is healthy and the pod was created AFTER the namespace label.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>STRICT mTLS breaking a legacy service mid-migration.</b> ' +
      'A team flips mesh-wide mTLS to STRICT before every service has a sidecar injected — the few remaining un-injected pods can no longer talk to ' +
      'meshed ones at all, a hard outage. Fix: mTLS mode should be <code>PERMISSIVE</code> (accepts both plaintext and mTLS) during migration, ' +
      'flipped to STRICT only after confirming every workload in the namespace/mesh has a sidecar via metrics, never as a first step.</p></div>' +
      '<p><b>Debugging fast:</b> <code>istioctl proxy-status</code> shows every sidecar\'s sync state with the control plane; ' +
      '<code>istioctl analyze</code> catches common misconfigurations (missing destination rules, conflicting virtual services) before they bite.</p>',
      try: [
        ['📖 Istio — Debugging Envoy and Istiod', 'https://istio.io/latest/docs/ops/diagnostic-tools/proxy-cmd/', 'o'],
        ['☸️ Ch 6 — ingress traffic still needs a Gateway in front of the mesh', '#ch6', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'Flipping mTLS to STRICT before every       Use PERMISSIVE during migration; verify 100% sidecar\n' +
      '  workload has a sidecar                    coverage via metrics before enforcing STRICT.\n' +
      'Assuming injection = automatically          Injection only happens at pod CREATE time (via webhook) —\n' +
      '  applied to already-running pods            existing pods need a rollout restart after labeling.\n' +
      'Treating the mesh as a silver bullet for    A mesh manages the NETWORK path; it cannot fix an app-level\n' +
      '  app-level reliability bugs                 bug (bad retry logic in code, no timeout on a slow query).\n' +
      'No resource requests/limits on the           Sidecars add real CPU/memory per pod — at scale, un-sized\n' +
      '  sidecar proxy itself                        sidecars silently eat a large share of cluster capacity.\n' +
      'Running a mesh control plane with no        istiod/linkerd-control-plane going down does not usually\n' +
      '  understanding of its own blast radius       drop existing connections, but breaks new config pushes —\n' +
      '                                              know that distinction before you panic during an outage.\n' +
      'Canary via traffic-splitting with no          Splitting traffic without watching error rate/latency per\n' +
      '  observability wired to the subsets           subset defeats the purpose — pair it with per-version metrics.</code></pre>' +
      '<p><b>The real test:</b> kill the mesh control plane pod. Existing service-to-service traffic should keep flowing (proxies cache their last-known ' +
      'config) — if it drops instantly, the mesh is architected as a single point of failure in the data path, not the control path.</p>',
      try: [
        ['📖 Istio — Canary Deployments', 'https://istio.io/latest/blog/2017/0.1-canary/', 'o'],
        ['☸️ Ch 9 — sidecar resource overhead feeds directly into autoscaling sizing', '#ch9', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>The expert framing for a service mesh: it separates the <b>data plane</b> (per-pod Envoy/linkerd2-proxy — must stay up for existing ' +
      'traffic even if the control plane is unreachable) from the <b>control plane</b> (istiod/linkerd-control-plane — pushes new config, is a control-path ' +
      'dependency, not a data-path one). Deciding whether to adopt a mesh at all is a cost/benefit call: real mTLS, retries, and observability for free, ' +
      'against real operational complexity and per-pod resource overhead — many teams get 80% of the value from simpler tools (cert-manager for TLS, ' +
      'app-level retry libraries) before a full mesh is justified.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: What is the difference between a mesh\'s data plane and control plane, and why does that distinction matter\n' +
      '   operationally?\n' +
      'A: Data plane = the per-pod sidecar proxies actually carrying traffic; control plane = the component\n' +
      "   (istiod, etc.) pushing config to them. If the control plane goes down, EXISTING traffic keeps flowing\n" +
      '   (proxies cache last-known config) but new config changes stop propagating — a control plane outage is\n' +
      '   much less severe than a data plane outage.\n\n' +
      'Q: Why should mTLS be rolled out as PERMISSIVE before STRICT?\n' +
      'A: PERMISSIVE accepts both plaintext and mTLS, letting un-injected workloads keep working during a\n' +
      '   gradual sidecar rollout. Flipping straight to STRICT before every workload has a sidecar breaks\n' +
      '   connectivity to anything not yet injected — a self-inflicted outage.\n\n' +
      'Q: A pod was labeled for injection but has no sidecar. Why, and what fixes it?\n' +
      "A: Injection happens via a mutating webhook at pod CREATE time — labeling a namespace does not retroactively\n" +
      '   inject already-running pods. Fix: roll the deployment (delete/recreate pods) after labeling, and verify\n' +
      '   the injection webhook itself is healthy.\n\n' +
      'Q: When is adopting a full service mesh NOT worth it?\n' +
      'A: When the org only needs one or two mesh features (e.g. just mTLS, or just retries) — those can often be\n' +
      "   solved more cheaply with cert-manager + NetworkPolicy or app-level retry libraries. A mesh's operational\n" +
      '   overhead (sidecar resource cost, upgrade complexity, new failure modes) is a real cost to weigh.\n\n' +
      'Q: How do you debug "service A can\'t reach service B" in a meshed cluster?\n' +
      'A: Check both pods have the sidecar container present; check PeerAuthentication/mTLS mode compatibility;\n' +
      '   check AuthorizationPolicy is not denying the call; use istioctl proxy-status/analyze and sidecar\n' +
      '   access logs before assuming it is an application bug.</code></pre>',
      try: [
        ['📖 Istio — Architecture (data plane vs control plane)', 'https://istio.io/latest/docs/ops/deployment/architecture/', 'o'],
        ['☸️ Ch 16 — where a mesh fits (or does not) in a reference architecture', '#ch16', 'o']
      ] }
  ],

  quiz: [
    { q: 'What is the practical difference between a service mesh\'s data plane and control plane?',
      opts: [
        'They are the same thing with different names',
        'The data plane (sidecar proxies) carries actual traffic and keeps working if the control plane is briefly unreachable; the control plane pushes new configuration',
        'The control plane carries traffic; the data plane only stores logs',
        'Only Istio has a control plane, Linkerd does not'],
      ok: 1,
      why: 'Sidecars cache their last-known config and keep routing existing traffic even during a control-plane outage — only new config pushes are affected.' },
    { q: 'Why should mesh-wide mTLS be rolled out in PERMISSIVE mode before switching to STRICT?',
      opts: [
        'PERMISSIVE is faster',
        'PERMISSIVE accepts both plaintext and mTLS, so workloads that do not yet have a sidecar injected keep working during a gradual rollout — STRICT too early breaks them',
        'STRICT mode does not actually enforce encryption',
        'There is no difference between the two modes'],
      ok: 1,
      why: 'Flipping straight to STRICT before every workload has a sidecar cuts off connectivity to any un-injected pod, causing a self-inflicted outage.' },
    { q: 'A namespace is labeled for sidecar injection, but an already-running pod in it still has no sidecar. Why?',
      opts: [
        'Injection is broken',
        'Injection happens via a mutating webhook only at pod creation time — existing pods need to be recreated (e.g. a rollout restart) after labeling',
        'The pod needs a different image',
        'Sidecar injection requires disabling RBAC'],
      ok: 1,
      why: 'Labeling a namespace does not retroactively inject running pods; only pods created after the label (and with the webhook healthy) get a sidecar.' }
  ]
};
