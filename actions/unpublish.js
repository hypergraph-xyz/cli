'use strict'

const { encode } = require('dat-encoding')
const UserError = require('../lib/user-error')
const kleur = require('kleur')
const prompt = require('../lib/prompt')
const log = require('../lib/log')

module.exports = {
  title: 'Unpublish content from a profile',
  input: [
    {
      name: 'profileKey',
      resolve: async p2p => {
        const profileMods = await p2p.listProfiles()
        if (!profileMods.length) throw new UserError('No profile modules')
        const contentMods = await p2p.listContent()
        if (!contentMods.length) throw new UserError('No content modules')

        return prompt({
          type: 'select',
          message: 'Select profile module',
          warn: 'Not writable',
          choices: profileMods.map(mod => ({
            title: mod.rawJSON.title,
            value: mod.rawJSON.url,
            disabled: !mod.metadata.isWritable
          }))
        })
      }
    },
    {
      name: 'contentKey',
      resolve: async (p2p, { env, profileKey }) => {
        const profileMod = await p2p.get(profileKey)
        const contentMods = await Promise.all(profileMod.rawJSON.contents.map(url => {
          const [key, version] = url.split('+')
          const download = false
          return p2p._getModule(key, version, download)
        }))
        if (!contentMods.length) throw new UserError('No content modules')

        const choices = contentMods.map(mod => ({
          title: `${mod.module.title} (v${mod.version})`,
          value: `${mod.module.url}+${mod.version}`
        }))

        choices.sort(
          /* istanbul ignore next */
          (a, b) => a.title.localeCompare(b.title)
        )

        return prompt({
          type: 'select',
          message: 'Select content module',
          choices
        })
      }
    }
  ],
  handler: async ({ p2p, contentKey, profileKey, config }) => {
    const [content, profile] = await Promise.all([
      p2p.get(contentKey),
      p2p.get(profileKey)
    ])
    await p2p.unpublish(contentKey, profileKey)

    log.success(
      `"${content.rawJSON.title}"`,
      `(v${kleur.bold(content.metadata.version)})`,
      'unpublished from',
      profile.rawJSON.name
    )
  }
}
