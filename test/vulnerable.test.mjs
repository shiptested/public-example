import test from "node:test";
import assert from "node:assert/strict";
import {
  vulnerableHandleSuccessPage,
  vulnerableHandleWebhook,
  vulnerableSelectDocuments,
} from "../src/vulnerable.mjs";

const documents = [
  { id: "doc-a", userId: "user-a", title: "A private draft" },
  { id: "doc-b", userId: "user-b", title: "B private draft" },
];

test("exploit proof: user B can read user A's row", () => {
  const visible = vulnerableSelectDocuments({
    requestingUserId: "user-b",
    rows: documents,
  });

  assert.equal(visible.some((row) => row.userId === "user-a"), true);
});

test("exploit proof: a typed success URL grants access", () => {
  const entitlements = [];

  vulnerableHandleSuccessPage({
    query: "paid=true&user_id=user-b",
    entitlements,
  });

  assert.equal(entitlements.length, 1);
  assert.equal(entitlements[0].source, "browser-redirect");
});

test("exploit proof: replaying one webhook grants five times", () => {
  const entitlements = [];
  const rawBody = JSON.stringify({
    meta: {
      event_name: "order_created",
      custom_data: { user_id: "user-a" },
    },
    data: {
      type: "orders",
      id: "order-101",
      attributes: {
        status: "paid",
      },
    },
  });

  for (let attempt = 0; attempt < 5; attempt += 1) {
    vulnerableHandleWebhook({ rawBody, entitlements });
  }

  assert.equal(entitlements.length, 5);
});
