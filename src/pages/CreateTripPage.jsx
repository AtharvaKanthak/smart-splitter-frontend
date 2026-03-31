import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import AppLayout from "../components/AppLayout";

const CreateTripPage = () => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/trips/create", { name });
      navigate("/dashboard");
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to create trip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Create Trip" subtitle="Set up a new trip and add members to start splitting expenses.">
      <form className="card" onSubmit={handleSubmit}>
        <label>
          Trip Name
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Goa Friends Trip"
          />
        </label>

        <p className="muted">Members can be added after creation using Invite search from dashboard.</p>

        {error && <p className="error-text">{error}</p>}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Trip"}
        </button>
      </form>
    </AppLayout>
  );
};

export default CreateTripPage;
