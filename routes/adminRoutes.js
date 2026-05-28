const express = require("express")
const router = express.Router()

const Reservation = require("../models/Reservation")
const connectDB = require("../db")

const DEPOSIT = 25

// =========================
// TOTAL REAL PRICE
// =========================
const getTotalAmount = (participants) => {
  return participants.reduce((acc, p) => {
    return acc + (p.sex === "M" ? 100 : 80)
  }, 0)
}

// =========================
// CONNECT DB MIDDLEWARE SAFE
// =========================
const ensureDB = async () => {
  await connectDB()
}

// =========================
// GET ALL
// =========================
router.get("/", async (req, res) => {
  try {
    await ensureDB()

    const reservations = await Reservation.find().sort({ createdAt: -1 })

    res.json(reservations)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

// =========================
// GET ONE
// =========================
router.get("/:id", async (req, res) => {
  try {
    await ensureDB()

    const reservation = await Reservation.findById(req.params.id)

    if (!reservation) {
      return res.status(404).json({ message: "Not found" })
    }

    res.json(reservation)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

// =========================
// CREATE
// =========================
router.post("/create", async (req, res) => {
  try {
    await ensureDB()

    const { email, reservationType, participants } = req.body

    const totalAmount = getTotalAmount(participants)

    // IMPORTANT LOGIC FIX
    const paidAmount =
      reservationType === "full"
        ? totalAmount
        : DEPOSIT

    const remainingAmount = totalAmount - paidAmount

    const reservation = new Reservation({
      email,
      reservationType,
      participants,

      reservationCode:
        "USAI-" + Math.random().toString(36).substring(2, 8).toUpperCase(),

      totalAmount,
      paidAmount,
      remainingAmount,

      paymentStatus: paidAmount >= totalAmount ? "completed" : "partial"
    })

    await reservation.save()

    res.json(reservation)
  } catch (err) {
    console.error(err)
    console.log("🔥 NEW CREATE HIT")
    console.log("PARTICIPANTS:", participants)
    console.log("TOTAL CALCUL:", totalAmount)
    res.status(500).json({ message: "Server error" })
  }
})

// =========================
// UPDATE
// =========================
router.put("/:id", async (req, res) => {
  try {
    await ensureDB()

    const { email, reservationType, participants, paidAmount } = req.body

    const reservation = await Reservation.findById(req.params.id)

    if (!reservation) {
      return res.status(404).json({ message: "Not found" })
    }

    const totalAmount = getTotalAmount(participants)

    const finalPaid =
      reservationType === "full"
        ? totalAmount
        : (paidAmount ?? DEPOSIT)

    reservation.email = email
    reservation.reservationType = reservationType
    reservation.participants = participants

    reservation.totalAmount = totalAmount
    reservation.paidAmount = finalPaid
    reservation.remainingAmount = totalAmount - finalPaid

    reservation.paymentStatus =
      finalPaid >= totalAmount ? "completed" : "partial"

    await reservation.save()

    res.json(reservation)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

// =========================
// DELETE
// =========================
router.delete("/:id", async (req, res) => {
  try {
    await ensureDB()

    await Reservation.findByIdAndDelete(req.params.id)

    res.json({ message: "Deleted successfully" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router