'use strict'

const kleur = require('kleur')

const cross = process.platform === 'win32' ? '×' : '✖'
const tick = process.platform === 'win32' ? '√' : '✔'

exports.info = (...msg) => {
  console.log(kleur.yellow(`! ${kleur.bold(msg.join(' '))}`))
}
exports.error = (...msg) => {
  console.error(kleur.red(`${cross} ${kleur.bold(msg.join(' '))}`))
}
exports.success = (...msg) => {
  console.log(kleur.green(`${tick} ${kleur.bold(msg.join(' '))}`))
}
exports.cross = cross
exports.tick = tick
