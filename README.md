# ShipTested — launch failures you can run

Three failures that hide in working, AI-built Next.js + Supabase apps — each reproduced with a
deliberately vulnerable version, a fixed version, and the test that tells them apart.

No dependencies. Node.js 20+. See red turn green in about a minute:

```bash
git clone https://github.com/shiptested/public-example.git
cd public-example
npm test
```

Expected output:

```text
✓ RLS policy model: user B receives zero rows owned by user A
✓ success-page visit creates no entitlement
✓ invalid signature is rejected before state changes
✓ same signed order webhook five times grants exactly once
✓ signed event for an unexpected variant grants nothing
```

## The three failures

1. **RLS — user B can read user A's rows.** A UI that filters by user is not proof the database
   rejects a direct request for someone else's row.
   [Read the teardown](https://shiptested.github.io/articles/supabase-rls-two-user-test/)
2. **Checkout — a typed success URL grants access.** A redirect is not a receipt; entitlement must
   come from a verified event.
   [Read the teardown](https://shiptested.github.io/articles/success-url-not-proof-of-payment/)
3. **Webhook — one purchase, many grants.** Replay one signed order event five times; you should
   still grant access exactly once.
   [Read the teardown](https://shiptested.github.io/articles/webhook-idempotency/)

## Explore

```bash
npm run demo            # narrated walk-through
npm run test:failures   # exploit demonstrations (pass = vulnerability reproduced)
npm run test:launch     # the fixed invariants
```

`npm run test:failures` passes when the deliberately vulnerable behavior is successfully
reproduced. That is exploit evidence, not launch approval.

Read the diffs side by side:

- Deliberately unsafe: [`src/vulnerable.mjs`](src/vulnerable.mjs)
- Fixed invariants: [`src/fixed.mjs`](src/fixed.mjs)
- Exploit demonstrations: [`test/vulnerable.test.mjs`](test/vulnerable.test.mjs)
- Launch checks: [`test/fixed.test.mjs`](test/fixed.test.mjs)
- RLS policy shape: [`sql/fixed.sql`](sql/fixed.sql)

The webhook fixture follows Lemon Squeezy's documented `order_created` JSON:API shape
(`meta.event_name`, `meta.custom_data`, order status, store ID, variant ID, test mode).

## What this is — and is not

A teaching harness, not a production SaaS and not a security certification.

- The RLS check is a JavaScript **policy model**. The accompanying SQL shows the Supabase policy
  shape, but a real project must still test its migrations against Postgres through ordinary
  authenticated clients or Supabase pgTAP tests.
- The entitlement store is in memory. A production handler needs a database transaction and unique
  constraints for processed events and entitlements.
- The checkout example demonstrates what must **not** happen on a redirect. The server-created
  checkout endpoint belongs to a fuller reference app.
- Fixtures contain no live credentials. Never paste production secrets into examples, logs,
  screenshots, or issues.

## Going further

The three failures above are drawn from a longer, free
[Launch Readiness Checklist](https://shiptested.github.io/checklist/) — 20 pass/fail money-path
checks for a paid Next.js + Supabase app.

ShipTested uses AI heavily to produce this material and verifies the technical examples by running
them. There are no fake testimonials and no guaranteed outcomes — the point is that you run the
tests yourself instead of trusting an author.

## Sources

- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase database testing](https://supabase.com/docs/guides/database/testing)
- [Lemon Squeezy webhook requests](https://docs.lemonsqueezy.com/help/webhooks/webhook-requests)
- [Lemon Squeezy webhook signing](https://docs.lemonsqueezy.com/help/webhooks/signing-requests)
- [Lemon Squeezy order object](https://docs.lemonsqueezy.com/api/orders/the-order-object)

Built by [ShipTested](https://shiptested.github.io) — launch-readiness for vibe-coded SaaS.
