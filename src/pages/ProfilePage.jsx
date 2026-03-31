import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";

const ProfilePage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    upiId: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        upiId: user.upiId || "",
      });
    }
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError("");
    setSuccess("");
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        upiId: user.upiId || "",
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { data } = await api.put("/auth/profile", {
        name: formData.name,
        upiId: formData.upiId,
      });

      login({
        token: localStorage.getItem("token"),
        user: {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          upiId: data.user.upiId,
        },
      });

      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Profile" subtitle="Manage your account information">
      <div className="profile-container">
        <div className="card profile-card">
          {!isEditing ? (
            <div className="profile-view">
              <h3>Your Profile</h3>
              <div className="profile-item">
                <label>Name</label>
                <p>{formData.name}</p>
              </div>
              <div className="profile-item">
                <label>Email</label>
                <p>{formData.email}</p>
              </div>
              <div className="profile-item">
                <label>UPI ID</label>
                <p>{formData.upiId}</p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleEdit}
              >
                Edit Profile
              </button>
            </div>
          ) : (
            <form className="profile-edit" onSubmit={handleSubmit}>
              <h3>Edit Profile</h3>
              <label>
                Name
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                />
              </label>

              <label>
                Email
                <input
                  disabled
                  name="email"
                  value={formData.email}
                  placeholder="Email cannot be changed"
                />
              </label>

              <label>
                UPI ID
                <input
                  required
                  name="upiId"
                  value={formData.upiId}
                  onChange={handleChange}
                  placeholder="yourname@upi"
                />
              </label>

              {error && <p className="error-text">{error}</p>}
              {success && <p className="success-text">{success}</p>}

              <div className="profile-buttons">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;
