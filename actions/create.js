'use strict'

const UserError = require('../lib/user-error')
const kleur = require('kleur')
const prompt = require('../lib/prompt')
const validate = require('../lib/validate')

const licenseUrl = 'https://creativecommons.org/publicdomain/zero/1.0/legalcode'

module.exports = {
  title: 'Create a module',
  input: [{ name: 'type', resolve: prompt.type }],
  handler: async (p2p, { type, title, name, description, subtype, yes }) => {
    if (type === 'profile') {
      const profiles = await p2p.listProfiles()
      if (profiles.find(profile => profile.metadata.isWritable)) {
        throw new UserError('A local profile already exists')
      }
    }

    if (type === 'content') {
      const profiles = await p2p.listProfiles()
      if (!profiles.find(profile => profile.metadata.isWritable)) {
        console.error(kleur.yellow('! Please create your profile first'))
        await module.exports.handler(p2p, { type: 'profile', yes })
        console.error(
          kleur.bold().green('✔'),
          kleur.green('Profile created! Now creating content')
        )
      }
    }

    if (type === 'content' && !title) {
      title = await prompt({
        type: 'text',
        message: 'Title',
        validate: validate.title
      })
    } else if (type === 'profile' && !name) {
      name = await prompt({
        type: 'text',
        message: 'Name',
        validate: validate.name
      })
    }
    if (description === undefined) {
      description = await prompt({
        type: 'text',
        message: 'Description'
      })
    }
    if (type === 'content' && !subtype) subtype = await prompt.subType()

    if (!yes) {
      const confirmed = await prompt({
        type: 'confirm',
        message: `License: ${licenseUrl}`,
        // the default gray wasn't always readable
        noOption: kleur.reset('(y/N)')
      })
      if (!confirmed) throw new UserError('License not confirmed')
    }

    let authors
    if (type === 'content') {
      const profiles = await p2p.listProfiles()
      authors = [profiles[0].rawJSON.url]
    }

    const { rawJSON } = await p2p.init({
      type,
      title,
      name,
      description,
      subtype,
      authors
    })
    console.log(rawJSON.url)
  }
}
