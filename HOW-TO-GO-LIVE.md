# Janak Kesh Amrit: how to put the site live

Takes about 20 minutes. Everything here is free.

## 1. Get your Razorpay API keys
1. Log in at dashboard.razorpay.com.
2. Go to **Account & Settings → API Keys** (or Settings → API Keys).
3. Start in **Test Mode** (toggle at the top). Click **Generate Key**.
4. Copy the **Key ID** (starts with `rzp_test_`) and **Key Secret**. The secret is shown only once, so save it somewhere safe.
5. Check that **Payment Capture** is set to **Automatic** (Account & Settings → Payment Capture). It usually is by default.

Never paste the Key Secret into index.html or share it. It only goes into Netlify (step 3).

## 2. Put the site on Netlify
Drag-and-drop doesn't run the payment functions, so use GitHub:

1. Create a free account at github.com. Click **New repository**, name it `janak-kesh-amrit`, keep it Public or Private, and create it.
2. On the new repo page, click **uploading an existing file**. Drag in everything from this folder (index.html, the policy pages, `assets`, `netlify`, `netlify.toml`). Click **Commit changes**.
   - Check that the `netlify/functions` folder uploaded. If your browser skips folders, upload the two files in `netlify/functions` separately and type the path `netlify/functions/` when you name them.
3. Create a free account at app.netlify.com (sign in with GitHub).
4. **Add new site → Import an existing project → GitHub** and pick `janak-kesh-amrit`. Leave the build settings as they are and click **Deploy**.
5. Under **Site configuration → Change site name**, rename it to something like `janakkeshamrit`. Your address becomes `janakkeshamrit.netlify.app`.

## 3. Add your Razorpay keys to Netlify
1. Netlify → your site → **Site configuration → Environment variables → Add a variable**.
2. Add `RAZORPAY_KEY_ID` with your Key ID.
3. Add `RAZORPAY_KEY_SECRET` with your Key Secret.
4. Go to **Deploys → Trigger deploy → Deploy site** so the keys take effect.

## 4. Test it
1. Open your site, pick a size, tap Buy Now and fill in the form.
2. In Test Mode, pay with UPI ID `success@razorpay`, or with card 4111 1111 1111 1111 (any future date, any CVV).
3. You should see "Payment successful". In the Razorpay dashboard under **Transactions → Payments**, the payment shows the customer's name, phone and address in its **Notes**.

## 5. Switch to live payments
1. Razorpay may ask for your website URL during activation. Give them your Netlify address. The site already has the pages they check: Contact, Shipping, Refund & Cancellation, Terms, and Privacy (links in the footer).
2. When your account is activated, switch the dashboard to **Live Mode** and generate live keys (`rzp_live_...`).
3. In Netlify, replace both environment variables with the live keys and trigger a deploy again.
4. Place one small real order yourself to confirm it works.

## Every new order
- Razorpay emails you for each payment, and the customer gets a receipt if they gave an email.
- Open the payment in the Razorpay dashboard. Its **Notes** show the size, quantity, name, phone and full address to ship to.
- Tip: install the Razorpay app on your phone for instant payment alerts.

## Changing prices later
Prices are in two places and must match:
- `index.html` (the `data-price` values on the size buttons)
- `netlify/functions/create-order.js` (the `PRICES` line at the top). **This one decides what the customer is charged.**

After editing on GitHub, Netlify redeploys automatically.
