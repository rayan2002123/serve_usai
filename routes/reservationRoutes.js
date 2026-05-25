const express = require('express')
const router = express.Router()

const Reservation = require('../models/Reservation')
const generateCode = require('../utils/generateCode')

/* =========================================
   HELPERS
========================================= */

function calculateTotal(participants) {
  let total = 0

  participants.forEach((p) => {
    total += p.sex === 'M' ? 100 : 80
  })

  return total
}

/* =========================================
   CREATE RESERVATION
   (USED BY Reservation.jsx ONLY)
========================================= */

router.post('/create', async (req, res) => {
  try {
    const {
      email,
      reservationType,
      participants
    } = req.body

    /* VALIDATION */

    if (
      !email ||
      !reservationType ||
      !participants ||
      participants.length === 0
    ) {
      return res.status(400).json({
        message: 'Missing required fields'
      })
    }

    /* TOTAL */

    const totalAmount =
      calculateTotal(participants)

    /* IMPORTANT
       NO PAYMENT BEFORE STRIPE
    */

    const paidAmount = 0

    const remainingAmount =
      totalAmount - paidAmount

    /* STATUS */

    const paymentStatus = 'pending'

    /* CREATE */

    const reservation =
      await Reservation.create({
        reservationCode: generateCode(),

        email,

        reservationType,

        participants,

        totalAmount,

        paidAmount,

        remainingAmount,

        paymentStatus,

        processedStripeSessions: []
      })

    return res.status(201).json(reservation)

  } catch (err) {
    console.log(err)

    return res.status(500).json({
      message: err.message
    })
  }
})

/* =========================================
   GET RESERVATION BY CODE
   (FINALIZE PAYMENT PAGE)
========================================= */

router.get('/:code', async (req, res) => {
  try {
    const reservation =
      await Reservation.findOne({
        reservationCode:
          req.params.code
      })

    if (!reservation) {
      return res.status(404).json({
        message: 'Reservation not found'
      })
    }

    return res.json(reservation)

  } catch (err) {
    console.log(err)

    return res.status(500).json({
      message: err.message
    })
  }
})

module.exports = router