import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/client";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";

const ChatPage = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [messages, setMessages] = useState([]);
  const [tripName, setTripName] = useState("");
  const [text, setText] = useState("");
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messageListRef = useRef(null);

  const selectedTrip = useMemo(
    () => trips.find((trip) => trip._id === selectedTripId),
    [trips, selectedTripId]
  );

  const scrollToBottom = () => {
    if (!messageListRef.current) {
      return;
    }

    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  };

  useEffect(() => {
    const fetchTrips = async () => {
      setLoadingTrips(true);
      setError("");
      try {
        const { data } = await api.get("/trips");
        setTrips(data);
        if (data.length > 0) {
          setSelectedTripId(data[0]._id);
        }
      } catch (apiError) {
        setError(apiError.response?.data?.message || "Unable to fetch trips");
      } finally {
        setLoadingTrips(false);
      }
    };

    fetchTrips();
  }, []);

  useEffect(() => {
    if (!selectedTripId) {
      setMessages([]);
      setTripName("");
      return undefined;
    }

    let isActive = true;

    const fetchMessages = async () => {
      if (!isActive) {
        return;
      }
      setLoadingMessages(true);
      setError("");
      try {
        const { data } = await api.get(`/chat/trips/${selectedTripId}/messages`);
        if (!isActive) {
          return;
        }
        setMessages(data.messages || []);
        setTripName(data.trip?.name || selectedTrip?.name || "");
      } catch (apiError) {
        if (isActive) {
          setError(apiError.response?.data?.message || "Unable to fetch messages");
        }
      } finally {
        if (isActive) {
          setLoadingMessages(false);
        }
      }
    };

    fetchMessages();
    const intervalId = setInterval(fetchMessages, 12000);

    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [selectedTripId, selectedTrip?.name]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (event) => {
    event.preventDefault();
    const cleanText = text.trim();

    if (!selectedTripId || !cleanText || sending) {
      return;
    }

    setSending(true);
    setError("");

    try {
      const { data } = await api.post(`/chat/trips/${selectedTripId}/messages`, {
        text: cleanText,
      });
      setMessages((prev) => [...prev, data]);
      setText("");
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <AppLayout title="Trip Chat" subtitle="Discuss plans, costs, and updates with your trip members.">
      <section className="grid two-col chat-grid">
        <article className="card report-panel">
          <h2>Your Trips</h2>
          {loadingTrips && <p className="muted">Loading trips...</p>}
          {!loadingTrips && trips.length === 0 && (
            <p className="muted">No trips yet. Create or accept an invitation first.</p>
          )}
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

        <article className="card report-panel chat-panel">
          <h2>{tripName || selectedTrip?.name || "Trip Discussion"}</h2>

          {!selectedTripId && <p className="muted">Select a trip to start discussion.</p>}

          {selectedTripId && (
            <>
              <div className="chat-messages" ref={messageListRef}>
                {loadingMessages && <p className="muted">Loading messages...</p>}
                {!loadingMessages && messages.length === 0 && (
                  <p className="muted">No messages yet. Start the conversation.</p>
                )}

                {messages.map((message) => {
                  const isOwn = message.sender?._id === user?.id;
                  return (
                    <div
                      key={message._id}
                      className={`chat-bubble ${isOwn ? "own" : "other"}`}
                    >
                      <div className="chat-meta">
                        <strong>{isOwn ? "You" : message.sender?.name || "Member"}</strong>
                        <span>{new Date(message.createdAt).toLocaleString()}</span>
                      </div>
                      <p>{message.text}</p>
                    </div>
                  );
                })}
              </div>

              <form className="chat-form" onSubmit={handleSendMessage}>
                <input
                  value={text}
                  maxLength={1000}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Type your message"
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!text.trim() || sending}
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </form>
            </>
          )}
        </article>
      </section>

      {error && <p className="error-text">{error}</p>}
    </AppLayout>
  );
};

export default ChatPage;