// Creates a Razorpay order for the exact amount, calculated here on the server
// so a customer can't change the price in their browser.
// Needs Netlify environment variables: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.

const PRICES = { "100 ml": 499, "500 ml": 2199, "1 Litre": 3999 }; // in rupees, keep in sync with index.html
const MAX_QTY = 10;

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(body),
});
const clean = (v, n) => String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return json(500, { error: "Payments are not set up yet. Please contact us on WhatsApp." });

  let data;
  try { data = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "Bad request" }); }

  const price = PRICES[data.size];
  const qty = parseInt(data.qty, 10);
  if (!price) return json(400, { error: "Please choose a size." });
  if (!(qty >= 1 && qty <= MAX_QTY)) return json(400, { error: "Quantity must be between 1 and " + MAX_QTY + "." });

  const c = data.customer || {};
  const customer = {
    name: clean(c.name, 80),
    phone: clean(c.phone, 15).replace(/\D/g, "").slice(-10),
    email: clean(c.email, 100),
    address: clean(c.address, 200),
    city: clean(c.city, 60),
    state: clean(c.state, 60),
    pincode: clean(c.pincode, 6),
  };
  if (customer.name.length < 2 || !/^[6-9]\d{9}$/.test(customer.phone) || customer.address.length < 5 || !/^[1-9]\d{5}$/.test(customer.pincode)) {
    return json(400, { error: "Please check your name, phone number, address and pincode." });
  }

  const amount = price * qty * 100; // paise
  const receipt = "JKA" + Date.now().toString(36).toUpperCase();

  // Razorpay allows max 15 notes of 256 chars each. These show up on the payment in your dashboard.
  const notes = {
    product: "Janak Kesh Amrit " + data.size + " x " + qty,
    name: customer.name,
    phone: customer.phone,
    email: customer.email || "-",
    address: customer.address.slice(0, 250),
    city_state: (customer.city + ", " + customer.state).slice(0, 250),
    pincode: customer.pincode,
  };

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(keyId + ":" + keySecret).toString("base64"),
    },
    body: JSON.stringify({ amount, currency: "INR", receipt, notes }),
  });
  const order = await res.json().catch(() => ({}));
  if (!res.ok || !order.id) {
    console.error("Razorpay order error", res.status, order && order.error);
    return json(502, { error: "Could not start the payment. Please try again in a moment." });
  }

  return json(200, { order_id: order.id, amount: order.amount, receipt, key_id: keyId });
};
