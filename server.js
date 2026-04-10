const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./db");

const app = express();

app.use(cors());
app.use(bodyParser.json());

/* ✅ CREATE TABLES + DEFAULT DATA */
const createTables = () => {
  const createSlotsTable = `
    CREATE TABLE IF NOT EXISTS slots (
      id INT AUTO_INCREMENT PRIMARY KEY,
      start_time VARCHAR(50),
      end_time VARCHAR(50),
      capacity INT DEFAULT 10
    )
  `;

  const createBookingsTable = `
    CREATE TABLE IF NOT EXISTS bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_name VARCHAR(100),
      slot_id INT,
      FOREIGN KEY (slot_id) REFERENCES slots(id) ON DELETE CASCADE
    )
  `;

  db.query(createSlotsTable, (err) => {
    if (err) console.error("❌ Error creating slots table:", err);
    else console.log("✅ Slots table ready");
  });

  db.query(createBookingsTable, (err) => {
    if (err) console.error("❌ Error creating bookings table:", err);
    else console.log("✅ Bookings table ready");
  });

  // Insert default slots ONLY if empty
  const insertSlots = `
    INSERT INTO slots (start_time, end_time, capacity)
    SELECT * FROM (
      SELECT '06:00 AM', '07:00 AM', 10 UNION
      SELECT '07:00 AM', '08:00 AM', 10 UNION
      SELECT '08:00 AM', '09:00 AM', 10
    ) AS temp
    WHERE NOT EXISTS (SELECT * FROM slots)
  `;

  db.query(insertSlots, (err) => {
    if (err) console.error("❌ Error inserting slots:", err);
    else console.log("✅ Default slots inserted");
  });
};

/* ✅ CALL TABLE CREATION */
createTables();

/* ✅ ROOT ROUTE */
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
      console.error("❌ Error fetching slots:", err);
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

  const checkQuery = `
    SELECT COUNT(*) AS booked_count
    FROM bookings
    WHERE slot_id = ?
  `;

  db.query(checkQuery, [slot_id], (err, result) => {
    if (err) {
      console.error("❌ Error checking bookings:", err);
      return res.status(500).json({ error: "Error checking bookings" });
    }

    const bookedCount = result[0].booked_count;

    const capacityQuery = `SELECT capacity FROM slots WHERE id = ?`;

    db.query(capacityQuery, [slot_id], (err2, result2) => {
      if (err2) {
        console.error("❌ Error fetching slot:", err2);
        return res.status(500).json({ error: "Error fetching slot" });
      }

      if (result2.length === 0) {
        return res.status(404).json({ error: "Slot not found" });
      }

      const capacity = result2[0].capacity;

      if (bookedCount >= capacity) {
        return res.status(400).json({ error: "Slot is full" });
      }

      const insertQuery = `
        INSERT INTO bookings (user_name, slot_id)
        VALUES (?, ?)
      `;

      db.query(insertQuery, [user_name, slot_id], (err3, result3) => {
        if (err3) {
          console.error("❌ Error booking slot:", err3);
          return res.status(500).json({ error: "Error booking slot" });
        }

        res.json({
          message: "✅ Booking successful",
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
      console.error("❌ Error cancelling booking:", err);
      return res.status(500).json({ error: "Error cancelling booking" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({ message: "✅ Booking cancelled successfully" });
  });
});

/* ✅ GET ALL BOOKINGS */
app.get("/bookings", (req, res) => {
  const query = `
    SELECT 
      bookings.id, 
      bookings.user_name, 
      slots.start_time, 
      slots.end_time
    FROM bookings
    JOIN slots ON bookings.slot_id = slots.id
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.error("❌ Error fetching bookings:", err);
      return res.status(500).json({ error: "Error fetching bookings" });
    }

    res.json(result);
  });
});

/* ✅ START SERVER */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});