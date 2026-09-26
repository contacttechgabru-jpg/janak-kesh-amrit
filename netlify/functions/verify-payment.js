// Checks Razorpay's signature so we know the payment really came from Razorpay.
const crypto = require("crypto");

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return json(500, { error: "Not configured" });

  let d;
  try { d = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "Bad request" }); }
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = d;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return json(400, { error: "Missing fields" });

  const expected = crypto.createHmac("sha256", secret).update(razorpay_order_id + "|" + razorpay_payment_id).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(String(razorpay_signature));
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!ok) return json(400, { error: "Signature mismatch" });

  console.log("Verified payment", razorpay_payment_id, "for order", razorpay_order_id);
  return json(200, { ok: true });
};
