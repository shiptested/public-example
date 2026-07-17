import test from "node:test";
import assert from "node:assert/strict";
import {
  createCommerceState,
  handleSuccessPage,
  handleVerifiedOrderWebhook,
  selectOwnDocuments,
  signWebhook,
} from "../src/fixed.mjs";

const secret = "test-only-webhook-secret";
const expectedStoreId = 42;
const expectedVariantId = 9001;
const expectedTestMode = true;

function orderCreatedFixture(overrides = {}) {
  return {
    meta: {
      event_name: "order_created",
      custom_data: { user_id: "user-a" },
    },
    data: {
      type: "orders",
      id: "101",
      attributes: {
        store_id: expectedStoreId,
        status: "paid",
        test_mode: expectedTestMode,
        first_order_item: {
          variant_id: expectedVariantId,
          test_mode: expectedTestMode,
        },
      },
    },
    ...overrides,
  };
}

test("RLS policy model: user B receives zero rows owned by user A", () => {
  const rows = [
    { id: "doc-a", userId: "user-a", title: "A private draft" },
    { id: "doc-b", userId: "user-b", title: "B private draft" },
  ];

  const visible = selectOwnDocuments({
    requestingUserId: "user-b",
    rows,
  });

  assert.deepEqual(visible.map((row) => row.id), ["doc-b"]);
});

test("success-page visit creates no entitlement", () => {
  const entitlements = [];
  const result = handleSuccessPage({
    query: "paid=true&user_id=user-b",
    entitlements,
  });

  assert.equal(result.access, "pending-verified-webhook");
  assert.equal(entitlements.length, 0);
});

test("invalid signature is rejected before state changes", () => {
  const state = createCommerceState();
  const rawBody = JSON.stringify(orderCreatedFixture());

  const result = handleVerifiedOrderWebhook({
    rawBody,
    signature: "not-a-valid-signature",
    secret,
    expectedStoreId,
    expectedVariantId,
    expectedTestMode,
    state,
  });

  assert.equal(result.status, 401);
  assert.equal(state.entitlements.size, 0);
  assert.equal(state.processedEvents.size, 0);
});

test("same signed order webhook five times grants exactly once", () => {
  const state = createCommerceState();
  const rawBody = JSON.stringify(orderCreatedFixture());
  const signature = signWebhook(rawBody, secret);
  const outcomes = [];

  for (let attempt = 0; attempt < 5; attempt += 1) {
    outcomes.push(
      handleVerifiedOrderWebhook({
        rawBody,
        signature,
        secret,
        expectedStoreId,
        expectedVariantId,
        expectedTestMode,
        state,
      }).outcome,
    );
  }

  assert.deepEqual(outcomes, [
    "granted-once",
    "duplicate-no-op",
    "duplicate-no-op",
    "duplicate-no-op",
    "duplicate-no-op",
  ]);
  assert.equal(state.entitlements.size, 1);
  assert.equal(state.processedEvents.size, 1);
});

test("signed event for an unexpected variant grants nothing", () => {
  const state = createCommerceState();
  const fixture = orderCreatedFixture();
  fixture.data.attributes.first_order_item.variant_id = 1234;
  const rawBody = JSON.stringify(fixture);
  const signature = signWebhook(rawBody, secret);

  const result = handleVerifiedOrderWebhook({
    rawBody,
    signature,
    secret,
    expectedStoreId,
    expectedVariantId,
    expectedTestMode,
    state,
  });

  assert.equal(result.status, 422);
  assert.equal(result.outcome, "payload-not-allowed");
  assert.equal(state.entitlements.size, 0);
});
