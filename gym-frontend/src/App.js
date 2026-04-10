import React, { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";

// ✅ Your deployed backend URL
const API = "https://gym-booking-backend-f81z.onrender.com";

function App() {
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSlots();
    fetchBookings();
  }, []);

  /* ✅ FETCH SLOTS */
  const fetchSlots = async () => {
    try {
      const res = await axios.get(`${API}/slots`);
      setSlots(res.data);
    } catch (err) {
      console.error("Error fetching slots:", err);
      alert("Failed to load slots");
    }
  };

  /* ✅ FETCH BOOKINGS */
  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API}/bookings`);
      setBookings(res.data);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      alert("Failed to load bookings");
    }
  };

  /* ✅ BOOK SLOT */
  const handleBooking = async (slotId) => {
    if (!userName.trim()) {
      alert("Please enter your name");
      return;
    }

    try {
      setLoading(true);

      await axios.post(`${API}/book`, {
        user_name: userName,
        slot_id: slotId,
      });

      alert("✅ Booking successful");

      fetchSlots();
      fetchBookings();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  /* ✅ CANCEL BOOKING */
  const handleCancel = async (id) => {
    try {
      await axios.delete(`${API}/cancel/${id}`);

      alert("❌ Booking cancelled");

      fetchSlots();
      fetchBookings();
    } catch (err) {
      console.error(err);
      alert("Cancel failed");
    }
  };

  return (
    <div className="container">
      <h1>🏋️ Gym Booking App</h1>

      <input
        placeholder="Enter your name"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
      />

      <h2>Available Slots</h2>

      {slots.length === 0 ? (
        <p>Loading slots...</p>
      ) : (
        slots.map((slot) => (
          <div className="card" key={slot.id}>
            <p className="slot-time">
              {slot.start_time} - {slot.end_time}
            </p>

            <p
              className={
                slot.available_slots === 0 ? "full" : "available"
              }
            >
              Available: {slot.available_slots}
            </p>

            <button
              className="book-btn"
              onClick={() => handleBooking(slot.id)}
              disabled={slot.available_slots === 0 || loading}
            >
              {slot.available_slots === 0
                ? "Full"
                : loading
                ? "Booking..."
                : "Book"}
            </button>
          </div>
        ))
      )}

      <h2>Your Bookings</h2>

      {bookings.length === 0 ? (
        <p>No bookings yet</p>
      ) : (
        bookings.map((b) => (
          <div className="card" key={b.id}>
            <p>
              <b>{b.user_name}</b>
            </p>
            <p>
              {b.start_time} - {b.end_time}
            </p>

            <button
              className="cancel-btn"
              onClick={() => handleCancel(b.id)}
            >
              Cancel
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default App;