import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import AppLayout from "../components/AppLayout";

const DashboardPage = () => {
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [error, setError] = useState("");
  const [inviteQuery, setInviteQuery] = useState("");
  const [inviteResults, setInviteResults] = useState([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [invitingUserId, setInvitingUserId] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");

  const selectedTrip = useMemo(
    () => trips.find((trip) => trip._id === selectedTripId),
    [trips, selectedTripId]
  );

  const totalSpend = useMemo(
    () => expenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
    [expenses]
  );

  const perPersonShare = useMemo(() => {
    const count = selectedTrip?.members?.length || 0;
    return count ? totalSpend / count : 0;
  }, [selectedTrip, totalSpend]);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const { data } = await api.get("/trips");
        setTrips(data);
        if (data.length > 0) {
          setSelectedTripId(data[0]._id);
        }
      } catch (apiError) {
        setError(apiError.response?.data?.message || "Failed to load trips");
      }
    };

    fetchTrips();
  }, []);

  useEffect(() => {
    const fetchExpenses = async () => {
      if (!selectedTripId) {
        setExpenses([]);
        return;
      }

      try {
        const { data } = await api.get(`/expenses/${selectedTripId}`);
        setExpenses(data);
      } catch (apiError) {
        setError(apiError.response?.data?.message || "Failed to load expenses");
      }
    };

    fetchExpenses();
  }, [selectedTripId]);

  useEffect(() => {
    const query = inviteQuery.trim();
    if (!selectedTripId || query.length < 2) {
      setInviteResults([]);
      return undefined;
    }

    const timeoutId = setTimeout(async () => {
      setInviteLoading(true);
      setError("");
      try {
        const { data } = await api.get(`/trips/${selectedTripId}/invite/search-users`, {
          params: { q: query },
        });
        setInviteResults(data);
      } catch (apiError) {
        setError(apiError.response?.data?.message || "Failed to search users");
      } finally {
        setInviteLoading(false);
      }
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [inviteQuery, selectedTripId]);

  useEffect(() => {
    setInviteQuery("");
    setInviteResults([]);
    setInviteMessage("");
  }, [selectedTripId]);

  const handleInvite = async (userId) => {
    if (!selectedTripId) {
      return;
    }

    setInvitingUserId(userId);
    setInviteMessage("");
    setError("");

    try {
      await api.post(`/trips/${selectedTripId}/invitations`, { userId });
      setInviteResults((prev) => prev.filter((user) => user._id !== userId));
      setInviteMessage("Invitation sent");
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to send invitation");
    } finally {
      setInvitingUserId("");
    }
  };

  return (
    <AppLayout title="Dashboard" subtitle="Track trip reports, total spend, and optimized settlements.">
      <section className="grid two-col">
        <article className="card report-panel">
          <h2>Trip List</h2>
          {trips.length === 0 && <p className="muted">No trips yet. Create one now.</p>}
          <ul className="list">
            {trips.map((trip) => (
              <li key={trip._id}>
                <button
                  type="button"
                  className={`list-item ${trip._id === selectedTripId ? "active" : ""}`}
                  onClick={() => setSelectedTripId(trip._id)}
                >
                  <span>{trip.name}</span>
                  <small>{trip.members.length} members</small>
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article className="card report-panel">
          <h2>Trip Overview</h2>
          {!selectedTrip && <p className="muted">Select a trip to view details.</p>}
          {selectedTrip && (
            <>
              <div className="stats-grid">
                <div className="stat-tile">
                  <strong>Rs.{totalSpend.toFixed(2)}</strong>
                  <span>Total Spend</span>
                </div>
                <div className="stat-tile success">
                  <strong>Rs.{perPersonShare.toFixed(2)}</strong>
                  <span>Per Person Share</span>
                </div>
                <div className="stat-tile warning">
                  <strong>{selectedTrip.members.length}</strong>
                  <span>Total Members</span>
                </div>
              </div>
              <p className="muted">
                Members: {selectedTrip.members.map((m) => m.name).join(", ")}
              </p>
              <div className="row gap-sm">
                <Link to={`/trips/${selectedTrip._id}/expenses/add`} className="btn btn-primary">
                  Add Expense
                </Link>
                <Link to={`/trips/${selectedTrip._id}/settlement`} className="btn btn-secondary">
                  View Settlement
                </Link>
              </div>

              <div className="invite-panel">
                <h3>Invite Members</h3>
                <input
                  value={inviteQuery}
                  onChange={(event) => setInviteQuery(event.target.value)}
                  placeholder="Search user by name or email"
                />

                {inviteLoading && <p className="muted">Searching users...</p>}
                {!inviteLoading && inviteQuery.trim().length >= 2 && inviteResults.length === 0 && (
                  <p className="muted">No users available for invite.</p>
                )}

                <ul className="list invite-search-list">
                  {inviteResults.map((user) => (
                    <li key={user._id} className="invite-search-item">
                      <div>
                        <strong>{user.name}</strong>
                        <p className="muted">{user.email}</p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={invitingUserId === user._id}
                        onClick={() => handleInvite(user._id)}
                      >
                        {invitingUserId === user._id ? "Sending..." : "Invite"}
                      </button>
                    </li>
                  ))}
                </ul>

                {inviteMessage && <p className="success-text">{inviteMessage}</p>}
              </div>
            </>
          )}
        </article>
      </section>

      <section className="card report-panel">
        <h2>Expense Report</h2>
        {expenses.length === 0 && <p className="muted">No expenses added for this trip yet.</p>}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Paid By</th>
                <th>Participants</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense._id}>
                  <td>{expense.description || "-"}</td>
                  <td>{expense.category || "general"}</td>
                  <td>{expense.paidBy?.name}</td>
                  <td>{expense.participants.map((p) => p.name).join(", ")}</td>
                  <td>Rs.{Number(expense.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {error && <p className="error-text">{error}</p>}
    </AppLayout>
  );
};

export default DashboardPage;
