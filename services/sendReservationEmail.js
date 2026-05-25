const nodemailer = require('nodemailer')
const generateReservationPdf = require('../utils/generateReservationPdf')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

// =========================
// MULTI-LANGUAGE CONTENT
// =========================
function getEmailContent(reservation) {
  const lang = reservation.language || 'fr'

  const logoUrl =
    'https://cdn.corenexis.com/files/c/6145877720.png'

  const statusColor =
    reservation.paymentStatus === 'completed'
      ? '#16a34a'
      : '#f59e0b'

  const texts = {
    fr: {
      title: 'Réservation confirmée',
      subtitle: 'Merci pour votre confiance',
      details: 'Détails de votre réservation',
      code: 'Code',
      email: 'Email',
      type: 'Type',
      total: 'Total',
      paid: 'Payé',
      remaining: 'Restant',
      status: 'Statut',
      footer: 'Vous trouverez votre PDF en pièce jointe.'
    },

    en: {
      title: 'Booking confirmed',
      subtitle: 'Thank you for your trust',
      details: 'Booking details',
      code: 'Code',
      email: 'Email',
      type: 'Type',
      total: 'Total',
      paid: 'Paid',
      remaining: 'Remaining',
      status: 'Status',
      footer: 'Your PDF confirmation is attached.'
    },

    it: {
      title: 'Prenotazione confermata',
      subtitle: 'Grazie per la tua fiducia',
      details: 'Dettagli della prenotazione',
      code: 'Codice',
      email: 'Email',
      type: 'Tipo',
      total: 'Totale',
      paid: 'Pagato',
      remaining: 'Rimanente',
      status: 'Stato',
      footer: 'Troverai il PDF in allegato.'
    }
  }

  const t = texts[lang] || texts.fr

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;background:#f4f6f8;font-family:Arial;">

<div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;">

  <!-- HEADER -->
  <div style="background:#111827;padding:20px;text-align:center;">
    <img src="${logoUrl}" style="height:60px;" />
    <h2 style="color:#fff;margin:10px 0 0;">${t.title}</h2>
    <p style="color:#cbd5e1;">${t.subtitle}</p>
  </div>

  <!-- BODY -->
  <div style="padding:25px;">

    <h3>${t.details}</h3>

    <div style="background:#f9fafb;padding:15px;border-radius:8px;">
      <p><b>${t.code}:</b> ${reservation.reservationCode}</p>
      <p><b>${t.email}:</b> ${reservation.email}</p>
      <p><b>${t.type}:</b> ${reservation.reservationType}</p>
    </div>

    <!-- PRICES -->
    <div style="display:flex;gap:10px;margin-top:15px;flex-wrap:wrap;">

      <div style="flex:1;background:#f3f4f6;padding:12px;border-radius:8px;">
        <small>${t.total}</small>
        <h3>${reservation.totalAmount}€</h3>
      </div>

      <div style="flex:1;background:#f3f4f6;padding:12px;border-radius:8px;">
        <small>${t.paid}</small>
        <h3 style="color:#16a34a">${reservation.paidAmount}€</h3>
      </div>

      <div style="flex:1;background:#f3f4f6;padding:12px;border-radius:8px;">
        <small>${t.remaining}</small>
        <h3 style="color:#ef4444">${reservation.remainingAmount}€</h3>
      </div>

    </div>

    <!-- STATUS -->
    <div style="margin-top:20px;">
      <span style="
        padding:6px 12px;
        border-radius:20px;
        background:${statusColor};
        color:#fff;
        font-size:12px;
      ">
        ${reservation.paymentStatus.toUpperCase()}
      </span>
    </div>

    <p style="margin-top:20px;color:#6b7280;font-size:14px;">
      ${t.footer}
    </p>

  </div>

  <div style="background:#f3f4f6;padding:15px;text-align:center;font-size:12px;">
    © ${new Date().getFullYear()} USAI
  </div>

</div>

</body>
</html>
  `
}

// =========================
// MAIN FUNCTION
// =========================
async function sendReservationEmail(email, reservation) {
  const pdfPath = await generateReservationPdf(reservation)

  await transporter.sendMail({
    from: `"USAI Reservations" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reservation Confirmation / Conferma / Confirmation',

    html: getEmailContent(reservation),

    attachments: [
      {
        filename: `reservation-${reservation.reservationCode}.pdf`,
        path: pdfPath
      }
    ]
  })
}

module.exports = sendReservationEmail