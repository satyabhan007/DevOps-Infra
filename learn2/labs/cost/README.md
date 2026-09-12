# cost/ — Infracost, wired into a PR

[Infracost](https://www.infracost.io/) reads Terraform HCL (or a
`terraform show -json` plan) and turns it into a dollar estimate —
without ever calling AWS or needing cloud credentials, which is why it
runs safely in CI on every PR from a fork.

```
cost/
├── main.tf                  # a stack sized to produce an interesting diff
└── infracost-breakdown.json  # `infracost breakdown --path . --format json` output shape
```

`main.tf` is deliberately a bit expensive: three `m5.2xlarge` app
instances, a Multi-AZ `db.r6g.xlarge` Postgres instance, and a 500 GB
EBS volume — enough line items to make a realistic PR comment.
`terraform fmt -check` and `terraform validate` both pass on it (see
`../terraform/README.md` for why `validate` needs no AWS credentials).

> The dollar figures in `infracost-breakdown.json` and below are
> **illustrative**, hand-built to match Infracost's real output shape —
> generating them for real needs a free API key from
> `infracost auth login` (see "Running it for real" below), which isn't
> something to provision unattended in this lab.

## The commands

```sh
# Static breakdown — no plan, no credentials, just parses the HCL:
infracost breakdown --path . --format json --out-file infracost-breakdown.json

# In CI, diff against main's cost and post/update one PR comment:
infracost diff --path . --compare-to infracost-base.json --format json --out-file infracost-diff.json
infracost comment github --path infracost-diff.json \
  --repo "$GITHUB_REPO" --pull-request "$PR_NUMBER" \
  --github-token "$GITHUB_TOKEN" --behavior update
```

`--behavior update` edits Infracost's existing comment on the PR
instead of posting a new one on every push — the same pattern GitHub's
own bots use.

## What the PR comment looks like

Infracost's GitHub comment for this stack would read like:

> ### 💰 Infracost report
>
> | Change | Resource | Cost impact |
> |---|---|---|
> | + | `aws_instance.app[0]` | +$288.32/mo |
> | + | `aws_instance.app[1]` | +$288.32/mo |
> | + | `aws_instance.app[2]` | +$288.32/mo |
> | + | `aws_db_instance.primary` | +$612.68/mo |
> | + | `aws_ebs_volume.app_data` | +$40.00/mo |
>
> **Monthly cost will increase by $1,517.64** (+100%) — 5 resources added, 0 changed, 0 removed.
>
> <details><summary>3 resources have usage-based costs not shown (data transfer, IOPS) — see the full breakdown</summary>...</details>

Real comments also flag resources Infracost can't price yet
(`totalUnsupportedResources`) and usage-based cost components that need
a `infracost-usage.yml` file (request counts, data transfer volumes) to
estimate — this stack has neither, so both are zero in
`infracost-breakdown.json`.

## How it's wired into CI (pattern, not this repo's actual workflow)

`.github/workflows/lab-tests.yml` in this repo isn't touched by this
lab (a separate PR wires real CI once all four parts' labs land — see
this PR's description). The pattern a real Infracost GitHub Action
follows:

```yaml
# illustrative — not a file in this repo
- uses: infracost/actions/setup@v3
  with:
    api-key: ${{ secrets.INFRACOST_API_KEY }}
- run: infracost breakdown --path=. --format=json --out-file=/tmp/infracost-base.json
  if: github.event_name == 'pull_request'
  # (checked out against the PR's base ref first, then the head ref, to diff)
- run: infracost diff --path=. --compare-to=/tmp/infracost-base.json --format=json --out-file=/tmp/infracost-diff.json
- run: infracost comment github --path=/tmp/infracost-diff.json --repo=$GITHUB_REPOSITORY
    --pull-request=${{ github.event.pull_request.number }} --github-token=${{ github.token }} --behavior=update
```

## Running it for real

```sh
curl -fsSL https://raw.githubusercontent.com/infracost/infracost/master/scripts/install.sh | sh
infracost auth login          # free, gets you an API key
infracost breakdown --path .
```
