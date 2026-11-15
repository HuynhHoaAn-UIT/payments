# ShopSphere Payment-only Demo UI

This is an **adaptation** of the existing `Frontend` pages and Bootstrap styling in [PhuSon26/ShopSphere_E-Commerce](https://github.com/PhuSon26/ShopSphere_E-Commerce), not a newly designed storefront. It calls **only Payment Service**. No Order Service, Product Service or Auth Service is required.

## Run on Windows

```powershell
Copy-Item .env.example .env
npm install
npm start
```

Open http://localhost:3000. The `proxy` in `package.json` forwards `/api/...` to `http://localhost:8084` for local development. If your backend is elsewhere, update `proxy` and restart npm. For S3/static deployment, configure `REACT_APP_PAYMENT_API_BASE` at build time to a reachable API gateway/ALB origin and enable CORS or same-origin routing.

## What works / backend contract

- Original-looking ShopSphere pages Products → Cart → Checkout, with a **local sample catalog and localStorage cart** because no Product/Order backend is running. Sample names are based on products visible in the user's screenshot, **not fetched from the source repository**.
- Checkout fields and two-column layout follow the original `Frontend/src/pages/Checkout.js`.
- Payment selector: Cash On Delivery, MoMo (QR mock), Banking (QR mock).
- COD: only displays a notice, because no Order Service exists to persist COD orders.
- MoMo/Banking: POST `/api/v1/payments` with header `Idempotency-Key`, JSON `{orderId,amount,currency:'VND',method:'MOCK'}`. This matches `PaymentController.java`, `CreatePaymentRequest.java`, and `PaymentMethod.java` in the source backend. **Both options use MOCK**, not actual MoMo/bank payments.
- Static bundled `public/mock-payment-qr.svg` is **illustrative**. It is not linked to a payment provider and scanning it cannot transfer funds.
- Poll GET `/api/v1/payments/{paymentId}` every 3 seconds, display actual status, never fake SUCCEEDED.
- The original Payment API creates PENDING. Its **Payment Worker must run** (`APP_ROLE=worker`) for MOCK to reach SUCCEEDED. If the worker is absent, status remains PENDING. This frontend cannot replace the worker.
- No Order row is created; the `orderId` is a unique demo reference required by Payment API.

## Backend prerequisites

Run the original Payment API with its MySQL DB and a Payment Worker, or modify backend to process MOCK within API. Ensure backend port is 8084 and the `PaymentMethod.MOCK` gateway is enabled. The API and worker must share the same database. No backend code is included in this ZIP.

## Attribution

UI layout, navigation, component structure and Checkout form adapted from ShopSphere_E-Commerce/Frontend. Modifications: local cart/catalog, payment-only API integration, static QR image and status polling.
