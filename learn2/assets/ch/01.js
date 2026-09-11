/* DevOps-Infra Learn — Part 2 · Chapter 1: Modules & Composition */
window.CH[1] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>Your first Terraform file provisioned one VPC. Your tenth project copy-pasted that same block, tweaked a few names, and now a ' +
      'security-group rule changed in one place needs to be hand-edited in eleven. A <b>module</b> is that block, extracted once, parameterised, ' +
      'and reused — the difference between "code that provisions resources" and "a platform other teams build on".</p>' +
      '<pre><code>copy-paste VPC block x11     →     module "vpc" { source = "../modules/vpc"; cidr = "10.4.0.0/16" }\n' +
      '  (fix a bug 11 times)              (fix the bug once, every caller gets it on next apply)</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A recipe card vs. re-explaining the dish from scratch every time.</b> Once the ' +
      '"how to make a VPC" recipe is written down with inputs (servings, spice level), anyone on the team can make it correctly without re-learning ' +
      'the technique — and fixing the recipe fixes every future dish.</p></div>',
      try: [
        ['📖 Terraform — modules overview', 'https://developer.hashicorp.com/terraform/language/modules', 'o'],
        ['⚙️ Part 1: the plan/apply lifecycle', '../learn/#ch2', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<p>A module is just a directory of <code>.tf</code> files with declared <b>inputs</b> (variables) and <b>outputs</b>:</p>' +
      '<pre><code># modules/vpc/variables.tf\n' +
      'variable "cidr_block" { type = string }\n' +
      'variable "az_count"   { type = number  default = 3 }\n\n' +
      '# modules/vpc/main.tf   — the implementation, hidden from callers\n' +
      'resource "aws_vpc" "this" { cidr_block = var.cidr_block }\n' +
      '# ... subnets, route tables, NAT gateways built from az_count ...\n\n' +
      '# modules/vpc/outputs.tf\n' +
      'output "vpc_id"          { value = aws_vpc.this.id }\n' +
      'output "private_subnets" { value = aws_subnet.private[*].id }\n\n' +
      '# root module — the CALLER\n' +
      'module "vpc" {\n' +
      '  source     = "../modules/vpc"\n' +
      '  cidr_block = "10.4.0.0/16"\n' +
      '  az_count   = 3\n' +
      '}\n' +
      'resource "aws_instance" "app" { subnet_id = module.vpc.private_subnets[0] }</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>The registry convention is <b>root-modules/</b> (thin, per-environment, ' +
      'calls modules) + <b>modules/</b> (the reusable logic) — published either locally, in a private Git repo, or on the ' +
      '<b>Terraform Registry</b> with semantic versioning (<code>source = "app.terraform.io/org/vpc/aws" version = "~> 4.0"</code>). ' +
      'You compose from well-known modules (the AWS/Azure/GCP "official" modules on the Registry) before writing your own.</p></div>',
      try: [
        ['📖 Terraform Registry — modules', 'https://registry.terraform.io/browse/modules', 'o'],
        ['📖 Terraform — module versioning', 'https://developer.hashicorp.com/terraform/language/modules/sources', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The module nobody could safely change.</b> ' +
      'A "networking" module grew organically for two years: no documented inputs, resources referenced by 40 root modules, and no version pinning — ' +
      'every caller points at the module\'s <code>main</code> branch. A well-intentioned refactor breaks twelve unrelated teams\' plans the same afternoon. ' +
      'Fix: publish it to a registry with <b>semantic versions</b>, document inputs/outputs, and require callers to pin a version — a breaking change ' +
      'becomes a major-version bump that teams opt into, not a silent Tuesday outage.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The module that was too clever.</b> ' +
      'A "database" module takes 40 input variables to handle every possible configuration across every team — nobody can tell which combination is ' +
      'actually supported, and most callers copy another team\'s <code>.tfvars</code> file and hope. Fix: split it into a small, opinionated module ' +
      '(sane defaults, ~8 inputs) plus an <b>escape hatch</b> (a raw resource override) for the rare exception — most callers get something simple ' +
      'that just works; the 5% who need more have a documented way out.</p></div>' +
      '<p><b>Composition, not inheritance:</b> a root module calls several small modules (vpc, cluster, database) and wires their outputs to each ' +
      'other\'s inputs — resist the urge to build one giant "everything" module that tries to do the whole stack.</p>',
      try: [
        ['📖 HashiCorp — module composition guide', 'https://developer.hashicorp.com/terraform/language/modules/develop/composition', 'o'],
        ['🏗️ Ch 13 — multi-team ownership boundaries', '#ch13', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                          FIX\n' +
      'Copy-pasted resource blocks x N        Extract to a module the moment a second caller needs the\n' +
      '                                       same thing. One fix, every caller benefits.\n' +
      'Unpinned module source (main branch)    Pin a version (registry semver or a Git tag/ref). Bump\n' +
      '                                       deliberately, not by accident.\n' +
      '40-input "do everything" module         Small, opinionated module + an escape hatch for the rare\n' +
      '                                       exception. Most callers want sane defaults.\n' +
      'Module reaches into the ROOT state       Modules should not use remote_state data sources to read\n' +
      '  via remote_state                      their caller\'s state — pass values in as explicit inputs.\n' +
      'Provider config inside a shared module   Providers are configured by the ROOT module; a reusable\n' +
      '                                       module should not hardcode a region/account.\n' +
      'No module README / examples             Every module gets a README (inputs, outputs, a worked\n' +
      '                                       example) — someone WILL call it without asking you first.\n' +
      'Business logic buried in a module        Keep environment-specific values (instance counts, feature\n' +
      '  meant to be generic                    flags) in the ROOT module\'s call, not hardcoded inside.</code></pre>' +
      '<p><b>The real test of a module:</b> can a teammate who has never seen it call it correctly from the README alone, and can you change its ' +
      'internals without every caller needing to change too? If either answer is no, it is not a module yet — it is shared code with extra steps.</p>',
      try: [
        ['📖 Terraform — module structure conventions', 'https://developer.hashicorp.com/terraform/language/modules/develop/structure', 'o'],
        ['🏗️ Ch 2 — remote state & locking', '#ch2', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, module design is an <b>API design</b> problem: the module\'s variables and outputs are a contract, and every caller is a ' +
      'client of that contract. Version it, document it, and change it the way you would change a public API — additively, with deprecation windows, ' +
      'not silent breaking changes on <code>main</code>.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Why extract a Terraform module instead of just copy-pasting the resource blocks?\n' +
      'A: A module is a single place to fix bugs and add capabilities — every caller benefits from one change.\n' +
      '   It also creates a clear, testable, versionable contract (inputs/outputs) instead of N copies drifting\n' +
      '   apart independently.\n\n' +
      'Q: A shared module needs a breaking change. How do you roll it out to 12 dependent teams safely?\n' +
      'A: Publish it as a new MAJOR version (semver) on the registry/Git tag. Existing callers stay pinned to\n' +
      '   the old version and keep working; each team upgrades on its own schedule, testing the change with\n' +
      '   `terraform plan` before committing to the new pin.\n\n' +
      'Q: Should a reusable module configure its own AWS provider (region, account)?\n' +
      'A: No. Providers are configured once, in the ROOT module. A reusable module should be provider-agnostic\n' +
      '   about account/region so the same module works in any caller\'s context.\n\n' +
      'Q: What is the "escape hatch" pattern and why does it matter?\n' +
      'A: A module with sane defaults for the 95% case, plus a documented way (an override input, a\n' +
      '   sub-resource block) for the 5% of callers with an unusual requirement — instead of adding 40\n' +
      '   variables to the module trying to cover every case up front.\n\n' +
      'Q: How do you decide when code should become a module?\n' +
      'A: The moment a SECOND caller needs the same logic. Before that, extracting it early just adds an\n' +
      "   abstraction layer you don't yet know the right shape for.</code></pre>",
      try: [
        ['📖 Google — Terraform module best practices', 'https://cloud.google.com/docs/terraform/best-practices/general-style-structure', 'o'],
        ['🏗️ Ch 16 — the IaC platform reference architecture', '#ch16', 'o']
      ] }
  ],

  quiz: [
    { q: 'Why extract repeated Terraform resource blocks into a module rather than leaving them copy-pasted?',
      opts: [
        'It makes the state file smaller',
        'A module is a single place to fix bugs and add capabilities, so every caller benefits from one change, and it creates a versionable, documented contract instead of drifting copies',
        'Modules run faster than raw resource blocks',
        'Terraform requires modules for more than 5 resources'],
      ok: 1,
      why: 'Copy-pasted blocks drift apart as each is edited independently. A module centralises the logic so a fix or improvement propagates to every caller.' },
    { q: 'A shared module needs a breaking change and is used by 12 teams. Safest rollout?',
      opts: [
        'Edit the module on its main branch; everyone gets the change on their next apply',
        'Publish it as a new major (semver) version; existing callers stay pinned to the old version and each team upgrades on its own schedule',
        'Email everyone and hope they notice before their next apply',
        'Delete the old module so nobody can use it by mistake'],
      ok: 1,
      why: 'Unpinned or main-branch module sources mean any change is instantly live everywhere. Semantic versioning lets teams opt into a breaking change deliberately.' },
    { q: 'Should a reusable Terraform module configure its own provider block (region, account, credentials)?',
      opts: [
        'Yes, so the module is self-contained',
        'No — providers are configured by the ROOT module; a reusable module should stay agnostic to which account/region it is called from',
        'Only for production modules',
        'Only if the module has fewer than 3 resources'],
      ok: 1,
      why: 'Hardcoding provider configuration inside a shared module ties it to one account/region, breaking reuse. The root module (the caller) owns provider configuration.' }
  ]
};
