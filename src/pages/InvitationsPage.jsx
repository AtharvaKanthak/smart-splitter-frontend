import { useEffect, useState } from "react";
import api from "../api/client";
import AppLayout from "../components/AppLayout";

const InvitationsPage = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [message, setMessage] = useState("");

  const fetchInvitations = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/trips/invitations/me");
      setInvitations(data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to fetch invitations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const respondToInvite = async (invitationId, action) => {
    setActionLoadingId(invitationId);
    setMessage("");
    setError("");

    try {
      await api.post(`/trips/invitations/${invitationId}/respond`, { action });
      setInvitations((prev) => prev.filter((invite) => invite.invitationId !== invitationId));
      setMessage(action === "accept" ? "Invitation accepted successfully" : "Invitation rejected");
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to respond to invitation");
    } finally {
      setActionLoadingId("");
    }
  };

  return (
    <AppLayout title="Invitations" subtitle="Accept invites to become a trip member.">
      <section className="card report-panel">
        <h2>Pending Invitations</h2>

        {loading && <p className="muted">Loading invitations...</p>}
        {!loading && invitations.length === 0 && <p className="muted">No pending invitations right now.</p>}

        <ul className="list invite-list">
          {invitations.map((invite) => (
            <li key={invite.invitationId} className="invite-item">
              <div>
                <strong>{invite.trip.name}</strong>
                <p className="muted">
                  Invited by {invite.invitedBy?.name || "Trip Member"}
                  {invite.invitedBy?.email ? ` (${invite.invitedBy.email})` : ""}
                </p>
              </div>
              <div className="row gap-sm">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={actionLoadingId === invite.invitationId}
                  onClick={() => respondToInvite(invite.invitationId, "reject")}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={actionLoadingId === invite.invitationId}
                  onClick={() => respondToInvite(invite.invitationId, "accept")}
                >
                  Accept
                </button>
              </div>
            </li>
          ))}
        </ul>

        {message && <p className="success-text">{message}</p>}
        {error && <p className="error-text">{error}</p>}
      </section>
    </AppLayout>
  );
};

export default InvitationsPage;