const express = require('express')
const router = express.Router()

const Stripe = require('stripe')

const stripe = Stripe(
  process.env.STRIPE_SECRET_KEY
)

const Reservation =
  require('../models/Reservation')

const sendReservationEmail =
  require('../services/sendReservationEmail')

/* =========================================
   CREATE CHECKOUT SESSION
========================================= */

router.post(
  '/create-checkout-session',
  async (req, res) => {
    try {
      const {
        amount,
        email,
        reservationId
      } = req.body

      if (
        !amount ||
        !email ||
        !reservationId
      ) {
        return res.status(400).json({
          message: 'Missing data'
        })
      }

      const reservation =
        await Reservation.findById(
          reservationId
        )

      if (!reservation) {
        return res.status(404).json({
          message:
            'Reservation not found'
        })
      }

      const session =
        await stripe.checkout.sessions.create({
          payment_method_types: ['card'],

          mode: 'payment',

          customer_email: email,

          line_items: [
            {
              price_data: {
                currency: 'eur',

                product_data: {
                  name:
                    'USAI Reservation'
                },

                unit_amount:
                  Math.round(
                    Number(amount) * 100
                  )
              },

              quantity: 1
            }
          ],

          success_url:
            'https://united-of-student.vercel.app/success?session_id={CHECKOUT_SESSION_ID}',

          cancel_url:
            'https://united-of-student.vercel.app/cancel',
          metadata: {
            reservationId
          }
        })

      return res.json({
        url: session.url
      })

    } catch (err) {
      console.log(err)

      return res.status(500).json({
        message: err.message
      })
    }
  }
)

/* =========================================
   FINALIZE SESSION
========================================= */

router.post(
  '/finalize-session',
  async (req, res) => {
    try {
      const { session_id } = req.body

      if (!session_id) {
        return res.status(400).json({
          message: 'Missing session_id'
        })
      }

      /* GET STRIPE SESSION */

      const session =
        await stripe.checkout.sessions.retrieve(
          session_id
        )

      if (
        session.payment_status !== 'paid'
      ) {
        return res.status(400).json({
          message:
            'Payment not completed'
        })
      }

      const reservationId =
        session.metadata?.reservationId

      if (!reservationId) {
        return res.status(400).json({
          message:
            'Missing reservationId'
        })
      }

      /* GET RESERVATION */

      const reservation =
        await Reservation.findById(
          reservationId
        )

      if (!reservation) {
        return res.status(404).json({
          message:
            'Reservation not found'
        })
      }

      /* =====================================
         ANTI DOUBLE STRIPE SESSION
      ===================================== */

      if (
        reservation.processedStripeSessions.includes(
          session.id
        )
      ) {
        return res.json(reservation)
      }

      /* PAYMENT */

      const paidNow =
        session.amount_total / 100

      reservation.paidAmount += paidNow

      /* SECURITY */

      if (
        reservation.paidAmount >
        reservation.totalAmount
      ) {
        reservation.paidAmount =
          reservation.totalAmount
      }

      /* REMAINING */

      reservation.remainingAmount =
        reservation.totalAmount -
        reservation.paidAmount

      /* STATUS */

      reservation.paymentStatus =
        reservation.remainingAmount <= 0
          ? 'completed'
          : 'partial'

      /* SAVE SESSION */

      reservation.processedStripeSessions.push(
        session.id
      )

      await reservation.save()

      /* SEND EMAIL */

      try {
        await sendReservationEmail(
          reservation.email,
          reservation
        )

        console.log(
          'EMAIL SENT:',
          reservation.email
        )

      } catch (emailError) {
        console.log(
          'EMAIL ERROR:',
          emailError
        )
      }

      return res.json(reservation)

    } catch (err) {
      console.log(err)

      return res.status(500).json({
        message: err.message
      })
    }
  }
)

module.exports = router