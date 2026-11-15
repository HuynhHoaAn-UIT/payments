import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { PAYMENT_API } from "../services/api";
import { getCart, saveCart } from "../services/cart";
import { money } from "../services/catalog";

const terminal = ["SUCCEEDED", "FAILED"];

function newId() {
  return window.crypto?.randomUUID?.() || String(Date.now());
}

export default function Checkout() {
  const [cart] = useState(getCart());
  const [address, setAddress] = useState("");
  const [mobile, setMobile] = useState("");
  const [method, setMethod] = useState("COD");
  const [showQR, setShowQR] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [demoSuccess, setDemoSuccess] = useState(false);
  const [payment, setPayment] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const submitting = useRef(false);
  const completed = useRef(false);

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );

  const online = method === "MOMO" || method === "BANKING";

  async function placeOrder() {
    if (submitting.current || payment) return;

    if (!address.trim() || !mobile.trim()) {
      toast.warning("Vui lòng nhập địa chỉ và số điện thoại.");
      return;
    }

    if (!cart.length || total <= 0) {
      toast.warning("Giỏ hàng đang trống.");
      return;
    }

    if (method === "COD") {
      toast.info("COD chưa được xử lý vì không chạy Order Service.");
      return;
    }

    submitting.current = true;
    setBusy(true);
    setError("");
    setDemoSuccess(false);
    setTimeLeft(30);
    setShowQR(method === "MOMO");

    const orderId = "demo-" + newId();
    setReference(orderId);

    try {
      const { data } = await PAYMENT_API.post(
        "/v1/payments",
        {
          orderId,
          amount: total,
          currency: "VND",
          method: "MOCK"
        },
        {
          headers: {
            "Idempotency-Key": "payment-" + orderId
          }
        }
      );

      setPayment(data);
      toast.success("Đã tạo giao dịch Payment.");
    } catch (e) {
      console.error("Payment API error:", e);

      const status = e.response?.status;
      const detail =
        e.response?.data?.message ||
        e.response?.data?.error ||
        e.message;

      setError(
        "Chưa tạo được giao dịch Payment. " +
        (status ? "HTTP " + status + ": " : "") +
        String(detail || "Không rõ nguyên nhân") +
        ". Kiểm tra Payment API, proxy/CORS và MySQL."
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!payment?.paymentId || terminal.includes(payment.status)) return;

    let active = true;

    async function poll() {
      try {
        const { data } = await PAYMENT_API.get(
          "/v1/payments/" + encodeURIComponent(payment.paymentId)
        );

        if (active) {
          setPayment(data);
          setError("");
        }
      } catch (e) {
        console.error("Payment polling error:", e);
        if (active) {
          setError("Không kiểm tra được trạng thái Payment API.");
        }
      }
    }

    const timer = setInterval(poll, 3000);

    // QR_COUNTDOWN_TIMER
  useEffect(() => {
    if (!showQR) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showQR]);

  useEffect(() => {
    if (showQR && timeLeft === 0) {
      setShowQR(false);
    }
  }, [showQR, timeLeft]);
  return () => {
      active = false;
      clearInterval(timer);
    };
  }, [payment?.paymentId, payment?.status]);

  useEffect(() => {
    if (payment?.status === "SUCCEEDED" && !completed.current) {
      completed.current = true;
      saveCart([]);
      toast.success("Thanh toán MOCK thành công!");
    }
  }, [payment?.status]);

  // QR_COUNTDOWN_TIMER
  useEffect(() => {
    if (!showQR) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showQR]);

  useEffect(() => {
    if (showQR && timeLeft === 0) {
      setShowQR(false);
    }
  }, [showQR, timeLeft]);
  // DEMO_SUCCESS_TIMER
  useEffect(() => {
    if (!showQR || timeLeft !== 20) return;
    setShowQR(false);
    setDemoSuccess(true);
  }, [showQR, timeLeft]);
  return (
    <main className="container mt-4">
      <h2 className="text-center mb-4">Checkout</h2>

      <div className="row g-4">
        <div className="col-md-7">
          <div className="card shadow p-4">
            <h4 className="mb-3">Delivery Details</h4>

            <textarea
              className="form-control mb-3"
              rows="4"
              placeholder="Enter Delivery Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={!!payment || busy}
            />

            <input
              type="text"
              className="form-control mb-3"
              placeholder="Mobile Number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              disabled={!!payment || busy}
            />

            <select
              className="form-select"
              value={method}
              onChange={(e) => {
                setMethod(e.target.value);
                setShowQR(false);
                setError("");
              }}
              disabled={!!payment || busy}
            >
              <option value="COD">Cash On Delivery</option>
              <option value="MOMO">MoMo</option>
              <option value="BANKING">Banking</option>
            </select>

            {online && (
              <p className="text-muted small mt-2">
                Thanh toán demo: Payment API sử dụng phương thức MOCK.
                QR MoMo là hình cố định trong frontend.
              </p>
            )}
          </div>
        </div>

        <div className="col-md-5">
          <div className="card shadow p-4">
            <h4 className="mb-3">Order Summary</h4>

            {cart.map((item) => (
              <div
                key={item.id}
                className="d-flex justify-content-between mb-2"
              >
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>
                  {money(item.price * item.quantity)}
                </span>
              </div>
            ))}

            <hr />

            <h5>
              Total:{" "}
              <span className="text-success">{money(total)}</span>
            </h5>

            {!payment && (
              <button
                className="btn btn-success w-100 mt-3"
                onClick={placeOrder}
                disabled={busy || !cart.length}
              >
                {busy ? "Creating Payment..." : "Place Order"}
              </button>
            )}

            {showQR && method === "MOMO" && (
              <div className="text-center mt-4">
                <h5>Thanh toán qua MoMo</h5>

                <img
                  src="/images/momo-qr.jpg"
                  alt="Mã QR MoMo"
                  width="260"
                  className="img-fluid border rounded p-2"
                />
                <div className="mt-3">
                  <p className="mb-1">Thời gian còn lại</p>
                  <h3 className="text-danger fw-bold">
                    00:{String(timeLeft).padStart(2, "0")}
                  </h3>
                </div>

                <p className="text-muted small mt-2">
                  Quét mã QR bằng ứng dụng MoMo.
                </p>

                <p className="text-warning small">
                  Đây là QR cố định. Trạng thái Payment MOCK
                  không xác nhận tiền đã chuyển thực tế.
                </p>
              </div>
            )}

            {method === "MOMO" && timeLeft === 0 && (
              <div className="alert alert-warning mt-3 text-center">
                Mã QR đã hết hạn sau 30 giây.
              </div>
            )}

            {demoSuccess && method === "MOMO" && (
              <div className="alert alert-success mt-4 text-center">
                <h4 className="fw-bold">
                  Thanh toán thành công! (Demo)
                </h4>
                <p className="mb-0">
                  Đã mô phỏng thanh toán sau 10 giây.
                </p>
              </div>
            )}
            {payment && (
              <div className="mt-3">
                <p className="small mb-1">
                  Payment ID: <code>{payment.paymentId}</code>
                </p>

                <p className="small mb-1">
                  Reference: <code>{reference}</code>
                </p>

                <div
                  className={
                    "alert mt-3 " +
                    (payment.status === "SUCCEEDED"
                      ? "alert-success"
                      : payment.status === "FAILED"
                      ? "alert-danger"
                      : "alert-warning")
                  }
                >
                  Payment status: <b>{payment.status}</b>
                </div>

                {payment.status === "SUCCEEDED" && (
                  <p className="text-success fw-bold">
                    Thanh toán MOCK thành công!
                  </p>
                )}

                {payment.status === "PENDING" && (
                  <p className="text-muted small">
                    Đang chờ Payment Worker xử lý giao dịch.
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="alert alert-danger mt-3">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
