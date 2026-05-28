const express = require("express")
const router = express.Router()

const Reservation = require("../models/Reservation")
const connectDB = require("../db")

// =========================
// PRICE LOGIC (CORRIGÉE)
// =========================
const getTotalAmount = (participants) => {
  return participants.reduce((acc, p) => {
    return acc + (p.sex === "M" ? 100 : 80)
  }, 0)
}

// =========================
// GET ALL
// =========================
router.get("/", async (req, res) => {
  try {
    await connectDB()

    const reservations = await Reservation.find().sort({ createdAt: -1 })

    res.json(reservations)
  } catch (err) {
    console.error("GET ALL ERROR:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// =========================
// GET ONE
// =========================
router.get("/:id", async (req, res) => {
  try {
    await connectDB()

    const reservation = await Reservation.findById(req.params.id)

    if (!reservation) {
      return res.status(404).json({ message: "Not found" })
    }

    res.json(reservation)
  } catch (err) {
    console.error("GET ONE ERROR:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// =========================
// CREATE
// =========================
router.post("/create", async (req, res) => {
  try {
    await connectDB()

    const { email, reservationType, participants, paidAmount } = req.body

    const totalAmount = getTotalAmount(participants)

    // IMPORTANT: partial = acompte, full = total
    const finalPaidAmount =
      reservationType === "full"
        ? totalAmount
        : (paidAmount ?? 25)

    const reservation = new Reservation({
      email,
      reservationType,
      participants,

      reservationCode:
        "USAI-" + Math.random().toString(36).substring(2, 8).toUpperCase(),

      totalAmount,
      paidAmount: finalPaidAmount,
      remainingAmount: totalAmount - finalPaidAmount,

      paymentStatus:
        finalPaidAmount >= totalAmount ? "completed" : "partial"
    })

    await reservation.save()

    res.json(reservation)
  } catch (err) {
    console.error("CREATE ERROR:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// =========================
// UPDATE
// =========================
router.put("/:id", async (req, res) => {
  try {
    await connectDB()

    const { email, reservationType, participants, paidAmount, paymentStatus } = req.body

    const reservation = await Reservation.findById(req.params.id)

    if (!reservation) {
      return res.status(404).json({ message: "Not found" })
    }

    const totalAmount = getTotalAmount(participants)

    const finalPaidAmount =
      reservationType === "full"
        ? totalAmount
        : (paidAmount ?? 25)

    reservation.email = email
    reservation.reservationType = reservationType
    reservation.participants = participants

    reservation.totalAmount = totalAmount
    reservation.paidAmount = finalPaidAmount
    reservation.remainingAmount = totalAmount - finalPaidAmount

    reservation.paymentStatus =
      finalPaidAmount >= totalAmount ? "completed" : "partial"

    await reservation.save()

    res.json(reservation)
  } catch (err) {
    console.error("UPDATE ERROR:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// =========================
// DELETE
// =========================
router.delete("/:id", async (req, res) => {
  try {
    await connectDB()

    const reservation = await Reservation.findById(req.params.id)

    if (!reservation) {
      return res.status(404).json({ message: "Not found" })
    }

    await Reservation.findByIdAndDelete(req.params.id)

    res.json({ message: "Deleted successfully" })
  } catch (err) {
    console.error("DELETE ERROR:", err)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router