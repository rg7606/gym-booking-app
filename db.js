const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "mainline.proxy.rlwy.net",
  user: "root",
  password: "jaryQHBUoiLmasfusxyDNWPZjhBuQxtl",
  database: "railway",
  port: 31065,
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ Connected to Railway MySQL Database");
  }
});

module.exports = db;