/* DevOps-Infra Learn — Part 2 · Chapter 14: Pulumi/CDK & the Programmable-IaC Alternative */
window.CH[14] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>HCL is declarative and purpose-built — great for describing WHAT you want, awkward for describing complex conditional logic, loops over ' +
      'nested data structures, or reusable functions with real unit tests. <b>Pulumi</b> and the <b>AWS CDK</b> let you write the same infrastructure ' +
      'in a real programming language (TypeScript, Python, Go) that compiles/transpiles down to the same underlying primitives Terraform and ' +
      'CloudFormation use.</p>' +
      '<pre><code>HCL:         for_each = { for k, v in var.buckets : k => v if v.enabled }   # readable, but limited\n' +
      'Pulumi/TS:   const buckets = Object.entries(cfg.buckets)\n' +
      '               .filter(([,v]) => v.enabled)\n' +
      '               .map(([k,v]) => new aws.s3.Bucket(k, v));           # real language, real tooling</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A form with checkboxes vs. a full word processor.</b> ' +
      'HCL is a well-designed form — fast to fill out for the common cases it was designed for. A programming language is the full word processor: ' +
      'more powerful and flexible for anything the form did not anticipate, at the cost of more ways to make a mistake.</p></div>',
      try: [
        ['📖 Pulumi — how it works', 'https://www.pulumi.com/docs/iac/concepts/how-pulumi-works/', 'o'],
        ['📖 AWS CDK — developer guide', 'https://docs.aws.amazon.com/cdk/v2/guide/home.html', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<p>Both tools still produce a declarative plan and a state file underneath — the language is just the authoring layer:</p>' +
      '<pre><code>// Pulumi (TypeScript) — real language: loops, functions, try/catch, actual unit tests\n' +
      'import * as aws from "@pulumi/aws";\n\n' +
      'const azCount = 3;\n' +
      'const subnets = Array.from({ length: azCount }, (_, i) =>\n' +
      '  new aws.ec2.Subnet(`private-${i}`, {\n' +
      '    vpcId: vpc.id,\n' +
      '    cidrBlock: `10.4.${i}.0/24`,\n' +
      '    availabilityZone: azs[i],\n' +
      '  }));\n\n' +
      '$ pulumi preview   # the Pulumi equivalent of `terraform plan`\n' +
      '$ pulumi up        # the Pulumi equivalent of `terraform apply`, still tracks STATE (Pulumi Cloud or self-managed)</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p><b>Terraform/OpenTofu (HCL)</b> remains the cross-cloud standard with by far ' +
      'the largest provider ecosystem (Ch 10). <b>AWS CDK</b> is the standard when you are AWS-only and want first-party, deeply-integrated constructs ' +
      '(and it can synthesize to raw CloudFormation). <b>Pulumi</b> is the standard choice when you want a real language AND multi-cloud provider ' +
      'coverage close to Terraform\'s — it can even consume existing Terraform providers directly.</p></div>',
      try: [
        ['📖 Pulumi — using Terraform providers', 'https://www.pulumi.com/registry/', 'o'],
        ['📖 AWS CDK — constructs', 'https://docs.aws.amazon.com/cdk/v2/guide/constructs.html', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The "clever" loop that made a plan unreadable.</b> ' +
      'A team migrates a complex module to Pulumi specifically to use real loops and conditionals, then writes a 200-line TypeScript function with ' +
      'nested async calls, mutable shared state, and side effects computing resource names dynamically at synth time. ' +
      '<code>pulumi preview</code> output becomes nearly impossible for a reviewer to reason about — unlike an HCL <code>for_each</code>, which is ' +
      'declarative and diffable at a glance, the imperative code\'s actual resource set depends on execution order a reviewer has to mentally trace. ' +
      'Fix: use the programming language\'s power for testing, composition, and abstraction (real unit tests, typed reusable components) — but keep ' +
      'the RESOURCE-GENERATING logic itself close to declarative (pure functions of input data, no hidden mutable state), so <code>preview</code> ' +
      'output stays reviewable.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The team that underestimated the state/backend story.</b> ' +
      'A team picks Pulumi expecting it to "just work" like application code, and does not realize it still needs the same rigor Terraform does around ' +
      'state backends, locking, and secrets (Ch 2, Ch 7) — Pulumi state is JSON too, and Pulumi Cloud\'s free tier or a self-managed backend both need ' +
      'the same deliberate choice Terraform\'s backend config requires. They default to Pulumi\'s local filesystem state during a rushed prod rollout, ' +
      'hitting the exact same "no locking, no shared source of truth" problem Ch 2 warns about, just in a different tool. Fix: programmable IaC does ' +
      'not remove any of the state, locking, secrets, or CI/CD lessons from earlier chapters — it only changes the authoring language on top of the ' +
      'same underlying concerns.</p></div>',
      try: [
        ['🔒 Ch 2 — remote state, locking & workspaces', '#ch2', 'o'],
        ['📖 Pulumi — state and backends', 'https://www.pulumi.com/docs/iac/concepts/state-and-backends/', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'Using loops/conditionals to write            Keep resource-generating logic close to a pure function of\n' +
      '  hard-to-review, order-dependent synth        input data — use the real language for testing/abstraction,\n' +
      '  logic "because you can"                       not to hide control flow a reviewer cannot trace.\n' +
      'Assuming a real language means no more        Pulumi/CDK still need a real state backend, locking, and\n' +
      '  state/locking/secrets discipline needed       secrets handling — same concerns as Ch 2/Ch 7, different tool.\n' +
      'Choosing Pulumi/CDK purely for language        Provider ecosystem breadth (Ch 10) still matters — check\n' +
      '  preference without checking provider           the tool actually has mature support for every cloud/SaaS\n' +
      '  coverage for your actual stack                 resource your infra needs before committing org-wide.\n' +
      'Mixing Terraform AND Pulumi for the SAME       Pick one per resource/layer — two tools independently\n' +
      '  resources with no clear ownership split         managing overlapping resources WILL fight over drift and\n' +
      '                                              ownership; if you must mix, split cleanly by layer/team.\n' +
      'No unit tests despite having a real             The whole point of a real language is real tests (Ch 6) —\n' +
      '  language available                              not writing them wastes the main advantage over HCL.\n' +
      'Migrating everything to Pulumi/CDK at once     A full migration off Terraform is a major, risky undertaking\n' +
      '  "because it is better"                          — evaluate module by module, and weigh the ecosystem/team-\n' +
      '                                              familiarity cost against the real, specific pain being solved.</code></pre>' +
      '<p><b>The real test:</b> does using a real programming language make this infrastructure code MORE reviewable and testable than the HCL it ' +
      'replaced — or does it just relocate the same complexity into a form a reviewer trusts less because it is imperative?</p>',
      try: [
        ['📖 Pulumi vs Terraform comparison', 'https://www.pulumi.com/docs/iac/concepts/vs/terraform/', 'o'],
        ['🧪 Ch 6 — testing infrastructure code', '#ch6', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, choosing programmable IaC is a <b>tradeoff between expressiveness and reviewability</b>, not a strictly-better upgrade: a ' +
      'real language buys you loops, types, and real unit tests, at the cost of a diff/plan that is only as reviewable as the discipline used to write ' +
      'the resource-generating code. The mature approach treats the imperative language as a code generator for a declarative plan, and holds the ' +
      'generating code to the same "keep it boring and pure" standard as a good HCL module.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: What does Pulumi/CDK actually change about the underlying IaC model compared to Terraform/HCL?\n' +
      "A: Only the AUTHORING language — under the hood, both still compute a declarative plan/diff against a\n" +
      '   state file and apply changes through the same cloud provider APIs. The core concepts (plan, apply,\n' +
      "   state, drift) don't disappear; they're just expressed in TypeScript/Python/Go instead of HCL.\n\n" +
      'Q: Why can heavy use of loops/conditionals in Pulumi/CDK code make a change HARDER to review than HCL?\n' +
      "A: HCL's for_each/count are declarative and the resulting resource set is easy to reason about\n" +
      '   statically. Imperative code with mutable state or execution-order dependencies can generate a\n' +
      '   different resource set depending on runtime behavior, which a reviewer has to mentally trace rather\n' +
      '   than read declaratively.\n\n' +
      'Q: Does switching to Pulumi/CDK remove the need for remote state, locking, and secrets discipline (Ch 2, Ch 7)?\n' +
      'A: No — Pulumi/CDK still persist state (JSON, via Pulumi Cloud or a self-managed backend) that needs\n' +
      '   the same locking and access-control rigor, and secrets still need to flow through a proper secret\n' +
      '   manager rather than being hardcoded in the program.\n\n' +
      'Q: What is the risk of mixing Terraform and Pulumi/CDK managing the SAME resources?\n' +
      'A: Two independent state-tracking tools with no awareness of each other will each believe they are the\n' +
      "   sole source of truth — changes made by one look like drift to the other, and they can fight over\n" +
      '   ownership. Split cleanly by resource/layer if both tools must coexist.\n\n' +
      'Q: When does choosing Pulumi/CDK over Terraform genuinely pay off?\n' +
      "A: When the infrastructure logic has real complexity (nested conditionals, reusable typed abstractions,\n" +
      '   logic that benefits from real unit tests) that HCL expresses awkwardly — not as a default preference,\n' +
      '   since it trades Terraform\'s larger ecosystem and org-wide familiarity for that expressiveness.</code></pre>',
      try: [
        ['📖 Pulumi — testing infrastructure', 'https://www.pulumi.com/docs/iac/concepts/testing/', 'o'],
        ['🚑 Ch 15 — debugging a broken apply', '#ch15', 'o']
      ] }
  ],

  quiz: [
    { q: 'What does Pulumi/CDK fundamentally change compared to Terraform/HCL?',
      opts: [
        'They eliminate the need for state files entirely',
        'Only the authoring language — both still compute a declarative plan/diff against persisted state and apply through the same provider APIs',
        'They remove the need for a cloud provider API',
        'They replace the concept of a "plan" with immediate application of every change'],
      ok: 1,
      why: 'Pulumi/CDK are an authoring-layer change; the underlying plan/state/apply model and its concerns (locking, drift, secrets) remain the same.' },
    { q: 'Why can heavy imperative logic (loops, mutable state, conditionals) in Pulumi/CDK code make review harder than an equivalent HCL for_each?',
      opts: [
        'Imperative code always runs slower',
        'The resulting resource set can depend on runtime execution order, requiring a reviewer to mentally trace logic rather than read a declarative structure at a glance',
        'Pulumi does not support code review tooling',
        'HCL for_each cannot express loops at all'],
      ok: 1,
      why: 'HCL constructs like for_each are declarative and statically reviewable; imperative code with side effects or mutable state can produce different resource sets depending on execution order.' },
    { q: 'What is the risk of using Terraform and Pulumi/CDK simultaneously to manage the SAME cloud resources?',
      opts: [
        'There is no risk, both tools are fully interoperable by default',
        'Each tool independently tracks its own state and believes itself the source of truth — changes made by one look like drift to the other, causing ownership conflicts',
        'It is technically impossible to run both tools in the same organization',
        'Pulumi automatically imports all Terraform-managed resources'],
      ok: 1,
      why: 'Without a clear split by resource/layer, two independently state-tracking tools will conflict over ownership of the same resources.' }
  ]
};
