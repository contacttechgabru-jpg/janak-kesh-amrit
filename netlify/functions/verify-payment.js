// Checks Razorpay's signature so we know the payment really came from Razorpay,
// then records the confirmed order in Netlify Forms ("orders"), which emails it to you.
const crypto = require("crypto");

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(body),
});

async function recordOrder(orderId, paymentId) {
  const auth = "Basic " + Buffer.from(process.env.RAZORPAY_KEY_ID + ":" + process.env.RAZORPAY_KEY_SECRET).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders/" + orderId, { headers: { Authorization: auth } });
  const order = await res.json();
  if (!res.ok) throw new Error("Order fetch failed: " + res.status);
  const n = order.notes || {};
  const form = new URLSearchParams({
    "form-name": "orders",
    order: order.receipt || orderId,
    payment_id: paymentId,
    amount: "Rs " + (order.amount_paid || order.amount) / 100,
    product: n.product || "",
    name: n.name || "",
    phone: n.phone || "",
    email: n.email || "",
    address: n.address || "",
    city_state: n.city_state || "",
    pincode: n.pincode || "",
  });
  const site = process.env.URL || "https://janakkeshamrit.netlify.app";
  const r = await fetch(site + "/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  console.log("Order recorded", order.receipt, "form status", r.status);
}

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
  try { await recordOrder(razorpay_order_id, razorpay_payment_id); }
  catch (e) { console.error("Could not record order", e.message); }
  return json(200, { ok: true });
};
