# ShipTested Launch Failures

Three small, executable examples for failures that hide in working AI-built SaaS prototypes:

1. user B can read user A's rows;
2. a typed checkout success URL grants access;
3. replaying one order webhook grants access more than once.

The repository pairs each deliberately vulnerable implementation with a fixed invariant and an automated test.

## Run it

Requirements: Node.js 20 or newer. There are no package dependencies.

```bash
git clone https://github.com/shiptested/public-example.git
cd public-example
npm test
```

Then explore the demonstrations:

```bash
npm run demo
npm run test:launch
npm run test:failures
```

`npm run test:failures` runs exploit demonstrations. Those tests pass when the deliberately vulnerable behavior is successfully reproduced; they are not launch approval.

## What each example proves

| Failure | Vulnerable behavior | Fixed invariant |
|---|---|---|
| RLS | the data function returns every row | the policy model returns only the requesting user's rows |
| Checkout | browser query parameters create an entitlement | the success page can only show a pending state |
| Webhook | an unsigned event grants on every delivery | HMAC verification, payload allowlisting, and a dedupe key grant once |

The webhook fixture follows Lemon Squeezy's documented `order_created` JSON:API shape, including `meta.event_name`, `meta.custom_data`, order status, store ID, variant ID, and test mode.

## Important boundary

This is a teaching harness, not a production SaaS and not a security certification.

- The RLS JavaScript test is a policy model. The accompanying SQL shows the Supabase policy shape, but a real project must also test its migrations against Postgres through ordinary authenticated clients or Supabase pgTAP tests.
- The entitlement store is in memory. A production handler needs a database transaction and unique constraints for processed events and entitlements.
- The checkout example demonstrates what must not happen on a redirect. A later reference app will include the server-created checkout endpoint.
- Test fixtures contain no live credentials. Never paste production secrets into examples, logs, screenshots, or issues.

## Read the diff

- Deliberately unsafe: [`src/vulnerable.mjs`](src/vulnerable.mjs)
- Fixed invariants: [`src/fixed.mjs`](src/fixed.mjs)
- Exploit demonstrations: [`test/vulnerable.test.mjs`](test/vulnerable.test.mjs)
- Launch checks: [`test/fixed.test.mjs`](test/fixed.test.mjs)
- RLS policy shape: [`sql/fixed.sql`](sql/fixed.sql)

## Sources

- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase database testing](https://supabase.com/docs/guides/database/testing)
- [Lemon Squeezy webhook requests](https://docs.lemonsqueezy.com/help/webhooks/webhook-requests)
- [Lemon Squeezy webhook signing](https://docs.lemonsqueezy.com/help/webhooks/signing-requests)
- [Lemon Squeezy order object](https://docs.lemonsqueezy.com/api/orders/the-order-object)

Built by [ShipTested](https://shiptested.github.io): launch-readiness for vibe-coded SaaS.
