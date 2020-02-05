'use strict'

const { encode } = require('dat-encoding')
const UserError = require('../lib/user-error')
const kleur = require('kleur')
const { promises: fs } = require('fs')
const prompt = require('../lib/prompt')

module.exports = {
  title: 'Register content to a profile',
  input: [
    {
      name: 'contentKey',
      resolve: async (p2p, { env }) => {
        const mods = await p2p.listContent()
        if (!mods.length) throw new UserError('No content modules')
        const choices = []
        for (const mod of mods) {
          const choice = {
            title: mod.rawJSON.title,
            value: mod.rawJSON.url,
            disabled: false
          }
          if (!mod.rawJSON.title || !mod.rawJSON.main) {
            choice.disabled = true
          } else {
            try {
              const path = `${env}/${encode(mod.rawJSON.url)}/${
                mod.rawJSON.main
              }`
              await fs.stat(path)
            } catch (err) {
              choice.disabled = true
            }
          }
          choices.push(choice)
        }
        choices.sort((a, b) =>
          a.disabled === b.disabled ? 0 : a.disabled ? 1 : -1
        )

        return prompt({
          type: 'select',
          message: 'Select content module',
          warn: 'Need valid .main and .title',
          choices
        })
      }
    },
    {
      name: 'profileKey',
      resolve: async p2p => {
        const mods = await p2p.listProfiles()
        if (!mods.length) throw new UserError('No profile modules')
        return prompt({
          type: 'select',
          message: 'Select profile module',
          warn: 'Not writable',
          choices: mods.map(mod => ({
            title: mod.rawJSON.title,
            value: mod.rawJSON.url,
            disabled: !mod.metadata.isWritable
          }))
        })
      }
    }
  ],
  handler: async (p2p, { contentKey, profileKey }) => {
    const [content, profile] = await Promise.all([
      p2p.get(contentKey),
      p2p.get(profileKey)
    ])
    await p2p.register(contentKey, profileKey)

    console.log(
      kleur.green('✔'),
      kleur.cyan().bold(content.rawJSON.title),
      `(version ${kleur.bold(content.metadata.version)})`,
      'registered to',
      kleur.cyan().bold(profile.rawJSON.name)
    )
  }
}
