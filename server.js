const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

require('dotenv').config()

const adminRoutes = require('./routes/adminRoutes')
const reservationRoutes = require('./routes/reservationRoutes')
const stripeRoutes = require('./routes/stripeRoutes')

const app = express()

// =========================
// CORS (PROD READY)
// =========================
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://united-of-student.vercel.app",
    "https://united-students.vercel.app"
  ],
  credentials: true
}))

app.use(express.json())

// =========================
// DATABASE
// =========================
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) return

    await mongoose.connect(process.env.MONGO_URI)
    console.log("MongoDB connected")
  } catch (err) {
    console.error("MongoDB connection error:", err)
  }
}

connectDB()

// =========================
// ROUTES
// =========================
app.get('/', (req, res) => {
  res.send('USAI API is running 🚀')
})
app.use('/api/reservations', reservationRoutes)
app.use('/api/adminreservations', adminRoutes)
app.use('/api/stripe', stripeRoutes)

// =========================
// SERVER (RENDER READY)
// =========================
const PORT = process.env.PORT || 5000

if (process.env.VERCEL) {
  module.exports = app
} else {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}