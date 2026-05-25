const QRCode = require('qrcode')
const fs = require('fs')
const path = require('path')

async function generateReservationQR(reservation) {
  const qrDir = path.join(__dirname, '../qr')

  if (!fs.existsSync(qrDir)) {
    fs.mkdirSync(qrDir, { recursive: true })
  }

  const fileName = `qr-${reservation.reservationCode}.png`
  const filePath = path.join(qrDir, fileName)

  const qrContent = `https://your-domain.com/reservation/${reservation.reservationCode}`

  await QRCode.toFile(filePath, qrContent, {
    width: 300,
    margin: 2
  })

  return filePath
}

module.exports = generateReservationQR