const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./db");

const app = express();

app.use(cors());
app.use(bodyParser.json());

/* ✅ Root route */
app.get("/", (req, res) => {
  res.send("Gym Booking API Running");
});

/* ✅ GET ALL SLOTS (WITH JOIN) */
app.get("/slots", (req, res) => {
  const query = `
    SELECT 
      slots.id,
      slots.start_time,
      slots.end_time,
      slots.capacity,
      COUNT(bookings.id) AS booked_count,
      (slots.capacity - COUNT(bookings.id)) AS available_slots
    FROM slots
    LEFT JOIN bookings ON slots.id = bookings.slot_id
    GROUP BY slots.id
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.error("Error fetching slots:", err);
      return res.status(500).json({ error: "Error fetching slots" });
    }

    res.json(result);
  });
});

/* ✅ BOOK SLOT */
app.post("/book", (req, res) => {
  const { user_name, slot_id } = req.body;

  if (!user_name || !slot_id) {
    return res.status(400).json({ error: "Missing user_name or slot_id" });
  }

  // Step 1: Check current bookings
  const checkQuery = `
    SELECT COUNT(*) AS booked_count
    FROM bookings
    WHERE slot_id = ?
  `;

  db.query(checkQuery, [slot_id], (err, result) => {
    if (err) {
      console.error("Error checking bookings:", err);
      return res.status(500).json({ error: "Error checking bookings" });
    }

    const bookedCount = result[0].booked_count;

    // Step 2: Get slot capacity
    const capacityQuery = `SELECT capacity FROM slots WHERE id = ?`;

    db.query(capacityQuery, [slot_id], (err2, result2) => {
      if (err2) {
        console.error("Error fetching slot:", err2);
        return res.status(500).json({ error: "Error fetching slot" });
      }

      // 🔴 Handle invalid slot
      if (result2.length === 0) {
        return res.status(404).json({ error: "Slot not found" });
      }

      const capacity = result2[0].capacity;

      // Step 3: Check if full
      if (bookedCount >= capacity) {
        return res.status(400).json({ error: "Slot is full" });
      }

      // Step 4: Insert booking
      const insertQuery = `
        INSERT INTO bookings (user_name, slot_id)
        VALUES (?, ?)
      `;

      db.query(insertQuery, [user_name, slot_id], (err3, result3) => {
        if (err3) {
          console.error("Error booking slot:", err3);
          return res.status(500).json({ error: "Error booking slot" });
        }

        res.json({
          message: "Booking successful",
          booking_id: result3.insertId,
        });
      });
    });
  });
});

/* ✅ CANCEL BOOKING */
app.delete("/cancel/:id", (req, res) => {
  const bookingId = req.params.id;

  const query = "DELETE FROM bookings WHERE id = ?";

  db.query(query, [bookingId], (err, result) => {
    if (err) {
      console.error("Error cancelling booking:", err);
      return res.status(500).json({ error: "Error cancelling booking" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({ message: "Booking cancelled successfully" });
  });
});

/* ✅ GET ALL BOOKINGS */
app.get("/bookings", (req, res) => {
  const query = `
    SELECT bookings.id, bookings.user_name, slots.start_time, slots.end_time
    FROM bookings
    JOIN slots ON bookings.slot_id = slots.id
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error fetching bookings" });
    }

    res.json(result);
  });
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});