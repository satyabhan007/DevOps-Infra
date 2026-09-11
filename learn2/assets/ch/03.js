/* DevOps-Infra Learn — Part 2 · Chapter 3: Managing Drift at Scale */
window.CH[3] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>Terraform\'s state file is a promise: "this is what I believe exists". <b>Drift</b> is when reality stops matching that promise — someone ' +
      'clicked a button in the AWS console, a security tool auto-remediated a resource, or an autoscaler changed an instance count. The state file ' +
      'does not know, and the next <code>plan</code> shows a confusing diff that looks like Terraform wants to "fix" something a human did on ' +
      'purpose.</p>' +
      '<pre><code>state says:  security_group rule = port 443 only\n' +
      'console:     someone added port 22 "just for an hour" (never removed)\n' +
      'next plan:   Terraform proposes REMOVING port 22 — is that a fix, or does it break the hotfix someone needs?</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A shared apartment blueprint vs. someone moving the couch.</b> ' +
      'The blueprint (state) says the couch is against the north wall. A roommate moves it for a party and forgets to update the blueprint. Next time ' +
      'anyone consults the blueprint to plan new furniture, it is wrong — and if someone "corrects" the room back to match the blueprint without ' +
      'asking why the couch moved, they might be undoing something that mattered.</p></div>',
      try: [
        ['📖 Terraform — refresh & drift', 'https://developer.hashicorp.com/terraform/tutorials/state/resource-drift', 'o'],
        ['🔒 Ch 2 — remote state & locking', '#ch2', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<p>Detect drift without risking an accidental apply using <b>refresh-only</b> plans, and silence expected/benign drift with ' +
      '<code>ignore_changes</code>:</p>' +
      '<pre><code># detect drift, change nothing\n' +
      '$ terraform plan -refresh-only\n' +
      '  ~ update in-place\n' +
      '    ~ ingress { from_port = 22 } # was not in config — someone added it out-of-band\n\n' +
      '# accept the drifted reality into state WITHOUT changing the resource\n' +
      '$ terraform apply -refresh-only\n\n' +
      '# tell Terraform to stop flagging a specific attribute as drift (e.g. autoscaler-managed)\n' +
      'resource "aws_autoscaling_group" "app" {\n' +
      '  desired_capacity = 3\n' +
      '  lifecycle {\n' +
      '    ignore_changes = [desired_capacity]   # the autoscaler owns this value at runtime\n' +
      '  }\n' +
      '}</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>Most platform teams run a <b>scheduled drift-detection job</b> in CI — ' +
      '<code>terraform plan -detailed-exitcode</code> nightly (exit code 2 means drift found) posting to Slack, rather than discovering drift only ' +
      'when the next real change is applied. <b>driftctl</b> (open-source) can also scan a whole account for resources that exist outside of any ' +
      'Terraform state at all — the "shadow infrastructure" case drift detection on its own does not catch.</p></div>',
      try: [
        ['📖 Terraform — plan -detailed-exitcode', 'https://developer.hashicorp.com/terraform/cli/commands/plan#other-options', 'o'],
        ['🔎 driftctl — unmanaged resource scanning', 'https://github.com/snyk/driftctl', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The apply that reverted a live incident fix.</b> ' +
      'During an outage, an on-call engineer opens the console and widens a security group to unblock a dependency, resolving the incident in minutes. ' +
      'Two days later, an unrelated PR merges and CI runs <code>terraform apply</code> — which silently reverts the console change back to the ' +
      'narrower rule, since nothing in code ever recorded the fix. The dependency breaks again, this time with nobody expecting it. Fix: any ' +
      'emergency console change gets back-ported into the Terraform config in the SAME incident\'s follow-up, before the next unrelated apply can ' +
      'touch that resource — and a scheduled drift-detection job would have surfaced the gap within 24 hours instead of on the next unrelated ' +
      'merge.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The permanently "dirty" plan.</b> ' +
      'A team\'s <code>terraform plan</code> has shown a diff on the same three resources for months — an autoscaling group\'s ' +
      '<code>desired_capacity</code>, a load balancer\'s AWS-assigned tags, a KMS key\'s rotation timestamp — because these are legitimately managed ' +
      'outside Terraform or mutate at runtime. Engineers stop reading plan output carefully because it is "always dirty", and a real, dangerous change ' +
      'slips through hidden among the noise. Fix: <code>lifecycle { ignore_changes = [...] }</code> on the specific attributes that are meant to drift, ' +
      'so a clean plan actually means clean, and a new diff is always worth reading.</p></div>',
      try: [
        ['📖 Terraform — ignore_changes lifecycle', 'https://developer.hashicorp.com/terraform/language/meta-arguments/lifecycle#ignore_changes', 'o'],
        ['📜 Ch 4 — policy as code', '#ch4', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                             FIX\n' +
      'Discovering drift only when a real         Run a scheduled `plan -detailed-exitcode` (nightly/hourly) and\n' +
      '  change is next applied                    alert on drift found — do not wait for the next intentional PR.\n' +
      'Blanket ignore_changes = all                Ignore specific attributes only. Ignoring everything hides real,\n' +
      '                                            dangerous drift along with the benign, runtime-owned kind.\n' +
      'Treating every drift as "revert it"         Ask WHY it drifted first — an incident hotfix should be ported\n' +
      '                                            into code, not silently reverted by the next apply.\n' +
      'No ownership boundary for who can            Decide, in writing, which fields are console-editable at runtime\n' +
      '  console-edit a resource                    (autoscaler capacity) vs Terraform-only (network rules) — and\n' +
      '                                            enforce the Terraform-only ones with policy (Ch 4).\n' +
      'Drift detection scoped only to state         driftctl / cloud-native inventory tools catch resources that\n' +
      '  Terraform already knows about               exist in the account but were NEVER imported — invisible to\n' +
      '                                            `plan` entirely since there is no state entry to compare against.\n' +
      'refresh-only applies run by anyone           Refresh-only applies change what Terraform BELIEVES is true —\n' +
      '  without review                             treat them with the same review rigor as a real apply; accepting\n' +
      '                                            bad drift into state can mask a security regression.</code></pre>' +
      '<p><b>The real test:</b> when your on-call engineer makes an emergency console change at 2am, does your process guarantee it either gets ' +
      'codified within days or gets caught and reviewed by drift detection — or does it just silently vanish on the next unrelated apply?</p>',
      try: [
        ['📖 Terraform — resource drift tutorial', 'https://developer.hashicorp.com/terraform/tutorials/state/resource-drift', 'o'],
        ['🔁 Ch 8 — CI/CD for infrastructure', '#ch8', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, drift management is a <b>trust boundary</b> decision: for every resource, who is allowed to be the source of truth at ' +
      'runtime — Terraform, an operator, or another controller (an autoscaler, a Kubernetes operator, a security auto-remediation tool)? Drift is ' +
      'only a problem when two of those disagree about who owns a field. Design the boundary explicitly instead of discovering it during an ' +
      'incident.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: What is infrastructure drift, precisely?\n' +
      'A: A mismatch between what the Terraform state file records and the actual configuration of the real-world\n' +
      "   resource — caused by out-of-band changes (console, another tool, another controller) that Terraform's\n" +
      '   state was never told about.\n\n' +
      'Q: How do you detect drift without risking an accidental change?\n' +
      'A: `terraform plan -refresh-only` (or `-detailed-exitcode` in CI) — it reads real infrastructure and shows\n' +
      "   the diff against state without proposing or applying any change. It's read-only by design.\n\n" +
      'Q: When should you use ignore_changes vs. codifying the drifted value?\n' +
      'A: ignore_changes for attributes legitimately owned by something else at runtime (autoscaler capacity,\n' +
      '   cloud-assigned metadata). Codify (port into .tf and apply normally) anything a human intentionally\n' +
      '   changed and wants kept — leaving it as silent drift means the next apply reverts it by surprise.\n\n' +
      'Q: Why is state-based drift detection alone not enough to catch "shadow" infrastructure?\n' +
      "A: `plan` only compares resources that ALREADY have a state entry. A resource created entirely outside\n" +
      '   Terraform (console, another team\'s script) has no state entry to diff against, so it is invisible to\n' +
      '   `plan` — you need an account-wide scanner (driftctl, cloud-native inventory) to find those.\n\n' +
      'Q: An incident requires an emergency console change. What is the correct follow-up?\n' +
      'A: Port the change into the Terraform config as part of the incident\'s remediation (same day/week, not\n' +
      "   \"eventually\"), so the next apply doesn't silently revert the fix — and note it in the postmortem so\n" +
      '   drift detection cadence gets reviewed if the gap was too long.</code></pre>',
      try: [
        ['📖 HashiCorp — managing resource drift', 'https://developer.hashicorp.com/terraform/tutorials/state/resource-drift', 'o'],
        ['🗺️ Ch 16 — IaC platform reference architecture', '#ch16', 'o']
      ] }
  ],

  quiz: [
    { q: 'What does `terraform plan -refresh-only` do?',
      opts: [
        'Applies all pending changes immediately without confirmation',
        'Reads the real infrastructure and shows a diff against state without proposing or making any change — a safe way to detect drift',
        'Deletes the local state file and re-downloads it from the backend',
        'Refreshes provider plugin versions to the latest release'],
      ok: 1,
      why: 'Refresh-only plans are read-only: they surface drift (state vs. reality mismatches) without risking an accidental apply.' },
    { q: 'When is `lifecycle { ignore_changes = [...] }` the right fix for drift, versus codifying the change into .tf?',
      opts: [
        'Always — ignore_changes should be applied to every attribute to avoid noisy plans',
        'When the attribute is legitimately owned by something else at runtime (e.g. an autoscaler); an intentional human change should instead be ported into the config',
        'Never — ignore_changes is deprecated in modern Terraform',
        'Only for resources tagged "production"'],
      ok: 1,
      why: 'ignore_changes silences drift on fields genuinely owned elsewhere at runtime. A deliberate human change should be codified, not silently ignored, or the next apply reverts it unexpectedly.' },
    { q: 'Why can\'t drift detection based on `terraform plan` alone catch "shadow infrastructure" created entirely outside Terraform?',
      opts: [
        'Because plan only checks provider versions, not resource state',
        'Because plan compares state to reality, and a resource with no state entry at all has nothing to compare against — it needs an account-wide scanner instead',
        'Because plan requires manual approval for every resource type',
        'Because shadow infrastructure is automatically imported by Terraform'],
      ok: 1,
      why: 'plan only diffs resources Terraform already tracks in state. A resource created entirely out-of-band has no state entry, so it is invisible to plan — tools like driftctl scan the whole account instead.' }
  ]
};
