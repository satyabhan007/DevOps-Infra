# IAM — least-privilege policy example

Two policies for the same job — "an application that reads/writes order
data in S3 and DynamoDB" — to show what least-privilege actually looks
like next to what most people ship first.

## `bad-policy.json` — what most people write first

```json
{
  "Effect": "Allow",
  "Action": ["s3:*", "dynamodb:*"],
  "Resource": "*"
}
```

This grants every S3 and DynamoDB action (including `s3:DeleteBucket`,
`dynamodb:DeleteTable`, and read/write on every bucket and table in the
account, present or future) to whatever runs with this policy. It "works"
in every test, which is exactly why it survives into production: nothing
breaks until a leaked credential, a bad deploy, or a compromised dependency
turns "works" into "can delete anything in the account."

## `good-policy.json` — scoped to what the app actually touches

The same application only ever needs:
- to list and read/write objects under `orders/` in one bucket
  (`acme-app-data`)
- to read/write items in one DynamoDB table (`orders`)

So the policy says exactly that:

| Statement                      | Grants                                            | Scoped to |
|---------------------------------|----------------------------------------------------|-----------|
| `ListOwnPrefixOnly`             | `s3:ListBucket`                                     | the bucket, but only when listing the `orders/*` prefix (`s3:prefix` condition — `ListBucket` itself takes the whole bucket as its resource, so the prefix has to be constrained via a condition, not the resource ARN) |
| `ReadWriteOrdersPrefixOnly`     | `s3:GetObject` / `PutObject` / `DeleteObject`       | `acme-app-data/orders/*` only |
| `OrdersTableReadWrite`          | `GetItem`/`PutItem`/`UpdateItem`/`DeleteItem`/`Query` | the `orders` table only, no `Scan`, `DeleteTable`, or table-management actions |
| `DenyOutsideExpectedRegion`     | explicit `Deny` on `s3:*`/`dynamodb:*`               | anything requested outside `us-east-1`, as a belt-and-suspenders guard even if a future edit widens the Allow statements above |

Notably absent: `s3:DeleteBucket`, `s3:PutBucketPolicy`, `dynamodb:DeleteTable`,
`dynamodb:Scan`, access to any other bucket or table, and unscoped `*` actions
or resources anywhere in the document. A leaked credential running this
policy can corrupt order data — it cannot delete the bucket, read other
teams' data, or touch anything outside `us-east-1`.

## Applying this pattern to your own policies

1. Start from what the code actually calls (grep the SDK calls, don't guess).
2. Scope `Resource` to the specific ARN — bucket *and* prefix, table *and*
   index if needed — never a bare `*`.
3. Prefer per-action grants over wildcards like `s3:Get*` unless you've
   checked exactly which actions that wildcard expands to.
4. Add an explicit `Deny` for anything you never want to be possible even by
   future accident (wrong region, wrong account, MFA not present).
5. Re-run [IAM Access Analyzer](https://docs.aws.amazon.com/IAM/latest/UserGuide/what-is-access-analyzer.html)
   or `aws iam simulate-principal-policy` after every change — least
   privilege drifts toward broad privilege unless something keeps checking.

## Validate locally

```sh
python -m json.tool good-policy.json
python -m json.tool bad-policy.json
```
