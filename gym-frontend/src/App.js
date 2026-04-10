import React, { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";

function App() {
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    fetchSlots();
    fetchBookings();
  }, []);

  const fetchSlots = async () => {
    const res = await axios.get("http://localhost:5000/slots");
    setSlots(res.data);
  };

  const fetchBookings = async () => {
    const res = await axios.get("http://localhost:5000/bookings");
    setBookings(res.data);
  };

  const handleBooking = async (slotId) => {
    if (!userName) {
      alert("Enter name");
      return;
    }

    try {
      await axios.post("http://localhost:5000/book", {
        user_name: userName,
        slot_id: slotId,
      });

      alert("Booked ✅");
      fetchSlots();
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.error);
    }
  };

  const handleCancel = async (id) => {
    await axios.delete(`http://localhost:5000/cancel/${id}`);
    alert("Cancelled ❌");
    fetchSlots();
    fetchBookings();
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
    {slots.map((slot) => (
      <div className="card" key={slot.id}>
        <p className="slot-time">
          {slot.start_time} - {slot.end_time}
        </p>

        <p className={slot.available_slots === 0 ? "full" : "available"}>
          Available: {slot.available_slots}
        </p>

        <button
          className="book-btn"
          onClick={() => handleBooking(slot.id)}
          disabled={slot.available_slots === 0}
        >
          {slot.available_slots === 0 ? "Full" : "Book"}
        </button>
      </div>
    ))}

    <h2>Your Bookings</h2>
    {bookings.map((b) => (
      <div className="card" key={b.id}>
        <p><b>{b.user_name}</b></p>
        <p>{b.start_time} - {b.end_time}</p>

        <button
          className="cancel-btn"
          onClick={() => handleCancel(b.id)}
        >
          Cancel
        </button>
      </div>
    ))}
  </div>
);
}

export default App;