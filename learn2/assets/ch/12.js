/* DevOps-Infra Learn — Part 2 · Chapter 12: Blue/Green & Zero-Downtime Infra Changes */
window.CH[12] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>Some Terraform changes are safe in-place updates. Others — changing a subnet\'s CIDR block, an RDS engine\'s major version, an EC2 launch ' +
      'template\'s AMI on an instance that cannot be modified live — force Terraform to DESTROY the resource and CREATE a new one. If that resource ' +
      'is serving live traffic, destroy-then-create means an outage between the two steps.</p>' +
      '<pre><code>default behavior:  destroy old subnet  →  (gap: nothing exists)  →  create new subnet   = outage\n' +
      'zero-downtime:     create new subnet  →  cut traffic over  →  destroy old subnet       = no gap</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>Replacing a bridge vs. demolishing it first and building after.</b> ' +
      'You do not demolish the only bridge across a river and then start building its replacement — traffic has nowhere to go for weeks. You build ' +
      'the new bridge alongside the old one, open it, redirect traffic, THEN demolish the old one. Zero-downtime infra changes are that ordering, ' +
      'applied to cloud resources.</p></div>',
      try: [
        ['📖 Terraform — create_before_destroy', 'https://developer.hashicorp.com/terraform/language/meta-arguments/lifecycle#create_before_destroy', 'o'],
        ['🌊 Ch 3 — managing drift at scale', '#ch3', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<p>The <code>lifecycle</code> block\'s <code>create_before_destroy</code> flips the default ordering, but it only works if nothing else — a ' +
      'uniqueness constraint, a hardcoded name — blocks two versions of the resource existing at once:</p>' +
      '<pre><code>resource "aws_launch_template" "app" {\n' +
      '  name_prefix   = "app-"          # NOT a fixed "name" — must be unique so old+new can coexist briefly\n' +
      '  image_id      = var.ami_id\n' +
      '  instance_type = "m5.large"\n\n' +
      '  lifecycle {\n' +
      '    create_before_destroy = true   # build the NEW launch template before destroying the old one\n' +
      '  }\n' +
      '}\n\n' +
      'resource "aws_autoscaling_group" "app" {\n' +
      '  launch_template { id = aws_launch_template.app.id }\n' +
      '  min_size = 3\n' +
      '  lifecycle {\n' +
      '    create_before_destroy = true   # new ASG scales up and passes health checks before old one is destroyed\n' +
      '  }\n' +
      '}</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>For a true blue/green infra cutover (not just a single resource swap), pair ' +
      '<code>create_before_destroy</code> with a <b>weighted or health-checked traffic shift</b> at the load-balancer/DNS layer — AWS ' +
      '<b>CodeDeploy blue/green</b> for ASGs/ECS, or Route53 weighted routing — so the cutover itself is gradual and reversible, not an instant ' +
      'all-or-nothing swap the moment Terraform finishes applying.</p></div>',
      try: [
        ['📖 Terraform — lifecycle meta-argument', 'https://developer.hashicorp.com/terraform/language/meta-arguments/lifecycle', 'o'],
        ['📖 AWS — blue/green deployments', 'https://docs.aws.amazon.com/whitepapers/latest/practicing-continuous-integration-continuous-delivery/blue-green-deployment.html', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The database engine upgrade that took down the app for 40 minutes.</b> ' +
      'A team changes an RDS instance\'s engine version across a major-version boundary that AWS does not support as an in-place upgrade for their ' +
      'configuration. Terraform correctly plans a destroy+recreate. Nobody noticed the plan\'s "-/+" (replace) marker before applying, and the ' +
      'database — a single instance, no read replica to promote — goes down for the full duration of the recreate plus data restore. Fix: for ANY ' +
      'stateful resource, a plan showing "-/+ " (force replacement) must trigger an explicit design review before apply, not just a glance — and the ' +
      'safe pattern is provisioning a new instance alongside the old (replica promotion, or a parallel instance with app-level dual-write/cutover), ' +
      'never a bare Terraform-driven destroy+create for anything holding live data.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The create_before_destroy that still failed.</b> ' +
      'A team adds <code>create_before_destroy = true</code> to an ASG hoping for a clean cutover, but the launch template underneath still uses a ' +
      'fixed (non-prefixed) <code>name</code>. Terraform tries to create the new launch template before destroying the old — and fails immediately ' +
      'because the name is already taken, since the old one has not been destroyed yet. The apply errors out mid-change, leaving the deployment in a ' +
      'confusing half-state. Fix: <code>create_before_destroy</code> only works end-to-end if EVERY resource in the dependency chain can tolerate two ' +
      'copies existing simultaneously — use <code>name_prefix</code> instead of <code>name</code>, and check every uniquely-named resource in the ' +
      'chain, not just the top-level one you are directly editing.</p></div>',
      try: [
        ['📖 Terraform — replace resources with create_before_destroy', 'https://developer.hashicorp.com/terraform/tutorials/state/resource-lifecycle', 'o'],
        ['🩹 Ch 9 — import, refactor & state surgery', '#ch9', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'Applying a "-/+ " (replace) plan on a       Any force-replacement on a stateful resource gets an explicit\n' +
      '  stateful resource without a second look     design review — this is exactly where an unplanned outage\n' +
      '                                            hides in an otherwise routine-looking apply.\n' +
      'create_before_destroy on a resource with     A fixed `name` (not `name_prefix`) blocks two copies existing\n' +
      '  a fixed unique name                          at once — the "create" half fails before the old is destroyed.\n' +
      'Instant, all-or-nothing traffic cutover      Pair Terraform\'s create_before_destroy with a gradual,\n' +
      '  the moment apply finishes                    health-checked traffic shift (weighted DNS, ALB target\n' +
      '                                            group swap) so a bad new version is caught before 100% of\n' +
      '                                            traffic reaches it.\n' +
      'No rollback plan if the "green" side          Keep the "blue" side intact and easy to cut BACK to until\n' +
      '  fails health checks post-cutover              the green side has proven itself under real traffic — do\n' +
      '                                            not destroy blue the instant green looks healthy at t+0.\n' +
      'Database schema changes bundled into the      Schema/data migrations need their OWN backward-compatible\n' +
      '  same cutover as infra replacement             rollout (expand/contract pattern) — a blue/green infra swap\n' +
      '                                            alone does not solve a breaking schema change underneath it.\n' +
      'Zero-downtime pattern applied uniformly       Not every resource needs this rigor — apply it where the blast\n' +
      '  even to low-risk, easily-recreated resources  radius (user-facing downtime) justifies the added complexity.</code></pre>' +
      '<p><b>The real test:</b> if the new ("green") side fails its health checks five minutes after cutover, can you revert to "blue" faster than ' +
      'it takes to notice the incident — or is blue already gone?</p>',
      try: [
        ['📖 Terraform — resource lifecycle tutorial', 'https://developer.hashicorp.com/terraform/tutorials/state/resource-lifecycle', 'o'],
        ['🚑 Ch 15 — debugging a broken apply', '#ch15', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, zero-downtime infra change is a <b>choreography</b> problem spanning Terraform, the load-balancing layer, and application ' +
      'data compatibility all at once: <code>create_before_destroy</code> handles the Terraform-level resource lifecycle, a weighted/health-checked ' +
      'traffic shift handles the cutover itself, and an expand/contract schema pattern handles any underlying data compatibility — none of the three ' +
      'alone is sufficient, and skipping any one reintroduces the outage window the others were meant to eliminate.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: What does a "-/+ " marker in a terraform plan mean, and why does it matter for zero-downtime changes?\n' +
      'A: It means force-replacement — Terraform will destroy the existing resource and create a new one, rather\n' +
      '   than updating in place. For a resource serving live traffic or holding data, that gap between destroy\n' +
      '   and create is exactly where an outage happens.\n\n' +
      'Q: Why does create_before_destroy require name_prefix instead of a fixed name on many AWS resources?\n' +
      "A: create_before_destroy needs the OLD and NEW resource to coexist briefly. A fixed, unique `name` makes\n" +
      '   that impossible — the create step for the new resource fails because the name is still taken by the\n' +
      '   not-yet-destroyed old one.\n\n' +
      'Q: Why is create_before_destroy alone not sufficient for a true blue/green infrastructure cutover?\n' +
      'A: It handles the Terraform RESOURCE lifecycle (both copies briefly exist) but says nothing about HOW\n' +
      '   traffic moves between them — without a gradual, health-checked traffic shift at the LB/DNS layer, the\n' +
      "   cutover is still instant and all-or-nothing the moment apply finishes.\n\n" +
      'Q: How do you handle a database schema change as part of a zero-downtime infra cutover?\n' +
      'A: With an expand/contract pattern at the application/schema level — add new columns/fields in a\n' +
      '   backward-compatible way first, deploy code that can read both old and new shapes, migrate data, THEN\n' +
      '   remove the old shape — independent of and in addition to the infra-level blue/green swap.\n\n' +
      'Q: After cutting traffic to the new ("green") side, when is it safe to destroy the old ("blue") side?\n' +
      "A: Only after green has proven itself under real production traffic for a meaningful soak period — not\n" +
      '   the instant health checks pass at t+0. Keeping blue intact during that window is what makes a fast\n' +
      "   rollback possible if a problem surfaces that health checks alone didn't catch.</code></pre>",
      try: [
        ['📖 Martin Fowler — BlueGreenDeployment', 'https://martinfowler.com/bliki/BlueGreenDeployment.html', 'o'],
        ['🗺️ Ch 16 — IaC platform reference architecture', '#ch16', 'o']
      ] }
  ],

  quiz: [
    { q: 'What does a "-/+ " (force replacement) marker in a `terraform plan` mean?',
      opts: [
        'The resource will be updated in place with no downtime',
        'Terraform will destroy the existing resource and create a new one — for a live-traffic or stateful resource, this is where an outage can occur',
        'The resource is being renamed only',
        'It indicates a syntax error in the configuration'],
      ok: 1,
      why: 'Force-replacement means destroy-then-create. Left unmanaged, this creates a gap where the resource does not exist, which is dangerous for anything serving traffic or holding data.' },
    { q: 'Why does `create_before_destroy` often require `name_prefix` instead of a fixed `name` on resources like launch templates?',
      opts: [
        'name_prefix makes applies run faster',
        'create_before_destroy needs the old and new resource to briefly coexist, which a fixed unique name prevents — the create step fails because the name is still in use',
        'Fixed names are not supported by Terraform at all',
        'name_prefix is required for all AWS resources regardless of lifecycle settings'],
      ok: 1,
      why: 'A fixed name blocks two copies existing simultaneously, which create_before_destroy relies on; name_prefix lets Terraform generate a unique name for the new copy.' },
    { q: 'Why is `create_before_destroy` alone not sufficient for a true zero-downtime blue/green cutover?',
      opts: [
        'It is fully sufficient on its own for any cutover',
        'It only manages the Terraform resource lifecycle — an actual gradual, health-checked traffic shift at the load-balancer/DNS layer is still needed to avoid an instant all-or-nothing cutover',
        'It cannot be used with autoscaling groups',
        'It only works for database resources'],
      ok: 1,
      why: 'create_before_destroy ensures both resource copies can exist briefly, but traffic still needs to be shifted gradually and safely at the LB/DNS layer for a real blue/green rollout.' }
  ]
};
