/* DevOps-Infra Learn — Part 3 · Chapter 15: Debugging a Cluster Incident — a Live Walkthrough */
window.CH[15] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>It is 2am. PagerDuty fires: "50% of payments-service pods are CrashLoopBackOff." Nothing about this chapter is new theory — it is every ' +
      'earlier chapter\'s debugging habit, chained together in the order a real incident actually forces on you: look at what is broken, read WHY, form ' +
      'a hypothesis, check it, fix it, verify.</p>' +
      '<pre><code>kubectl get pods -n payments            # WHAT is broken — how many, which ones, how long\n' +
      'kubectl describe pod &lt;name&gt; -n payments   # WHY — Events at the bottom, almost always\n' +
      'kubectl logs &lt;name&gt; -n payments --previous  # the crashed container\'s own last words</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A doctor\'s triage, not a guess.</b> A good ER doctor does not start treating at ' +
      'random — vitals first (what\'s actually failing), history second (what changed recently), then a targeted test to confirm before treating. ' +
      'CrashLoopBackOff triage follows the identical order: observe, narrow, confirm, THEN act.</p></div>',
      try: [
        ['📖 Kubernetes — Debug Running Pods', 'https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/', 'o'],
        ['☸️ Ch 2 — .status is where a controller reports what it actually observed', '#ch2', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code>$ kubectl get pods -n payments\n' +
      'NAME                READY   STATUS             RESTARTS   AGE\n' +
      'payments-7f9-abc12  0/1     CrashLoopBackOff   14         38m\n' +
      'payments-7f9-def34  0/1     CrashLoopBackOff   13         38m\n' +
      'payments-7f9-ghi56  1/1     Running            0          6h\n\n' +
      '$ kubectl describe pod payments-7f9-abc12 -n payments\n' +
      '... Last State: Terminated, Reason: OOMKilled, Exit Code: 137 ...\n' +
      'Events:\n' +
      '  Warning  BackOff  ...  Back-off restarting failed container\n\n' +
      '$ kubectl logs payments-7f9-abc12 -n payments --previous\n' +
      '[fatal] connection pool exhausted, waiting on DB... (last line before OOM)</code></pre>' +
      '<p>Exit code <code>137</code> = SIGKILL, almost always an OOM kill or a manual kill — this single number narrows the hypothesis space ' +
      'immediately, before reading a single log line further.</p>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>The standard triage order — <code>get</code> (breadth), <code>describe</code> ' +
      '(events/state), <code>logs --previous</code> (the crashed container\'s own output), then <code>logs</code> on a healthy sibling pod for ' +
      'comparison — surfaces the root cause in the large majority of real incidents before any deeper tooling is needed.</p></div>',
      try: [
        ['📖 Kubernetes — Pod Lifecycle &amp; Container States', 'https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/', 'o'],
        ['☸️ Ch 12 — right-sized requests/limits are exactly what prevents this class of OOM', '#ch12', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The walkthrough, start to finish.</b> Two of three replicas are ' +
      'CrashLoopBackOff; the third is fine. <code>describe</code> shows <code>OOMKilled</code>, exit 137. The last log line before crash: ' +
      '"connection pool exhausted, waiting on DB." Hypothesis: a recent deploy raised DB connection pool size per-pod, pushing memory usage over the ' +
      'unchanged 256Mi limit. Check: <code>kubectl rollout history deploy/payments -n payments</code> shows a deploy 40 minutes ago, timing matches the ' +
      'first crash exactly. Confirm: <code>kubectl get deploy payments -o yaml</code> shows the pool-size env var was bumped in that revision, ' +
      'memory limits were not. Fix: <code>kubectl rollout undo deploy/payments -n payments</code> to immediately restore service, THEN raise the ' +
      'memory limit properly and re-deploy the pool change deliberately, not as a follow-up scramble.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The red herring that wastes twenty minutes.</b> The first responder sees ' +
      '"connection pool exhausted" and assumes the DATABASE is down, spending twenty minutes checking DB health (which is fine) before noticing the ' +
      '<b>OOMKilled</b> reason sitting right there in <code>describe</code> output the whole time. Lesson: always read the FULL <code>describe</code> ' +
      'output — Last State/Reason — before diagnosing from a log line alone; the log line is the symptom the app saw, the Reason is what Kubernetes ' +
      'actually did and why.</p></div>' +
      '<p><b>The post-incident writeup:</b> timeline (deploy time, first alert, root cause found, fix applied), root cause (one sentence), the ' +
      'immediate fix (rollback), and the real fix (right-sized limits + a memory-usage regression check in CI before the next pool-size change ships).</p>',
      try: [
        ['☸️ Ch 12 — the cost-optimization habit of watching real usage would have caught this early', '#ch12', 'o'],
        ['📖 Kubernetes — Determine the Reason for Pod Failure', 'https://kubernetes.io/docs/tasks/debug/debug-application/determine-reason-pod-failure/', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'Diagnosing from a log line before          Always read `describe` Last State/Reason FIRST — it tells you\n' +
      '  reading the pod\'s actual State/Reason      WHAT Kubernetes did (OOMKilled, Error, Completed) before you\n' +
      '                                              interpret WHY the app thinks it crashed.\n' +
      'Rolling back before confirming a            A rollback with no hypothesis just moves the mystery — always\n' +
      '  hypothesis, "just in case"                  correlate the crash timing against `rollout history` first,\n' +
      '                                              or you may roll back the wrong thing and still be broken.\n' +
      'Checking only the crashed pod, never a      Comparing a crashed pod against a healthy sibling (same\n' +
      '  healthy sibling for comparison               deployment, different node) often reveals the actual\n' +
      '                                              differentiator — a node-specific resource issue, for instance.\n' +
      'No memory/CPU regression check before       A pool-size or cache-size bump is a memory-usage change in\n' +
      '  merging a config change that affects it     disguise — treat it with the same scrutiny as a code change.\n' +
      'Skipping the post-incident writeup           Without a documented root cause + real fix, the same class of\n' +
      '  once service is restored                    incident recurs — the rollback fixed the SYMPTOM, not the cause.</code></pre>' +
      '<p><b>The real test:</b> could someone who joined the team yesterday follow your triage commands, in order, and independently arrive at the same ' +
      'root cause? If the diagnosis lived only in one senior engineer\'s head, the runbook was not actually written down.</p>',
      try: [
        ['📖 Kubernetes — Troubleshooting Clusters', 'https://kubernetes.io/docs/tasks/debug/debug-cluster/', 'o'],
        ['☸️ Ch 9 — a Pending-pod incident follows a parallel but distinct triage path', '#ch9', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>The expert-level lesson of this whole chapter: a good incident responder does not know more commands than a beginner, they read ' +
      'MORE OF THE OUTPUT they already have, in the RIGHT ORDER, before forming a hypothesis. Every tool used in this walkthrough — <code>get</code>, ' +
      '<code>describe</code>, <code>logs</code>, <code>rollout history</code> — was already covered in Part 1. What makes this an "advanced" chapter is ' +
      'discipline under time pressure: resisting the urge to act on the first plausible-looking symptom before confirming it against a second, ' +
      'independent signal.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Walk me through your first three commands the moment a "pods CrashLoopBackOff" alert fires.\n' +
      "A: `kubectl get pods -n &lt;ns&gt;` for breadth (how many, how long, restart count). `kubectl describe pod\n" +
      "   &lt;name&gt;` for the Last State/Reason and Events — this alone often names the root cause (OOMKilled,\n" +
      "   liveness probe failure, ImagePullBackOff). `kubectl logs &lt;name&gt; --previous` for the crashed\n" +
      '   container\'s own last output, read AFTER already knowing the Reason from describe.\n\n' +
      'Q: What does exit code 137 tell you, and why check it before reading logs?\n' +
      'A: 137 = 128 + SIGKILL(9) — almost always an OOM kill or an explicit kill, not an application-level crash.\n' +
      "   It immediately narrows the hypothesis space (check memory limits/usage) before you spend time\n" +
      '   interpreting an application log line that may be a downstream symptom, not the cause.\n\n' +
      'Q: Why check `kubectl rollout history` before rolling back?\n' +
      'A: To correlate the crash\'s FIRST occurrence against an actual deploy timestamp — confirming a real\n' +
      '   causal link before acting, rather than rolling back reflexively and possibly reverting the wrong\n' +
      '   change while the actual cause (e.g. a node issue) persists.\n\n' +
      'Q: Why compare a crashing pod against a healthy sibling replica instead of only investigating the failing\n' +
      '   one?\n' +
      'A: The differential often reveals the real cause faster — e.g. all crashing pods share a node (a node-\n' +
      '   level issue) or share a specific input (a bad customer request hitting only certain replicas via a\n' +
      "   load balancer's hashing).\n\n" +
      'Q: What belongs in a post-incident writeup, and why does it matter beyond documentation?\n' +
      'A: Timeline, one-sentence root cause, the immediate fix (usually a rollback), and the REAL fix (e.g.\n' +
      '   right-sized limits, a CI check for memory-affecting config changes). It matters because a rollback\n' +
      '   only removes the symptom — without the real fix and a written record, the same incident recurs.</code></pre>',
      try: [
        ['📖 Kubernetes — Debugging a StatefulSet', 'https://kubernetes.io/docs/tasks/debug/debug-application/debug-statefulset/', 'o'],
        ['☸️ Ch 16 — this triage muscle is exactly what the reference architecture is built to make routine', '#ch16', 'o']
      ] }
  ],

  quiz: [
    { q: 'A pod\'s last container state shows "OOMKilled, Exit Code 137." What does this tell you before reading a single application log line?',
      opts: [
        'The application code has a syntax error',
        'The container was killed by the kernel (SIGKILL) almost certainly due to exceeding its memory limit — investigate memory usage/limits first',
        'The node itself has crashed',
        'The container image failed to pull'],
      ok: 1,
      why: 'Exit code 137 = SIGKILL, and OOMKilled as the Reason specifically points to the memory limit being exceeded — this narrows the hypothesis before logs are even read.' },
    { q: 'Why should you check `kubectl rollout history` and correlate crash timing against a deploy BEFORE rolling back?',
      opts: [
        'Rollback always works regardless of cause, so this step is unnecessary',
        'To confirm a real causal link before acting — rolling back reflexively without correlation risks reverting the wrong change while the actual cause persists',
        'rollout history is only useful after an incident is resolved',
        'This step is required by Kubernetes and has no diagnostic value'],
      ok: 1,
      why: 'Confirming the hypothesis against deploy timing avoids wasted effort and ensures the rollback actually addresses the real cause.' },
    { q: 'Why does a rollback that restores service NOT mean the incident response is complete?',
      opts: [
        'Rollback always fixes the root cause permanently',
        'A rollback removes the symptom but not necessarily the underlying cause (e.g. under-sized memory limits) — a real fix and post-incident writeup are still needed to prevent recurrence',
        'Post-incident writeups are optional busywork',
        'Once service is restored, no further action is ever needed'],
      ok: 1,
      why: 'The rollback restores service, but without identifying and fixing the real root cause (and documenting it), the same class of incident is likely to recur.' }
  ]
};
