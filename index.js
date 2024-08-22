const express = require("express");
const mysql = require("mysql2");
const dotenv = require("dotenv");
const app = express();

dotenv.config();
app.use(express.json());

// MySQL Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) throw err;
  console.log("MySQL Connected...");
});

// Add School API
app.post("/addSchool", (req, res) => {
  const { name, address, latitude, longitude } = req.body;
  if (!name || !address || !latitude || !longitude) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const query =
    "INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)";
  db.query(query, [name, address, latitude, longitude], (err, result) => {
    if (err) throw err;
    res
      .status(201)
      .json({
        message: "School added successfully",
        schoolId: result.insertId,
      });
  });
});

// List Schools API
app.get("/listSchools", (req, res) => {
  const { latitude, longitude } = req.query;
  if (!latitude || !longitude) {
    return res
      .status(400)
      .json({ error: "Latitude and longitude are required" });
  }

  const query = "SELECT * FROM schools";
  db.query(query, (err, results) => {
    if (err) throw err;

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);

    // Calculate distance using Haversine formula
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const toRadians = (deg) => deg * (Math.PI / 180);
      const R = 6371; // Earth's radius in kilometers
      const dLat = toRadians(lat2 - lat1);
      const dLon = toRadians(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
          Math.cos(toRadians(lat2)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Distance in kilometers
    };

    const sortedResults = results.sort((a, b) => {
      const distanceA = calculateDistance(
        userLat,
        userLon,
        a.latitude,
        a.longitude
      );
      const distanceB = calculateDistance(
        userLat,
        userLon,
        b.latitude,
        b.longitude
      );
      return distanceA - distanceB;
    });

    res.json(sortedResults);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
