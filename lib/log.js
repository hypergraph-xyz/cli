'use strict'

const kleur = require('kleur')

exports.info = (...msg) => {
  console.log(kleur.bold().yellow(`! ${msg.join(' ')}`))
}
exports.error = (...msg) => {
  console.error(kleur.bold().red(`✖ ${msg.join(' ')}`))
}
exports.success = (...msg) => {
  console.log(kleur.bold().green(`✔ ${msg.join(' ')}`))
}
