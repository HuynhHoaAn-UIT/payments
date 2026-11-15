import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { PAYMENT_API } from "../services/api";
import { getCart, saveCart } from "../services/cart";
import { money } from "../services/catalog";

const TERMINAL = ["SUCCEEDED", "FAILED"];
const newId = () => window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function Checkout() {
  const [cart] = useState(getCart());
  const [address, setAddress] = useState("");
  const [mobile, setMobile] = useState("");
  const [method, setMethod] = useState("MOMO");
  const [payment, setPayment] = useState(null);
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const submitting = useRef(false);
  const completed = useRef(false);
  const total = cart.reduce((sum, x) => sum + Number(x.price) * Number(x.quantity), 0);
  const online = method === "MOMO" || method === "BANKING";
  const elapsed = timeLeft === null ? 0 : 30 - timeLeft;
  // Wait at least 10 seconds for the QR demo animation, but NEVER fake backend success.
  const confirmed = payment?.status === "SUCCEEDED";
  const showSuccess = confirmed && elapsed >= 10;
  const showQR = method === "MOMO" && startedAt !== null && timeLeft > 0 && !showSuccess && payment?.status !== "FAILED";
  const expired = startedAt !== null && timeLeft === 0 && !showSuccess;
  
  async function placeOrder() {
    if (submitting.current || payment) return;
    if (!address.trim() || !mobile.trim()) {
      toast.warning("Vui lòng nhập địa chỉ và số điện thoại.");
      return;
    }
    if (!cart.length || total < 1) {
      toast.warning("Giỏ hàng đang trống.");
      return;
    }
    if (method === "COD") {
      toast.info("COD chưa được hỗ trợ vì không triển khai Order Service.");
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError("");
    const orderId = "demo-" + newId();
    try {
      const { data } = await PAYMENT_API.post("/v1/payments",
        { orderId, amount: total, currency: "VND", method: "MOCK" },
        { headers: { "Idempotency-Key": "payment-" + orderId } });
      setReference(orderId);
      setPayment(data);
      setStartedAt(Date.now());
      setTimeLeft(30);
    } catch (e) {
      console.error("Payment API:", e);
      const status = e.response?.status;
      const detail = e.response?.data?.error || e.response?.data?.message || e.message;
      setError(`Không tạo được giao dịch Payment${status ? " (HTTP " + status + ")" : ""}: ${detail}`);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  // Countdown only starts AFTER Payment API successfully creates a transaction.
  useEffect(() => {
    if (startedAt === null || timeLeft === null || timeLeft === 0) return;
    const tick = () => setTimeLeft(Math.max(0, 30 - Math.floor((Date.now() - startedAt) / 1000)));
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [startedAt, timeLeft]);

  useEffect(() => {
    if (!payment?.paymentId || TERMINAL.includes(payment.status)) return;
    let active = true;
    const poll = async () => {
      try {
        const { data } = await PAYMENT_API.get("/v1/payments/" + encodeURIComponent(payment.paymentId));
        if (active) { setPayment(data); setError(""); }
      } catch (e) {
        if (active) setError("Không kiểm tra được trạng thái Payment. Vui lòng thử lại sau.");
      }
    };
    const timer = setInterval(poll, 3000);
    return () => { active = false; clearInterval(timer); };
  }, [payment?.paymentId, payment?.status]);

  useEffect(() => {
    if (showSuccess && !completed.current) {
      completed.current = true;
      saveCart([]);
      toast.success("Thanh toán MOCK thành công!");
    }
  }, [showSuccess]);

  return (
    <main className="container mt-4">
      <h2 className="text-center mb-4">🧾 Checkout</h2>
      <div className="row g-4">
        <div className="col-md-7">
          <div className="card shadow p-4">
            <h4 className="mb-3">Delivery Details</h4>
            <textarea className="form-control mb-3" rows="4" placeholder="Enter Delivery Address"
              value={address} onChange={e => setAddress(e.target.value)} disabled={!!payment || busy} />
            <input type="text" className="form-control mb-3" placeholder="Mobile Number"
              value={mobile} onChange={e => setMobile(e.target.value)} disabled={!!payment || busy} />
            <select className="form-select" value={method} disabled={!!payment || busy}
              onChange={e => { setMethod(e.target.value); setError(""); }}>
              <option value="COD">Cash On Delivery</option>
              <option value="MOMO">MoMo (QR mock)</option>
              <option value="BANKING">Banking (MOCK)</option>
            </select>
            {online && <p className="text-muted small mt-2">
              Demo sử dụng Payment API với method=MOCK. Không xác nhận chuyển tiền MoMo/Banking thật.
            </p>}
          </div>
        </div>
        <div className="col-md-5">
          <div className="card shadow p-4">
            <h4 className="mb-3">Order Summary</h4>
            {cart.map(x => <div key={x.id} className="d-flex justify-content-between mb-2">
              <span>{x.name} × {x.quantity}</span><span>{money(x.price * x.quantity)}</span>
            </div>)}
            <hr />
            <h5>Total: <span className="text-success">{money(total)}</span></h5>
            {!payment && <button className="btn btn-success w-100 mt-3" disabled={busy || !cart.length}
              onClick={placeOrder}>{busy ? "Creating Payment..." : "Place Order"}</button>}
            {showQR && <div className="text-center mt-4">
              <h5>Thanh toán qua MoMo (Demo)</h5>
              <img src="/images/momo-qr.jpg" alt="Mã QR minh họa" width="260"
                className="img-fluid border rounded p-2" />
              <p className="mt-3 mb-1">Thời gian còn lại</p>
              <h3 className="text-danger fw-bold">00:{String(timeLeft).padStart(2, "0")}</h3>
              <p className="small text-muted">QR cố định, không gắn với giao dịch hoặc số tiền.</p>
            </div>}
            {showSuccess && <div className="alert alert-success text-center mt-4">
              <h4 className="fw-bold">Thanh toán thành công! (MOCK)</h4>
              <p className="mb-0">Đã xác nhận trạng thái SUCCEEDED từ Payment API.</p>
            </div>}
            {expired && <div className="alert alert-warning mt-3">
              Hết 30 giây hiển thị QR. Giao dịch vẫn được theo dõi; đây không phải hủy giao dịch.
            </div>}
            {payment && <div className="mt-3">
              <p className="small mb-1">Payment ID: <code>{payment.paymentId}</code></p>
              <p className="small mb-1">Reference: <code>{reference}</code></p>
              <div className={`alert mt-3 ${payment.status === "SUCCEEDED" ? "alert-success" : payment.status === "FAILED" ? "alert-danger" : "alert-warning"}`}>
                Backend status: <strong>{payment.status}</strong>
              </div>
              {payment.status === "SUCCEEDED" && !showSuccess && <p className="small text-muted">
                Backend đã xác nhận MOCK thành công. Đang hoàn tất hiệu ứng QR demo...
              </p>}
            </div>}
            {error && <div className="alert alert-danger mt-3">{error}</div>}
          </div>
        </div>
      </div>
    </main>
  );
}
