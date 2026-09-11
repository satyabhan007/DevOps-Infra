/* DevOps-Infra Learn — Part 2 · Chapter 9: Import, Refactor & State Surgery */
window.CH[9] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>Not every resource starts life under Terraform — someone hand-created a database in the console three years ago, and it is now load-bearing ' +
      'production infrastructure. You cannot just write a matching <code>resource</code> block and <code>apply</code>: Terraform would try to CREATE ' +
      'a second one. <b>Import</b> tells Terraform "this real resource and this config block are the same thing" without touching the resource ' +
      'itself.</p>' +
      '<pre><code>reality:  aws_db_instance "prod-db" already exists, created by hand in 2022\n' +
      'you write: resource "aws_db_instance" "main" { ... matching config ... }\n' +
      'import:    terraform import aws_db_instance.main prod-db-instance-id   # links config ↔ real resource, no create/destroy</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>Adding an existing employee to the org chart, not hiring a new one.</b> ' +
      'The employee already works there — import is the paperwork that formally puts them on the chart with the right reporting line, not an offer ' +
      'letter for a duplicate hire.</p></div>',
      try: [
        ['📖 Terraform — import', 'https://developer.hashicorp.com/terraform/language/import', 'o'],
        ['🌊 Ch 3 — managing drift at scale', '#ch3', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<p>Modern Terraform (1.5+) prefers a declarative <code>import</code> block over the old imperative CLI command, and renames/moves use ' +
      '<code>moved</code> blocks instead of the old <code>state mv</code> CLI:</p>' +
      '<pre><code># import.tf — declarative, reviewable in a PR, plannable before it touches anything\n' +
      'import {\n' +
      '  to = aws_db_instance.main\n' +
      '  id = "prod-db-instance-id"\n' +
      '}\n' +
      'resource "aws_db_instance" "main" {\n' +
      '  # ... write config matching the REAL resource\'s actual settings ...\n' +
      '}\n' +
      '$ terraform plan   # shows exactly what would be imported + any config drift, BEFORE anything happens\n\n' +
      '# refactor: renaming a resource or moving it into a module, WITHOUT destroy+recreate\n' +
      'moved {\n' +
      '  from = aws_instance.web\n' +
      '  to   = module.compute.aws_instance.web\n' +
      '}</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>Prefer the declarative <code>import</code> and <code>moved</code> blocks (since ' +
      'Terraform 1.5/1.1 respectively) over the imperative <code>terraform import</code> / <code>terraform state mv</code> CLI commands — the blocks ' +
      'live in version control, show up in <code>plan</code> BEFORE anything changes, and get reviewed in a PR like any other change instead of being ' +
      'an untracked command someone ran once from their terminal.</p></div>',
      try: [
        ['📖 Terraform — the import block', 'https://developer.hashicorp.com/terraform/language/import', 'o'],
        ['📖 Terraform — the moved block', 'https://developer.hashicorp.com/terraform/language/moved', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The import that almost recreated a database.</b> ' +
      'An engineer imports a hand-created RDS instance using the old CLI <code>terraform import</code> command, then writes the ' +
      '<code>resource</code> block from memory rather than from the resource\'s ACTUAL settings. The next <code>plan</code> shows Terraform wants to ' +
      'change the storage type and engine version to match the (slightly wrong) written config — an apply would have force-replaced the database, ' +
      'destroying production data. Fix: after any import, run <code>plan</code> immediately and treat ANY proposed change as a signal the written ' +
      'config does not yet match reality — reconcile the config to the real resource\'s actual attributes until <code>plan</code> shows zero diff, ' +
      'before ever running <code>apply</code>.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The module refactor that wanted to destroy and recreate everything.</b> ' +
      'A team reorganizes a flat root module into nested modules for clarity — moving <code>aws_instance.web</code> into ' +
      '<code>module.compute.aws_instance.web</code>. Without a <code>moved</code> block, Terraform sees this as the old address disappearing and a ' +
      'brand-new resource address appearing — it plans to DESTROY the running instance and CREATE a new one, which for a stateful resource (a ' +
      'database, not this web server) would mean data loss. Fix: every rename or module-move gets a <code>moved</code> block declaring old → new ' +
      'address, so Terraform treats it as a state-only rename, never as destroy+create — and always confirm with <code>plan</code> that no resource ' +
      'shows unexpected replacement.</p></div>',
      try: [
        ['📖 Terraform — refactoring with moved blocks', 'https://developer.hashicorp.com/terraform/language/moved', 'o'],
        ['🧩 Ch 1 — modules & composition', '#ch1', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'Writing resource config from memory         Read the resource\'s ACTUAL current settings (console, `aws\n' +
      '  before importing                           cli describe`, provider docs) and match config to reality —\n' +
      '                                            then import, then plan to confirm zero diff.\n' +
      'terraform state mv run once from a           Prefer declarative `moved` blocks committed to version control\n' +
      '  terminal, never committed                   — reviewable in a PR, visible in plan, reproducible in CI.\n' +
      'Renaming a resource without a moved          Terraform sees old-address-gone + new-address-appeared as\n' +
      '  block                                      destroy+create — catastrophic for anything stateful.\n' +
      'Importing directly into production           Import into a scratch/throwaway state first to verify the\n' +
      '  state with no rehearsal                     config matches with zero plan diff, THEN do the real import.\n' +
      'No plan review after state surgery            ALWAYS run `plan` immediately after any import or moved-block\n' +
      '                                            change and read every line — this is exactly where silent\n' +
      '                                            destructive changes hide.\n' +
      'Corrupted state "fixed" with a full           Hand-editing the state JSON breaks internal schema invariants\n' +
      '  manual JSON rewrite                          Terraform relies on — use `terraform state` subcommands or\n' +
      '                                            import/moved blocks, which validate as they go.</code></pre>' +
      '<p><b>The real test:</b> after any import or refactor, does <code>terraform plan</code> show EXACTLY zero unexpected changes — no ' +
      'replacements, no drift — before you ever let <code>apply</code> touch the real resource?</p>',
      try: [
        ['📖 Terraform — state command reference', 'https://developer.hashicorp.com/terraform/cli/commands/state', 'o'],
        ['🚑 Ch 15 — debugging a broken apply', '#ch15', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, state surgery is a <b>zero-surprise</b> discipline: every operation that touches the mapping between config and real ' +
      'resources — import, moved, state rm — must be followed by a <code>plan</code> that shows precisely the change you intended and nothing else. ' +
      'The moment a plan after state surgery shows an unexpected replace, stop; that plan is telling you the config and reality still disagree about ' +
      'something, and applying anyway risks the exact outage import/moved blocks exist to prevent.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: What is the danger of importing a resource and writing its .tf config from memory rather than from its\n' +
      '   real current settings?\n' +
      'A: Any mismatch between the written config and the resource\'s actual attributes shows up in the next\n' +
      "   plan as a proposed CHANGE — and for immutable attributes, that change can mean force-replace\n" +
      '   (destroy + recreate) of a resource that already held production data.\n\n' +
      'Q: Why does renaming a resource without a `moved` block risk destroying it?\n' +
      'A: Terraform tracks resources by address. Without a moved block, the old address simply vanishes from\n' +
      '   config and a new address appears — Terraform has no way to know it is the SAME resource, so it plans\n' +
      '   destroy-old + create-new instead of a state-only rename.\n\n' +
      'Q: Why prefer the declarative `import`/`moved` blocks over the imperative `terraform import`/`state mv` CLI?\n' +
      "A: The blocks live in version control and are visible in `plan` before anything happens — reviewable in\n" +
      '   a PR like any other change. The CLI commands are one-off, untracked, and leave no record of what\n' +
      '   happened or why.\n\n' +
      'Q: What is the single most important step immediately after any import or state-surgery operation?\n' +
      "A: Run `terraform plan` and read every line. Zero diff means config now matches reality; any proposed\n" +
      "   change — especially a replace — means don't apply yet, the config still needs reconciling.\n\n" +
      'Q: When should you hand-edit the state JSON directly instead of using `terraform state` subcommands?\n' +
      'A: Essentially never in normal operation — hand-editing breaks internal schema invariants Terraform\n' +
      '   relies on. Reserve it for a genuinely corrupted state file as an absolute last resort, and validate\n' +
      '   with `terraform validate`/`plan` immediately after.</code></pre>',
      try: [
        ['📖 Terraform — import block reference', 'https://developer.hashicorp.com/terraform/language/import', 'o'],
        ['🏬 Ch 10 — providers & the registry ecosystem', '#ch10', 'o']
      ] }
  ],

  quiz: [
    { q: 'Why is writing a resource\'s .tf config "from memory" before importing it risky?',
      opts: [
        'Terraform will refuse to import if the config was not written first',
        'Any mismatch between the written config and the resource\'s real settings shows up as a proposed change, which for immutable attributes can mean a destructive force-replace',
        'Import always overwrites the real resource with the written config',
        'It has no risk as long as the resource ID is correct'],
      ok: 1,
      why: 'The written config must match the resource\'s actual current attributes; any discrepancy appears as a plan diff, and some diffs on immutable attributes trigger destroy+recreate.' },
    { q: 'Why does renaming a resource in Terraform config without a `moved` block risk destroying it?',
      opts: [
        'Terraform automatically detects renames and handles them safely with no extra step',
        'Without a moved block, Terraform sees the old address disappear and a new one appear, and plans destroy-old + create-new since it cannot infer they are the same resource',
        'Renaming resources is not supported by Terraform at all',
        'It only affects the state file\'s formatting, not the real infrastructure'],
      ok: 1,
      why: 'Terraform tracks resources by their address; a moved block is what tells it an address change is a rename, not a deletion plus a new creation.' },
    { q: 'What should you always do immediately after an import or state-surgery operation, before running apply?',
      opts: [
        'Delete the old state backup file',
        'Run `terraform plan` and confirm it shows exactly zero unexpected changes — especially no unexpected replacements',
        'Re-run terraform init with -upgrade',
        'Disable state locking temporarily'],
      ok: 1,
      why: 'A plan showing zero diff confirms config now matches reality; any unexpected change (especially a replace) signals the config still needs reconciling before it is safe to apply.' }
  ]
};
