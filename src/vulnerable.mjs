/**
 * Deliberately vulnerable examples.
 *
 * These functions exist to make each failure easy to reproduce. Do not copy
 * them into an application.
 */

export function vulnerableSelectDocuments({ rows }) {
  // The UI may filter these later, but the data boundary already failed.
  return [...rows];
}

export function vulnerableHandleSuccessPage({ query, entitlements }) {
  const params = new URLSearchParams(query);

  if (params.get("paid") === "true") {
    entitlements.push({
      userId: params.get("user_id"),
      source: "browser-redirect",
    });
  }

  return { status: 200 };
}

export function vulnerableHandleWebhook({ rawBody, entitlements }) {
  // Missing on purpose: signature verification, payload allowlisting,
  // idempotency, and atomic persistence.
  const event = JSON.parse(rawBody);

  entitlements.push({
    userId: event.meta?.custom_data?.user_id,
    orderId: event.data?.id,
    source: "unverified-webhook",
  });

  return { status: 200 };
}
