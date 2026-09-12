# remote-state/ — an S3 + DynamoDB backend, with locking

Local state (a `.tfstate` file on one laptop) breaks the moment a
second person runs `apply`: no locking, so two applies can race and
corrupt state; no sharing; no history; and any secret in state sits in
plaintext in a repo folder. A remote backend fixes all four.

```
remote-state/
├── backend.tf        # the backend block a real stack would carry
└── bootstrap/
    └── main.tf         # provisions the S3 bucket + DynamoDB table backend.tf points at
```

## `backend.tf`

```hcl
backend "s3" {
  bucket         = "acme-tfstate-prod"
  key            = "part2-lab/terraform.tfstate"
  region         = "eu-west-1"
  dynamodb_table = "acme-tfstate-locks"
  encrypt        = true
}
```

- **`bucket` + `key`** — the state file lives at `s3://acme-tfstate-prod/part2-lab/terraform.tfstate`,
  versioned and encrypted at rest. Give every stack its own `key` so
  they don't collide.
- **`dynamodb_table`** — before writing state, Terraform takes a lock
  row in this table (`LockID` = the state path). A second `apply`
  against the same key blocks with `Error acquiring the state lock`
  instead of racing the first one. `terraform force-unlock` clears a
  stuck lock by hand.
- **`encrypt = true`** — server-side encryption on the state object;
  `bootstrap/` also turns on SSE-KMS at the bucket level as a default.

## `bootstrap/`

The bucket and lock table have to exist *before* `backend.tf` can point
at them — a chicken-and-egg problem. `bootstrap/` is a separate
directory (separate state, kept local on purpose: see its header
comment) that provisions them once, by hand:

```sh
cd bootstrap
terraform init
terraform apply
```

Then copy `../backend.tf`'s `backend "s3" {}` block into every stack
that should use it and run `terraform init -migrate-state` there.

## Validate without touching AWS

Both directories validate offline — `-backend=false` skips talking to
the (real, not-yet-created) S3 backend entirely:

```sh
terraform init -backend=false && terraform validate            # backend.tf
terraform -chdir=bootstrap init -backend=false && terraform -chdir=bootstrap validate
```
