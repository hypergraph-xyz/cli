'use strict'

const kleur = require('kleur')
const subtypes = require('../lib/subtypes')
const prompt = require('../lib/prompt')

const moduleHeader = mod => {
  const type = mod.rawJSON.subtype
    ? subtypes[mod.rawJSON.subtype] || 'Unknown'
    : 'Profile'
  return `${kleur.cyan().bold(mod.rawJSON.title || mod.rawJSON.name)} - ${type}`
}

exports.title = 'Read metadata'
exports.input = [{ name: 'hash', resolve: prompt.modules }]
exports.handler = async ({ p2p, hash }) => {
  const mod = await p2p.get(hash)

  console.log(moduleHeader(mod))

  if (mod.rawJSON.type === 'content') {
    if (mod.rawJSON.authors.length) {
      const authors = await Promise.all(
        mod.rawJSON.authors.map(hash => p2p.get(hash))
      )
      const authorNames = authors.map(author => author.rawJSON.name)
      console.log(kleur.italic(authorNames.join(',')))
    } else {
      console.log(kleur.italic('Anonymous'))
    }
  }

  console.log()
  console.log(kleur.underline(mod.rawJSON.url))
  if (mod.rawJSON.type === 'content') {
    if (mod.rawJSON.parents.length) {
      console.log(kleur.bold('Parents:'))
      for (const parent of mod.rawJSON.parents) {
        console.log(` - ${parent}`)
      }
    }
  } else {
    if (mod.rawJSON.follows.length) {
      console.log(kleur.bold('Follows:'))
      for (const profile of mod.rawJSON.follows) {
        console.log(` - ${profile}`)
      }
    }
  }
  console.log()

  if (mod.rawJSON.description) {
    console.log(mod.rawJSON.description)
  } else {
    console.log(kleur.gray('No description'))
  }

  console.log()
  if (mod.rawJSON.main) {
    console.log(`main: ${mod.rawJSON.main}`)
  } else {
    console.log(`main: ${kleur.red('✖')}`)
  }

  if (mod.rawJSON.type === 'profile' && mod.rawJSON.contents.length) {
    console.log('contents:')
    for (const contentKey of mod.rawJSON.contents) {
      const content = await p2p.get(contentKey)
      console.log(` - ${moduleHeader(content)}`)
      console.log(`   ${kleur.underline(`hyper://${content.rawJSON.url}`)}`)
    }
  }
}
