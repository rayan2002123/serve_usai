const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

require("dotenv").config();

const adminRoutes = require("../routes/adminRoutes");
const reservationRoutes = require("../routes/reservationRoutes");
const stripeRoutes = require("../routes/stripeRoutes");

const app = express();

// CORS
app.use(cors({
  origin: [
    "https://united-of-student.vercel.app",
    "https://united-students.vercel.app",
    "http://localhost:5173"
  ],
  credentials: true
}));

app.use(express.json());

// MongoDB
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log("MongoDB connected");
  } catch (err) {
    console.error(err);
  }
};

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Routes
app.get("/", (req, res) => {
  res.send("USAI API running 🚀");
});

app.use("/api/reservations", reservationRoutes);
app.use("/api/adminreservations", adminRoutes);
app.use("/api/stripe", stripeRoutes);

module.exports = app;