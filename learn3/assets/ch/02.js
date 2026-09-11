/* DevOps-Infra Learn — Part 3 · Chapter 2: Building Operators — the Reconcile Loop */
window.CH[2] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>A <b>controller</b> (the code behind an operator) never "executes a command." It only ever does one thing, forever: look at what you ' +
      '<i>asked for</i> (spec), look at what <i>actually exists</i> (observed state), and take one small step to close the gap. Then it does it again. ' +
      'This is the <b>reconcile loop</b>, and it is the single idea behind the Deployment controller, the Job controller, and every custom operator ' +
      '(cert-manager, Argo CD, Prometheus Operator) you will use in this part.</p>' +
      '<pre><code>desired: replicas = 3        observed: 2 pods running   -&gt;  create 1 pod\n' +
      'desired: replicas = 3        observed: 3 pods running   -&gt;  do nothing, loop again later</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A thermostat, not a light switch.</b> A light switch is one command that runs ' +
      'once. A thermostat is told "keep it at 21°C" and then checks the temperature forever, nudging the heater on or off — it never "finishes," it ' +
      'just keeps converging. Every Kubernetes controller is a thermostat, not a light switch.</p></div>',
      try: [
        ['📖 Kubernetes — Controllers concept', 'https://kubernetes.io/docs/concepts/architecture/controller/', 'o'],
        ['☸️ Ch 1 — CRDs give a controller something to watch', '#ch1', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code>// pseudocode of every reconcile loop, including kubebuilder-generated ones\n' +
      'func Reconcile(req ctrl.Request) (ctrl.Result, error) {\n' +
      '  obj := &amp;MyType{}\n' +
      '  client.Get(req.NamespacedName, obj)         // 1. read the desired state (spec)\n' +
      '  current := inspectRealWorld(obj)             // 2. read the observed state (e.g. list Pods)\n' +
      '  if current != obj.Spec {                     // 3. diff\n' +
      '    applyOneStepTowardDesired(obj, current)     // 4. converge — NOT "do everything at once"\n' +
      '  }\n' +
      '  obj.Status.Conditions = observedConditions    // 5. write status back — this is what kubectl describe shows\n' +
      '  client.Status().Update(obj)\n' +
      '  return ctrl.Result{RequeueAfter: 30*time.Second}, nil   // 6. come back and check again\n' +
      '}</code></pre>' +
      '<p>Reconcile is triggered by a <b>watch</b> event (someone changed the object) or a periodic <b>resync</b> — never trust a single trigger; a ' +
      'well-built controller must be safe to call the same reconcile twice with no bad side effects (<b>idempotent</b>).</p>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>Hand-rolling a client-go controller from scratch is rare now. ' +
      '<b>kubebuilder</b> and the <b>Operator SDK</b> are the standard scaffolds: they generate the CRD, the RBAC, the manager boilerplate, and a typed ' +
      '<code>Reconcile()</code> stub, so you write only the convergence logic.</p></div>',
      try: [
        ['📖 kubebuilder — Quick Start', 'https://book.kubebuilder.io/quick-start.html', 'o'],
        ['📖 Kubernetes — Operator pattern', 'https://kubernetes.io/docs/concepts/extend-kubernetes/operator/', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The reconcile loop that fights itself (a "hot loop").</b> ' +
      'A custom operator updates <code>.status</code> on every reconcile, but the status update itself triggers a new watch event, which triggers ' +
      'another reconcile, which updates status again — CPU on the controller pod pegs at 100% and the API server logs fill with writes. Fix: use ' +
      '<code>UpdateStatus</code> only when the computed status actually changed (compare before writing), and set a sane ' +
      '<code>RequeueAfter</code> instead of requeuing immediately on every event.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>A stuck reconcile with no error anywhere.</b> ' +
      'An operator that provisions cloud resources (e.g. an RDS instance via a CRD) leaves an object stuck "Provisioning" forever — no error in ' +
      'controller logs, no events on the object. Root cause: the reconcile function returned <code>nil</code> error after an early exit it thought ' +
      'was "waiting," but the requeue was never scheduled, so it silently stopped being reconciled at all. Fix: always return either an error ' +
      '(triggers backoff+retry) or an explicit <code>RequeueAfter</code> — never a bare "do nothing" exit.</p></div>' +
      '<p><b>Debugging fast:</b> <code>kubectl logs -n &lt;operator-ns&gt; deploy/&lt;operator&gt;</code> for reconcile errors, and ' +
      '<code>kubectl describe &lt;kind&gt; &lt;name&gt;</code> — Events at the bottom often show exactly which reconcile step failed.</p>',
      try: [
        ['📖 kubebuilder — Controller reconciliation', 'https://book.kubebuilder.io/cronjob-tutorial/controller-implementation.html', 'o'],
        ['☸️ Ch 4 — Argo CD is a reconcile loop over Git, not a pipeline', '#ch4', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                            FIX\n' +
      'Reconcile does everything in one pass,    Converge ONE step per call and requeue — a partial failure\n' +
      '  no partial-progress handling             mid-pass should leave the object in a recoverable state.\n' +
      'Reconcile is not idempotent (assumes       Design every step so calling it twice with identical inputs\n' +
      '  "this is the first time")                 is a no-op the second time — watch/resync guarantees repeats.\n' +
      'Writing .status on every single reconcile   Diff the computed status against current before writing —\n' +
      '  even when nothing changed                 avoids self-triggered watch storms and needless API writes.\n' +
      'Swallowing errors, returning nil             Return the error so client-go\'s exponential backoff retries\n' +
      '  from a failed step                         it; a silently-nil\'d error means the object rots unreconciled.\n' +
      'No RBAC scoping on the operator\'s            An operator\'s ServiceAccount should only get verbs on the\n' +
      '  ServiceAccount (cluster-admin by default)  kinds it actually reconciles — a compromised operator pod\n' +
      '                                             with cluster-admin is a cluster-wide compromise.\n' +
      'Long-running blocking calls inside            A slow external API call inside Reconcile blocks the whole\n' +
      '  Reconcile() with no timeout                 worker; always pass a context with a deadline.</code></pre>' +
      '<p><b>The real test:</b> kill the operator pod mid-reconcile and restart it — a correct operator picks up exactly where the observed state ' +
      'says it should, with no manual cleanup. If it cannot, the loop was not actually idempotent.</p>',
      try: [
        ['📖 client-go — workqueue &amp; rate limiting', 'https://pkg.go.dev/k8s.io/client-go/util/workqueue', 'o'],
        ['☸️ Ch 8 — admission webhooks vs reconcile loops, when to use which', '#ch8', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, the reconcile loop is best understood as <b>level-triggered, not edge-triggered</b> control: the controller never cares ' +
      '"what changed since last time," only "given the current state, what is the gap to desired." This is what makes Kubernetes controllers resilient ' +
      'to missed events, controller restarts, and out-of-order updates — something an edge-triggered ("on create, do X; on delete, do Y") design cannot ' +
      'offer. Designing a new operator is really designing what the minimal safe convergence step is at every possible observed state.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: What does "level-triggered" mean, and why do Kubernetes controllers use it instead of edge-triggered events?\n' +
      'A: Level-triggered means the controller reacts to CURRENT state, not to the specific event that changed it.\n' +
      '   That makes it safe to miss events, restart the controller, or process events out of order — it just\n' +
      "   re-derives the gap from current state and converges again. Edge-triggered logic can't recover from a\n" +
      '   missed event without extra bookkeeping.\n\n' +
      'Q: Why must Reconcile() be idempotent?\n' +
      'A: Because watches/resyncs guarantee the same object will be reconciled multiple times, including after\n' +
      '   a crash mid-step. If calling it twice with the same input produces different results, the controller\n' +
      "   can't safely retry, and a crash mid-reconcile leaves inconsistent state.\n\n" +
      'Q: An operator pod restarts mid-provisioning. What should happen?\n' +
      'A: On restart it lists/watches all objects of its type again and reconciles each from its CURRENT status/\n' +
      "   spec — it does not need to remember what it was doing, because state lives in the API object, not in\n" +
      "   the controller's memory.\n\n" +
      'Q: When should an operator use a mutating/validating admission webhook instead of just reconciling?\n' +
      'A: Admission webhooks intercept BEFORE the object is persisted (fast, synchronous, can reject outright).\n' +
      '   Reconcile runs AFTER persistence, asynchronously. Use a webhook for "must be valid to exist at all,"\n' +
      '   and reconcile for "converge the world to match this valid object over time."\n\n' +
      'Q: How do you prevent a custom operator from becoming a cluster-wide blast radius?\n' +
      "A: Scope its ServiceAccount's RBAC to exactly the kinds/verbs/namespaces it reconciles (never cluster-\n" +
      '   admin), run it with resource limits, and treat its own container image and supply chain with the same\n' +
      '   scrutiny as any privileged workload — a compromised operator has real API-server credentials.</code></pre>',
      try: [
        ['📖 Kubernetes — API Concepts: watch semantics', 'https://kubernetes.io/docs/reference/using-api/api-concepts/#efficient-detection-of-changes', 'o'],
        ['☸️ Ch 16 — where operators fit in the platform reference architecture', '#ch16', 'o']
      ] }
  ],

  quiz: [
    { q: 'What is the "reconcile loop" that every Kubernetes controller runs?',
      opts: [
        'A one-time script that runs when a resource is created',
        'A loop that continuously compares desired state (spec) to observed state and takes one small step to close the gap, then repeats',
        'A cron job that restarts failed pods',
        'A webhook that blocks bad API requests'],
      ok: 1,
      why: 'Reconcile is level-triggered and continuous — it never "finishes," it keeps converging observed state toward desired state.' },
    { q: 'Why must a controller\'s Reconcile() function be idempotent?',
      opts: [
        'To make it run faster',
        'Because watches and periodic resyncs guarantee it will be called repeatedly, including after a crash mid-step — calling it twice must be safe',
        'To reduce the number of CRDs needed',
        'Idempotency is not actually required in Kubernetes controllers'],
      ok: 1,
      why: 'Kubernetes gives no guarantee reconcile runs exactly once; it must safely handle being called multiple times with the same input.' },
    { q: 'An operator ships with a ServiceAccount bound to cluster-admin. Why is this a problem?',
      opts: [
        'It has no effect on security',
        'A compromised operator pod would have full cluster-wide API access far beyond the kinds it actually reconciles — RBAC should be scoped tightly',
        'cluster-admin is required for any CRD to function',
        'It only affects billing, not security'],
      ok: 1,
      why: 'Operators should get RBAC scoped to exactly the kinds/verbs/namespaces they reconcile; over-broad RBAC turns a compromised operator into a cluster-wide compromise.' }
  ]
};
