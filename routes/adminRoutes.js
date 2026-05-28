const express = require("express")
const router = express.Router()

const Reservation = require("../models/Reservation")

const connectDB = require("../db")

// ======================================================
// GET ALL RESERVATIONS
// ======================================================
router.get("/", async (req, res) => {
  try {
    await connectDB()

    const reservations = await Reservation.find().sort({
      createdAt: -1
    })

    res.json(reservations)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Server error" })
  }
})

// ======================================================
// GET ONE RESERVATION (by ID)
// ======================================================
router.get("/:id", async (req, res) => {
  try {
    await connectDB()

    if (!reservation) {
      return res.status(404).json({ message: "Not found" })
    }

    res.json(reservation)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Server error" })
  }
})

// ======================================================
// CREATE RESERVATION
// ======================================================
router.post("/create", async (req, res) => {
  try {
    const {
      email,
      reservationType,
      participants
    } = req.body

    // code unique simple
    const reservationCode =
      "USAI-" + Math.random().toString(36).substring(2, 8).toUpperCase()

    // calcul prix
    let totalAmount = 0

    if (reservationType === "partial") {
      totalAmount = participants.reduce((acc, p) => {
        return acc + (p.sex === "M" ? 100 : 80)
      }, 0)
    } else {
      participants.forEach((p) => {
        totalAmount += p.sex === "M" ? 100 : 80
      })
    }

    const reservation = new Reservation({
      email,
      reservationType,
      participants,
      reservationCode,
      totalAmount,
      paidAmount: reservationType === "full" ? totalAmount : 25 * participants.length,
      remainingAmount:
        totalAmount - (reservationType === "full" ? totalAmount : 25 * participants.length),
      paymentStatus:
        reservationType === "full" ? "completed" : "partial"
    })

    await reservation.save()

    res.json(reservation)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Server error" })
  }
})

// ======================================================
// UPDATE RESERVATION
// ======================================================
router.put("/:id", async (req, res) => {
  try {
    const {
      email,
      reservationType,
      participants,
      paidAmount,
      paymentStatus
    } = req.body

    const reservation = await Reservation.findById(req.params.id)

    if (!reservation) {
      return res.status(404).json({ message: "Not found" })
    }

    // recalcul prix
    let totalAmount = 0

    if (reservationType === "partial") {
      totalAmount = participants.reduce((acc, p) => {
        return acc + (p.sex === "M" ? 100 : 80)
      }, 0)
    } else {
      participants.forEach((p) => {
        totalAmount += p.sex === "M" ? 100 : 80
      })
    }

    reservation.email = email
    reservation.reservationType = reservationType
    reservation.participants = participants
    reservation.paidAmount = paidAmount
    reservation.paymentStatus = paymentStatus
    reservation.totalAmount = totalAmount
    reservation.remainingAmount = totalAmount - paidAmount

    await reservation.save()

    res.json(reservation)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Server error" })
  }
})

// ======================================================
// DELETE RESERVATION
// ======================================================
router.delete("/:id", async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)

    if (!reservation) {
      return res.status(404).json({ message: "Not found" })
    }

    await Reservation.findByIdAndDelete(req.params.id)

    res.json({ message: "Deleted successfully" })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router