import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";

const SettlementPage = () => {
  const { tripId } = useParams();
  const { user } = useAuth();
  const [settlement, setSettlement] = useState(null);
  const [error, setError] = useState("");
  const [upiMap, setUpiMap] = useState({});
  const [paidTransactions, setPaidTransactions] = useState({});
  const [qrPayload, setQrPayload] = useState(null);

  const getUpiBaseQuery = (transaction, upiId) => {
    const params = new URLSearchParams({
      pa: upiId,
      pn: transaction.to,
      am: Number(transaction.amount).toFixed(2),
      tn: `Trip settlement from ${transaction.from}`,
      cu: "INR",
    });
    return params.toString();
  };

  const getGPayLink = (transaction, upiId) => {
    const query = getUpiBaseQuery(transaction, upiId);
    return `intent://pay?${query}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;
  };

  const getPhonePeLink = (transaction, upiId) => {
    const query = getUpiBaseQuery(transaction, upiId);
    return `intent://pay?${query}#Intent;scheme=upi;package=com.phonepe.app;end`;
  };

  const getStandardUpiLink = (transaction, upiId) => `upi://pay?${getUpiBaseQuery(transaction, upiId)}`;

  useEffect(() => {
    const fetchSettlement = async () => {
      try {
        const { data } = await api.get(`/settle/${tripId}`);
        setSettlement(data);
        
        // Pre-populate UPI IDs from members
        if (data.members) {
          const prefilledUpiMap = {};
          data.members.forEach((member) => {
            prefilledUpiMap[member._id] = member.upiId || "";
          });
          setUpiMap(prefilledUpiMap);
        }
      } catch (apiError) {
        setError(apiError.response?.data?.message || "Unable to calculate settlement");
      }
    };

    fetchSettlement();
  }, [tripId]);

  return (
    <AppLayout title="Settlement" subtitle="Review who should pay and the optimized final transactions.">
      {error && <p className="error-text">{error}</p>}
      {!settlement && !error && <p className="muted">Calculating settlement...</p>}

      {settlement && (
        <section className="grid">
          <article className="card report-panel">
            <h2>{settlement.trip.name}</h2>
            <div className="stats-grid">
              <div className="stat-tile">
                <strong>Rs.{settlement.totalSpend.toFixed(2)}</strong>
                <span>Total Spend</span>
              </div>
              <div className="stat-tile success">
                <strong>Rs.{settlement.perPersonShare.toFixed(2)}</strong>
                <span>Per Person Share</span>
              </div>
              <div className="stat-tile warning">
                <strong>{settlement.transactions.length}</strong>
                <span>Optimized Transactions</span>
              </div>
            </div>
          </article>

          <article className="card report-panel">
            <h2>Optimized Transaction</h2>
            <p className="muted">Only minimum optimized transactions are shown below.</p>
            {settlement.transactions.length === 0 ? (
              <p className="muted">No one has to pay anyone. Everything is settled successfully.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Payer Name</th>
                      <th>Pay Amount</th>
                      <th>To</th>
                      <th>Receiver UPI ID</th>
                      <th>Pay Via</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlement.transactions.map((transaction, index) => {
                      const transactionKey = `${transaction.fromUserId}-${transaction.toUserId}-${index}`;
                      const receiverUpiId = upiMap[transaction.toUserId] || "";
                      const canPay = receiverUpiId.trim().length > 0;
                      const isPaid = paidTransactions[transactionKey];

                      return (
                        <tr key={transactionKey}>
                          <td>{transaction.from}</td>
                          <td>Rs.{Number(transaction.amount).toFixed(2)}</td>
                          <td>{transaction.to}</td>
                          <td>
                            <input
                              className="input-compact"
                              value={receiverUpiId}
                              placeholder="name@bank"
                              disabled={isPaid}
                              onChange={(event) =>
                                setUpiMap((prev) => ({ ...prev, [transaction.toUserId]: event.target.value }))
                              }
                            />
                          </td>
                          <td>
                            <div className="pay-actions">
                              <a
                                className={`mini-btn ${!canPay || isPaid ? "disabled" : ""}`}
                                href={canPay && !isPaid ? getGPayLink(transaction, receiverUpiId) : undefined}
                                onClick={(event) => {
                                  if (!canPay || isPaid) event.preventDefault();
                                }}
                              >
                                GPay
                              </a>
                              <a
                                className={`mini-btn ${!canPay || isPaid ? "disabled" : ""}`}
                                href={canPay && !isPaid ? getPhonePeLink(transaction, receiverUpiId) : undefined}
                                onClick={(event) => {
                                  if (!canPay || isPaid) event.preventDefault();
                                }}
                              >
                                PhonePe
                              </a>
                              <button
                                type="button"
                                className="mini-btn"
                                disabled={!canPay || isPaid}
                                onClick={() => {
                                  if (canPay && !isPaid) {
                                    setQrPayload({
                                      upiLink: getStandardUpiLink(transaction, receiverUpiId),
                                      payer: transaction.from,
                                      receiver: transaction.to,
                                      amount: Number(transaction.amount).toFixed(2),
                                    });
                                  }
                                }}
                              >
                                QR
                              </button>
                            </div>
                          </td>
                          <td>
                            <div className="status-cell">
                              {isPaid ? (
                                <>
                                  <span className="status-badge paid">✓ Paid</span>
                                  {user?.id === transaction.toUserId && (
                                    <button
                                      type="button"
                                      className="status-btn unmark"
                                      onClick={() =>
                                        setPaidTransactions((prev) => ({
                                          ...prev,
                                          [transactionKey]: false,
                                        }))
                                      }
                                    >
                                      Unmark
                                    </button>
                                  )}
                                </>
                              ) : (
                                <>
                                  <span className="status-badge unpaid">Unpaid</span>
                                  {user?.id === transaction.toUserId && (
                                    <button
                                      type="button"
                                      className="status-btn mark"
                                      onClick={() =>
                                        setPaidTransactions((prev) => ({
                                          ...prev,
                                          [transactionKey]: true,
                                        }))
                                      }
                                    >
                                      Mark Paid
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <p className="muted settlement-note">
              Tip: App redirection works best on mobile devices.
            </p>
          </article>
        </section>
      )}

      {qrPayload && (
        <div className="qr-overlay" onClick={() => setQrPayload(null)}>
          <div className="qr-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Scan to Pay</h3>
            <p className="muted">
              {qrPayload.payer} pays Rs.{qrPayload.amount} to {qrPayload.receiver}
            </p>
            <div className="qr-code-wrap">
              <QRCodeSVG value={qrPayload.upiLink} size={220} includeMargin />
            </div>
            <p className="muted">Open any UPI app on phone and scan this QR code.</p>
            <button type="button" className="btn btn-primary" onClick={() => setQrPayload(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default SettlementPage;
