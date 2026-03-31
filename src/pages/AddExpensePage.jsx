import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/client";
import AppLayout from "../components/AppLayout";

const AddExpensePage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [formData, setFormData] = useState({
    amount: "",
    paidBy: "",
    participants: [],
    category: "food",
    description: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const { data } = await api.get(`/trips/${tripId}`);
        setTrip(data);
        setFormData((prev) => ({
          ...prev,
          paidBy: data.members[0]?._id || "",
          participants: data.members.map((member) => member._id),
        }));
      } catch (apiError) {
        setError(apiError.response?.data?.message || "Unable to fetch trip");
      }
    };

    fetchTrip();
  }, [tripId]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleParticipant = (memberId) => {
    setFormData((prev) => {
      if (prev.participants.includes(memberId)) {
        return {
          ...prev,
          participants: prev.participants.filter((id) => id !== memberId),
        };
      }

      return {
        ...prev,
        participants: [...prev.participants, memberId],
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.participants.length === 0) {
      setError("Select at least one participant");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await api.post("/expenses/add", {
        tripId,
        amount: Number(formData.amount),
        paidBy: formData.paidBy,
        participants: formData.participants,
        category: formData.category,
        description: formData.description,
      });
      navigate("/dashboard");
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to add expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Add Expense" subtitle="Capture who paid and who participated in each expense.">
      <form className="card" onSubmit={handleSubmit}>
        <h2>{trip?.name}</h2>

        <label>
          Amount
          <input
            required
            type="number"
            step="0.01"
            min="0"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            placeholder="1200"
          />
        </label>

        <label>
          Paid By
          <select name="paidBy" value={formData.paidBy} onChange={handleInputChange} required>
            {trip?.members.map((member) => (
              <option key={member._id} value={member._id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Category
          <select name="category" value={formData.category} onChange={handleInputChange}>
            <option value="food">Food</option>
            <option value="travel">Travel</option>
            <option value="hotel">Hotel</option>
            <option value="activities">Activities</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label>
          Description
          <input
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Dinner at beach shack"
          />
        </label>

        <fieldset>
          <legend>Participants</legend>
          <div className="checkbox-grid">
            {trip?.members.map((member) => (
              <label key={member._id} className="check-card">
                <input
                  type="checkbox"
                  checked={formData.participants.includes(member._id)}
                  onChange={() => toggleParticipant(member._id)}
                />
                <span>{member.name}</span>
                <small>{member.email}</small>
              </label>
            ))}
          </div>
        </fieldset>

        {error && <p className="error-text">{error}</p>}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Saving..." : "Add Expense"}
        </button>
      </form>
    </AppLayout>
  );
};

export default AddExpensePage;
