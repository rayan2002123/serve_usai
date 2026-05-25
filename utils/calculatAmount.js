function calculateAmount(type, participants) {
  if (type === 'partial') {
    return participants.length * 25
  }

  let total = 0

  participants.forEach((p) => {
    total += p.sex === 'M' ? 100 : 80
  })

  return total
}

module.exports = calculateAmount