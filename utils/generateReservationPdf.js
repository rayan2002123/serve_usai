const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')
const https = require('https')
const generateReservationQR = require('../utils/generateReservationQR')

const logoUrl =
  'https://cdn.corenexis.com/files/c/6145877720.png'

// =========================
// download image helper
// =========================
function loadImage(doc, url, x, y, width) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      const chunks = []

      res.on('data', (chunk) => chunks.push(chunk))

      res.on('end', () => {
        const buffer = Buffer.concat(chunks)
        doc.image(buffer, x, y, { width })
        resolve()
      })
    })
  })
}

// =========================
// PDF GENERATOR
// =========================
async function generateReservationPdf(reservation) {
  return new Promise(async (resolve, reject) => {
    try {
      const pdfDir = path.join(__dirname, '../pdfs')

      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true })
      }

      const fileName = `reservation-${reservation.reservationCode}.pdf`
      const filePath = path.join(pdfDir, fileName)

      const doc = new PDFDocument({ margin: 50 })
      const stream = fs.createWriteStream(filePath)
      let qrPath = null

      try {
        qrPath = await generateReservationQR(reservation)
      } catch (e) {
        console.log('QR ERROR:', e)
      }
      
      doc.pipe(stream)

      // =========================
      // HEADER BACKGROUND STYLE
      // =========================
      doc.rect(0, 0, 600, 100).fill('#111827')

      // LOGO
      await loadImage(doc, logoUrl, 50, 20, 60)

      doc
        .fillColor('#ffffff')
        .fontSize(20)
        .text('USAI Reservation', 120, 35)

      doc
        .fontSize(10)
        .fillColor('#cbd5e1')
        .text('Booking Confirmation Document', 120, 60)

      doc.moveDown(3)

      // =========================
      // INFO BOX
      // =========================
      doc.fillColor('#111827')
      doc.fontSize(14).text('Reservation Summary', { underline: true })

      doc.moveDown(0.5)

      const infoY = doc.y

      doc.fontSize(11)
      doc.text(`Code: ${reservation.reservationCode}`)
      doc.text(`Email: ${reservation.email}`)
      doc.text(`Status: ${reservation.paymentStatus}`)
      doc.text(`Type: ${reservation.reservationType}`)

      doc.moveDown()

      // =========================
      // PRICING BOX
      // =========================
      doc.fontSize(14).text('Payment Details', { underline: true })
      doc.moveDown(0.5)

      doc.fontSize(11)

      doc.text(`Total Amount: ${reservation.totalAmount}€`)
      doc.text(`Paid Amount: ${reservation.paidAmount}€`)
      doc.text(`Remaining: ${reservation.remainingAmount}€`)

      doc.moveDown(2)

      // =========================
      // PARTICIPANTS
      // =========================
      doc.fontSize(14).text('Participants', { underline: true })

      doc.moveDown(1)

      reservation.participants.forEach((p, i) => {
        doc
          .fontSize(12)
          .fillColor('#111827')
          .text(`${i + 1}. ${p.fullName}`, {
            continued: true
          })

        doc
          .fontSize(10)
          .fillColor('#6b7280')
          .text(`   (${p.sex})`)

        if (p.comment) {
          doc
            .fontSize(10)
            .fillColor('#374151')
            .text(`Comment: ${p.comment}`)
        }

        doc.moveDown(0.8)
      })

      // =========================
      // FOOTER
      // =========================
      doc.moveDown(2)

      doc.addPage()

      doc.fontSize(18).text('QR Code de réservation', {
        align: 'center'
      })

      doc.moveDown()

      doc.image(qrPath, {
        fit: [200, 200],
        align: 'center'
      })

      doc
        .fontSize(10)
        .fillColor('#9ca3af')
        .text(
          'Thank you for your reservation. This document serves as your official confirmation.',
          { align: 'center' }
        )

      doc.end()

      stream.on('finish', () => resolve(filePath))
      stream.on('error', reject)
    } catch (err) {
      reject(err)
    }
  })
}

module.exports = generateReservationPdf