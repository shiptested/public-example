import { createHmac, timingSafeEqual } from "node:crypto";

export function selectOwnDocuments({ requestingUserId, rows }) {
  return rows.filter((row) => row.userId === requestingUserId);
}

export function handleSuccessPage() {
  // A redirect can explain what happens next. It cannot prove payment or
  // create an entitlement.
  return {
    status: 200,
    access: "pending-verified-webhook",
  };
}

export function signWebhook(rawBody, secret) {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}

export function verifyWebhookSignature(rawBody, signature, secret) {
  if (
    typeof rawBody !== "string" ||
    typeof signature !== "string" ||
    typeof secret !== "string" ||
    signature.length === 0 ||
    secret.length === 0
  ) {
    return false;
  }

  const expected = Buffer.from(signWebhook(rawBody, secret), "utf8");
  const received = Buffer.from(signature, "utf8");

  return (
    expected.length === received.length &&
    timingSafeEqual(expected, received)
  );
}

export function createCommerceState() {
  return {
    processedEvents: new Set(),
    entitlements: new Map(),
  };
}

export function handleVerifiedOrderWebhook({
  rawBody,
  signature,
  secret,
  expectedStoreId,
  expectedVariantId,
  expectedTestMode,
  state,
}) {
  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    return { status: 401, outcome: "invalid-signature" };
  }

  let event;

  try {
    event = JSON.parse(rawBody);
  } catch {
    return { status: 400, outcome: "invalid-json" };
  }

  const eventName = event.meta?.event_name;
  const customUserId = event.meta?.custom_data?.user_id;
  const order = event.data;
  const attributes = order?.attributes;
  const item = attributes?.first_order_item;

  const payloadAllowed =
    eventName === "order_created" &&
    order?.type === "orders" &&
    typeof order?.id === "string" &&
    attributes?.status === "paid" &&
    attributes?.store_id === expectedStoreId &&
    item?.variant_id === expectedVariantId &&
    attributes?.test_mode === expectedTestMode &&
    item?.test_mode === expectedTestMode &&
    typeof customUserId === "string" &&
    customUserId.length > 0;

  if (!payloadAllowed) {
    return { status: 422, outcome: "payload-not-allowed" };
  }

  const eventKey = `${eventName}:${order.type}:${order.id}`;

  if (state.processedEvents.has(eventKey)) {
    return { status: 200, outcome: "duplicate-no-op" };
  }

  const entitlementKey = `${customUserId}:${expectedVariantId}`;

  // A production implementation needs a database transaction plus unique
  // constraints on both eventKey and entitlementKey. This in-memory state
  // demonstrates the invariant, not the persistence mechanism.
  state.processedEvents.add(eventKey);
  state.entitlements.set(entitlementKey, {
    userId: customUserId,
    orderId: order.id,
    variantId: expectedVariantId,
    source: "verified-order-webhook",
  });

  return { status: 200, outcome: "granted-once" };
}
