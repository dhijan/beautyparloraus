// node test-stripe-webhook.js
//
// Guards the one thing that silently breaks this integration: express.json()
// consuming the request body before Stripe can verify the signature over the
// exact bytes it signed. Needs no database and no network — it uses an event
// type the handler ignores, so nothing is written.
//
// For the full path (real session -> order row), use the Stripe CLI:
//   stripe listen --forward-to localhost:5000/api/stripe/webhook
//   stripe trigger checkout.session.completed
const assert = require("assert");
const crypto = require("crypto");

process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_dummy";

const app = require("./src/app");

function sign(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  return `t=${timestamp},v1=${signature}`;
}

async function post(url, payload, signature) {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Stripe-Signature": signature,
    },
    body: payload,
  });
}

async function main() {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));

  const url = `http://127.0.0.1:${server.address().port}/api/stripe/webhook`;

  // An event the handler ignores, so this stays DB-free.
  const payload = JSON.stringify({
    id: "evt_test",
    type: "payment_intent.created",
    data: { object: { id: "pi_test" } },
  });

  try {
    const good = await post(url, payload, sign(payload, "whsec_test_dummy"));
    assert.strictEqual(
      good.status,
      200,
      "valid signature rejected — is the webhook route still mounted on express.raw() before express.json()?"
    );
    assert.deepStrictEqual(await good.json(), { received: true });

    const bad = await post(url, payload, sign(payload, "whsec_wrong_secret"));
    assert.strictEqual(bad.status, 400, "forged signature was accepted");

    const unsigned = await post(url, payload, "");
    assert.strictEqual(unsigned.status, 400, "unsigned payload was accepted");

    console.log("stripe webhook: signature verification OK");
  } finally {
    server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
