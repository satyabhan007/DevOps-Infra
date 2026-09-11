/* DevOps-Infra Learn — Part 2 · Chapter 15: Debugging a Broken Apply — a Live Walkthrough */
window.CH[15] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>2:14pm, a routine PR merges: bumping an RDS parameter group and adding two read replicas. CI runs <code>apply</code>. At resource 7 of 12, ' +
      'it fails: <code>Error: error modifying DB instance: InvalidParameterCombination: You cannot change... while instance is not in "available" ' +
      'state</code>. Apply halts. Five resources applied, seven did not. The state file now reflects a PARTIAL reality — and the on-call engineer has ' +
      'to figure out what is actually true before touching anything else.</p>' +
      '<pre><code>plan: 12 resources to add/change\n' +
      'apply: [1..5] ok, [6] fail, [7..12] never attempted   → state = 5 applied + whatever [6] partially did</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A surgery interrupted mid-procedure.</b> ' +
      'You do not just walk away, and you do not blindly restart from step one — you first establish exactly what has and has not been done, whether ' +
      'anything is in an unsafe intermediate state, and only then decide the next safe step.</p></div>',
      try: [
        ['📖 Terraform — debugging', 'https://developer.hashicorp.com/terraform/internals/debugging', 'o'],
        ['🩹 Ch 9 — import, refactor & state surgery', '#ch9', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<p>Step 1, always: figure out what state ACTUALLY reflects vs. what really exists, without applying anything yet:</p>' +
      '<pre><code>$ terraform show                          # what does state currently believe exists?\n' +
      '$ terraform plan                          # does a fresh plan match expectations, or show something\n' +
      '                                           #   unexpected (a partially-modified resource, a stuck lock)?\n' +
      '$ aws rds describe-db-instances --db-instance-identifier prod-db \\\n' +
      '    --query \'DBInstances[0].DBInstanceStatus\'    # cross-check the REAL resource\'s actual status\n\n' +
      '# in this incident: the RDS instance was stuck in "modifying" — the parameter-group change and the\n' +
      '# replica creation were both queued by AWS and collided; state showed the instance updated, reality\n' +
      '# showed it still transitioning.</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>Enable <b>TF_LOG=trace</b> (or <code>debug</code>) BEFORE re-running anything ' +
      'when a failure is unclear — it captures the exact provider API request/response, which is often the only way to distinguish "Terraform bug", ' +
      '"provider bug", or "the cloud API genuinely rejected this combination" (the ' +
      '<b>HashiCorp debugging guide</b> is the canonical reference for reading that output).</p></div>',
      try: [
        ['📖 Terraform — TF_LOG debugging', 'https://developer.hashicorp.com/terraform/internals/debugging', 'o'],
        ['📖 AWS — RDS instance status reference', 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/accessing-monitoring.html', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The retry that made it worse.</b> ' +
      'The on-call engineer\'s first instinct is to just re-run <code>terraform apply</code> immediately. Because the RDS instance is still ' +
      '"modifying" from the first attempt, the second apply ALSO fails with the same error, but this time Terraform\'s state update for a DIFFERENT, ' +
      'unrelated resource in the same apply gets interrupted by the failure, widening the partial-apply blast radius from one broken resource to two. ' +
      'Fix: the first move after any failed apply is diagnosis, not retry — confirm the REAL resource\'s state (here: wait for RDS to reach ' +
      '"available") before touching Terraform again; a retry against a resource still mid-transition just repeats the same failure, possibly against ' +
      'a wider blast radius.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The state/reality mismatch after manual intervention.</b> ' +
      'Once RDS reaches "available", the engineer manually removes one of the two read replicas via the console to reduce risk before retrying ' +
      'Terraform — a reasonable instinct, but now state and reality disagree in a NEW way (state still expects both replicas). The next ' +
      '<code>plan</code> shows a confusing mix of "create" for the replica that still needs making and no mention of the one manually removed. Fix: ' +
      'after ANY manual intervention during an incident, run <code>terraform plan</code> immediately and read it carefully before applying — it is ' +
      'the fastest way to see exactly how reality now differs from what Terraform believes, and to decide whether an import/state adjustment (Ch 9) is ' +
      'needed before a normal apply is safe again.</p></div>',
      try: [
        ['🌊 Ch 3 — managing drift at scale', '#ch3', 'o'],
        ['🩹 Ch 9 — import, refactor & state surgery', '#ch9', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX (what actually happened, resolved)\n' +
      'Immediately re-running apply after a        Diagnose first: `terraform show` + a cloud-native describe call\n' +
      '  failure, no diagnosis                       to confirm the REAL resource\'s actual current status.\n' +
      'Assuming the error message is the whole      TF_LOG=trace showed the actual API rejection: AWS queues RDS\n' +
      '  story                                       modifications serially per-instance — the parameter-group\n' +
      '                                            change and replica creation collided because both were fired\n' +
      '                                            in the same apply without an explicit dependency between them.\n' +
      'No explicit ordering between the two         Root cause: missing `depends_on` between the parameter-group\n' +
      '  RDS operations that needed to be serial      modification and the replica resources — Terraform applied\n' +
      '                                            them in parallel since nothing told it they had to be serial.\n' +
      'Manual console fix during the incident       Removing a replica by hand caused a NEW state/reality mismatch\n' +
      '  with no plan/import follow-up                — required `terraform plan` review + a `moved`/import\n' +
      '                                            reconciliation (Ch 9) before the pipeline could be trusted again.\n' +
      'No postmortem action on the root cause       Fix added: `depends_on = [aws_db_instance.main]` on the replica\n' +
      '                                            resources + a test (Ch 6) asserting the plan always serializes\n' +
      '                                            these two operations, so the same collision cannot recur.</code></pre>' +
      '<p><b>The real test, applied to this incident:</b> the team could show — post-mortem — the EXACT provider API call that failed, the EXACT ' +
      'root cause (missing explicit ordering), and a test that would have caught it before merge. That is what "resolved", not just "unblocked", ' +
      'looks like.</p>',
      try: [
        ['📖 Terraform — depends_on', 'https://developer.hashicorp.com/terraform/language/meta-arguments/depends_on', 'o'],
        ['🧪 Ch 6 — testing infrastructure code', '#ch6', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>Full timeline, synthesized: <b>2:14pm</b> apply fails at resource 7/12 (RDS parameter-group change colliding with concurrent replica ' +
      'creation — AWS serializes modifications per-instance, Terraform had applied both in the same wave with no explicit ordering). <b>2:17pm</b> a ' +
      'reflexive retry fails identically and briefly widens the blast radius. <b>2:25pm</b> diagnosis via <code>terraform show</code> + ' +
      '<code>aws rds describe-db-instances</code> confirms the instance is still "modifying" — the fix is to WAIT, not retry. <b>2:40pm</b> instance ' +
      'reaches "available"; a manual console removal of one replica (to reduce risk) creates a fresh state/reality mismatch. <b>2:45pm</b> ' +
      '<code>terraform plan</code> read carefully shows exactly that mismatch; a targeted <code>import</code>/<code>moved</code> reconciliation (Ch 9) ' +
      'realigns state before the pipeline resumes normal operation. <b>3:10pm</b> apply completes cleanly. <b>Next day</b>: postmortem adds an ' +
      'explicit <code>depends_on</code> between the two RDS operations and a <code>terraform test</code> (Ch 6) asserting they always serialize — the ' +
      'actual root-cause fix, not just the incident recovery.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: An apply fails partway through a multi-resource change. What is your FIRST action?\n' +
      "A: Diagnose before touching anything — `terraform show` plus a direct cloud-API check of the real\n" +
      "   resource's actual status. Retrying immediately without knowing why it failed risks repeating the\n" +
      '   failure or widening the blast radius.\n\n' +
      'Q: Why did applying a parameter-group change and creating read replicas in the same apply cause a collision here?\n' +
      'A: AWS serializes RDS modifications per-instance, but nothing in the Terraform config told it these two\n' +
      '   operations had to be ORDERED — Terraform applied them in parallel by default since no dependency\n' +
      '   (explicit or via a referenced attribute) existed between the two resources.\n\n' +
      'Q: After a manual console fix during an incident, what is the very next Terraform command to run, and why?\n' +
      'A: `terraform plan` — read carefully. It is the fastest way to see exactly how the manual change now\n' +
      "   differs from what Terraform's state believes, and whether an import/moved-block reconciliation is\n" +
      '   needed before it is safe to apply normally again.\n\n' +
      'Q: What distinguishes "the incident is unblocked" from "the incident is resolved"?\n' +
      'A: Unblocked means the immediate apply succeeded. Resolved means the ROOT CAUSE (missing depends_on) is\n' +
      '   fixed in code and a test now guards against the same collision recurring — recovery alone leaves the\n' +
      '   same landmine for the next similar change.\n\n' +
      'Q: What tool/flag gives you the ground truth when a provider error message alone is ambiguous?\n' +
      'A: TF_LOG=trace (or debug) captures the actual API request/response Terraform sent and received —\n' +
      '   distinguishing a genuine cloud-API rejection from a Terraform- or provider-level bug, which the\n' +
      '   surface error message often cannot do alone.</code></pre>',
      try: [
        ['📖 HashiCorp — debugging Terraform', 'https://developer.hashicorp.com/terraform/internals/debugging', 'o'],
        ['🗺️ Ch 16 — IaC platform reference architecture', '#ch16', 'o']
      ] }
  ],

  quiz: [
    { q: 'A `terraform apply` fails partway through applying 12 resources. What should you do FIRST?',
      opts: [
        'Immediately re-run terraform apply to retry the failed resource',
        'Diagnose what actually happened first — check `terraform show` and the real resource\'s status via the cloud provider directly, before touching anything further',
        'Delete the state file and start over from scratch',
        'Roll back to the previous git commit and force-push'],
      ok: 1,
      why: 'Retrying without understanding the failure risks repeating it or widening the blast radius, especially if the underlying resource is still mid-transition.' },
    { q: 'In the case-study incident, why did the RDS parameter-group change and read-replica creation collide when applied together?',
      opts: [
        'Terraform does not support RDS read replicas',
        'AWS serializes modifications per-instance, but no explicit dependency (depends_on) told Terraform these two operations needed to be ordered, so they were attempted in parallel',
        'The state file was corrupted before the apply started',
        'The AWS provider version was too old to support parameter groups'],
      ok: 1,
      why: 'Without an explicit ordering dependency, Terraform applied both RDS operations concurrently, colliding with AWS\'s per-instance serialization of modifications.' },
    { q: 'What distinguishes an incident being "resolved" from merely being "unblocked" in this case study?',
      opts: [
        'Resolved means the apply eventually succeeded, nothing more',
        'Resolved means the root cause (missing depends_on) was fixed in code and a test now guards against recurrence — not just that the immediate apply was pushed through',
        'There is no meaningful difference between the two',
        'Resolved means the state file was deleted and recreated'],
      ok: 1,
      why: 'Getting the apply to succeed unblocks the immediate incident; fixing the underlying missing dependency and adding a regression test actually resolves the root cause.' }
  ]
};
