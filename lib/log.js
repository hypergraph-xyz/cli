'use strict'

const kleur = require('kleur')

exports.info = (...msg) => {
  console.log(kleur.yellow(`! ${kleur.bold(msg.join(' '))}`))
}
exports.error = (...msg) => {
  console.error(kleur.red(`✖ ${kleur.bold(msg.join(' '))}`))
}
exports.success = (...msg) => {
  console.log(kleur.green(`✔ ${kleur.bold(msg.join(' '))}`))
}
