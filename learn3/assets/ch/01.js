/* DevOps-Infra Learn — Part 3 · Chapter 1: CRDs & the Kubernetes API Machinery */
window.CH[1] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>Every <code>kubectl apply</code> — a Pod, a Deployment, a Service — hits the same API server and gets stored the same way. A ' +
      '<b>CustomResourceDefinition (CRD)</b> teaches the API server a brand-new resource type: <code>kubectl get certificates</code> or ' +
      '<code>kubectl get argocd-applications</code> work exactly like <code>kubectl get pods</code>, because under the hood they ARE the same ' +
      'mechanism. This is the trick behind almost every platform tool you will use in this part.</p>' +
      '<pre><code>built-in     Pod, Deployment, Service          — shipped with Kubernetes itself\n' +
      'custom       Certificate, Application, VirtualService  — added by a CRD, behave IDENTICALLY to built-ins</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>Adding a new form to a government office\'s filing system.</b> The office already ' +
      'knows how to receive, store, validate, and retrieve "passport application" forms. A CRD is registering a brand-new form type — "solar panel ' +
      'permit" — and the SAME clerks, filing cabinets, and retrieval process now handle it too, with no new office built.</p></div>',
      try: [
        ['📖 Kubernetes — Custom Resources', 'https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/', 'o'],
        ['⚙️ Part 1: Kubernetes architecture — the control loop', '../learn/#ch4', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code># the CRD itself — teaches the API server the new type "Certificate"\n' +
      'apiVersion: apiextensions.k8s.io/v1\n' +
      'kind: CustomResourceDefinition\n' +
      'metadata: { name: certificates.cert-manager.io }\n' +
      'spec:\n' +
      '  group: cert-manager.io\n' +
      '  names: { kind: Certificate, plural: certificates }\n' +
      '  scope: Namespaced\n' +
      '  versions: [{ name: v1, served: true, storage: true, schema: {...} }]   # OpenAPI schema = validation\n\n' +
      '# an INSTANCE of that type — a normal-looking manifest, once the CRD above exists\n' +
      'apiVersion: cert-manager.io/v1\n' +
      'kind: Certificate\n' +
      'metadata: { name: my-cert }\n' +
      'spec: { secretName: my-cert-tls, dnsNames: [example.com], issuerRef: { name: letsencrypt } }</code></pre>' +
      '<p>By itself, a CRD only gets you <b>storage + validation + kubectl support</b> for the new type — nothing happens when you create one. ' +
      'The thing that actually DOES something is a <b>controller/operator</b> (Ch 2) watching that type and acting on it.</p>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>CRDs are defined with the standard <code>apiextensions.k8s.io/v1</code> API, ' +
      'with OpenAPI v3 schema validation built in. You almost never hand-write a CRD from scratch — tools like ' +
      '<b>kubebuilder</b> / <b>Operator SDK</b> generate the CRD YAML from a typed Go struct, and <b>Helm</b>/<b>Kustomize</b> install CRDs as part ' +
      'of a chart\'s bootstrap. You install and consume standard CRDs (cert-manager, Argo CD, Prometheus Operator) far more often than you author one.</p></div>',
      try: [
        ['📖 kubebuilder — CRD generation from Go types', 'https://book.kubebuilder.io/cronjob-tutorial/gvks.html', 'o'],
        ['📖 cert-manager — CRD reference', 'https://cert-manager.io/docs/reference/api-docs/', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>"kubectl get" returns nothing but the resource exists.</b> ' +
      'A teammate applies a <code>VirtualService</code> manifest, no error, but <code>kubectl get virtualservices</code> says "the server doesn\'t ' +
      'have a resource type virtualservices" — the Istio CRDs were never installed on this cluster (a fresh dev cluster, missing the mesh install ' +
      'step). Fix: <code>kubectl get crds | grep istio</code> confirms it; installing the Istio CRDs (part of <code>istioctl install</code>) resolves ' +
      'it. Lesson: a CRD not existing looks like a typo, not a missing dependency — always check <code>kubectl get crds</code> first.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The CRD upgrade that broke every existing resource.</b> ' +
      'A platform team upgrades cert-manager, which ships a new CRD version with a changed schema — every existing <code>Certificate</code> object ' +
      'suddenly fails OpenAPI validation on the next controller reconcile. Fix: CRDs support <b>multiple served versions with conversion webhooks</b>; ' +
      'a well-behaved upgrade adds the new version alongside the old and converts between them, rather than breaking existing objects. ' +
      'Always read a CRD-shipping tool\'s upgrade notes for "breaking schema change" before bumping it in production.</p></div>' +
      '<p><b>Reading an unfamiliar CRD fast:</b> <code>kubectl explain certificate.spec</code> walks the OpenAPI schema like built-in docs; ' +
      '<code>kubectl get certificate my-cert -o yaml</code> shows both <code>spec</code> (what you asked for) and <code>status</code> (what the ' +
      'controller observed) — status is where you look when something is not working.</p>',
      try: [
        ['📖 Kubernetes — CRD versioning & conversion', 'https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definition-versioning/', 'o'],
        ['☸️ Ch 2 — the reconcile loop that acts on a CRD', '#ch2', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                          FIX\n' +
      'Assuming "kubectl get X" failure       kubectl get crds FIRST. A missing CRD reads exactly like a\n' +
      '  means a typo                          typo, and is a far more common cause on a fresh cluster.\n' +
      'Upgrading a CRD-shipping tool blind      Read the upgrade notes for schema/breaking changes; use\n' +
      '                                       conversion webhooks for a safe multi-version rollout.\n' +
      'Only reading .spec, ignoring .status     .status is where the CONTROLLER reports what actually\n' +
      '                                       happened — that is where a stuck/failed resource shows why.\n' +
      'Hand-writing a large CRD schema by hand   Generate it (kubebuilder/Operator SDK from typed structs) —\n' +
      '                                       hand-maintained OpenAPI schemas drift and get validation wrong.\n' +
      'Treating a CRD as "just YAML"            It is a real API type: it has RBAC implications (who can\n' +
      '                                       create/read it), admission webhooks can validate/mutate it,\n' +
      '                                       and it is watchable/list-able like any built-in.\n' +
      'No RBAC scoping for a new CRD            Just like Pods, define who can create/edit/delete instances\n' +
      '                                       of the new type — a CRD with no RBAC is wide open by default.</code></pre>' +
      '<p><b>The unifying idea for this whole part:</b> Helm charts install CRDs, GitOps controllers reconcile CRD instances, admission controllers ' +
      'validate them, and operators act on them — nearly every platform tool in Parts 3 is "a CRD + a controller watching it."</p>',
      try: [
        ['📖 Kubernetes — API Concepts (watch, list, resourceVersion)', 'https://kubernetes.io/docs/reference/using-api/api-concepts/', 'o'],
        ['☸️ Ch 8 — admission control validating a CRD instance', '#ch8', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, understand that the Kubernetes API server is a generic, declarative <b>resource store with a watch API</b> — and a CRD is ' +
      'nothing more than registering a new (group, version, kind) tuple against that store, with an OpenAPI schema for validation. Everything else — ' +
      'RBAC, <code>kubectl</code> support, <code>watch</code>/list semantics, admission webhooks — comes for free because the machinery does not care ' +
      'whether the type is built-in or custom.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: What does a CRD actually give you, and what does it NOT give you?\n' +
      'A: Storage, validation (OpenAPI schema), and full kubectl/API support for a new resource type — exactly\n' +
      '   like a built-in. It gives you NOTHING behavioural: creating a custom object does nothing by itself\n' +
      '   until a controller is watching that type and reconciling it.\n\n' +
      'Q: "kubectl get widgets" says the server has no such resource type. First two things to check?\n' +
      'A: `kubectl get crds | grep widget` (is the CRD installed at all?), then check you are in the right\n' +
      "   API group/version if it IS installed but under a different apiVersion than you expected.\n\n" +
      'Q: How do you safely evolve a CRD\'s schema without breaking every existing object?\n' +
      'A: Add a new served API version alongside the old one, with a conversion webhook translating between\n' +
      '   them, so existing stored objects keep validating and old + new clients both keep working during the\n' +
      '   migration window.\n\n' +
      'Q: Where do you look when a custom resource "isn\'t working" but was applied successfully?\n' +
      'A: `.status` on the object — the controller writes its observed state, conditions, and errors there.\n' +
      '   `.spec` is only what you asked for; `.status` is what actually happened.\n\n' +
      'Q: Why is "kubectl works the same for custom and built-in resources" the key insight of this chapter?\n' +
      'A: Because it means every skill you already have (kubectl get/describe/edit, RBAC, watch, admission\n' +
      '   control) transfers directly to any platform tool built on CRDs — you are not learning N new tools,\n' +
      '   you are learning one mechanism applied N times.</code></pre>',
      try: [
        ['📖 Kubernetes — Extending the Kubernetes API', 'https://kubernetes.io/docs/concepts/extend-kubernetes/', 'o'],
        ['☸️ Ch 16 — the platform team\'s Kubernetes reference architecture', '#ch16', 'o']
      ] }
  ],

  quiz: [
    { q: 'What does installing a CustomResourceDefinition (CRD) actually give you?',
      opts: [
        'A running controller that automatically manages the new resource',
        'Storage, OpenAPI schema validation, and full kubectl/API support for a new resource type — identical to a built-in type, but with no behaviour until a controller watches it',
        'A new namespace dedicated to the resource',
        'Automatic Helm chart generation'],
      ok: 1,
      why: 'A CRD only teaches the API server about a new type. Nothing happens when an instance is created until a separate controller/operator reconciles it.' },
    { q: '`kubectl get widgets` fails with "the server doesn\'t have a resource type". What should you check first?',
      opts: [
        'Restart the cluster',
        '`kubectl get crds` to confirm the CRD is actually installed — a missing CRD produces exactly this error and is easy to mistake for a typo',
        'Increase your RBAC permissions',
        'Reinstall kubectl'],
      ok: 1,
      why: 'This error commonly means the CRD (and often the whole controller/tool that ships it) was never installed on this cluster, not that the command is wrong.' },
    { q: 'A CRD-shipping tool ships a new, incompatible schema version. How do you upgrade without breaking existing objects?',
      opts: [
        'Delete and recreate every existing object',
        'Add the new API version alongside the old one with a conversion webhook, so existing stored objects and both old/new clients keep working during the migration',
        'Just apply the new CRD and hope for the best',
        'Downgrade Kubernetes instead'],
      ok: 1,
      why: 'Multi-version CRDs with conversion webhooks let a schema evolve without invalidating objects already stored under the old schema.' }
  ]
};
