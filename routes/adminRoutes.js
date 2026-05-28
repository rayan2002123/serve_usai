const express = require("express")
const router = express.Router()

const Reservation = require("../models/Reservation")
const connectDB = require("../db")

// =========================
// PRICING LOGIC (CENTRALISÉ)
// =========================
const getTotalAmount = (participants) => {
  return participants.reduce((acc, p) => {
    return acc + (p.sex === "M" ? 100 : 80)
  }, 0)
}

const getPaidAmount = (reservationType, participants, paidAmountInput) => {
  // FULL = tout payé
  if (reservationType === "full") {
    return getTotalAmount(participants)
  }

  // PARTIAL = acompte libre (ou 25€/personne si vide)
  return paidAmountInput ?? participants.length * 25
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
    const { email, reservationType, participants, paidAmount } = req.body

    const totalAmount = participants.reduce((acc, p) => {
      return acc + (p.sex === "M" ? 100 : 80)
    }, 0)

    const finalPaid = reservationType === "full"
      ? totalAmount
      : paidAmount

    const reservation = new Reservation({
      email,
      reservationType,
      participants,

      reservationCode:
        "USAI-" + Math.random().toString(36).substring(2, 8).toUpperCase(),

      totalAmount,
      paidAmount: finalPaid,
      remainingAmount: totalAmount - finalPaid,

      paymentStatus: finalPaid >= totalAmount ? "completed" : "partial"
    })

    await reservation.save()

    res.json(reservation)
  } catch (err) {
    console.log(err)
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
    const finalPaidAmount = getPaidAmount(reservationType, participants, paidAmount)

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