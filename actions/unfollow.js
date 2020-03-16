'use strict'

const UserError = require('../lib/user-error')
const log = require('../lib/log')
const prompt = require('../lib/prompt')

exports.title = 'Unfollow a profile'
exports.help = `
  Usage
    $ hypergraph unfollow [profile]

  Examples
    $ hypergraph unfollow              Interactive mode
    $ hypergraph unfollow PROFILE_URL  Unfollow profile
`
exports.input = [
  {
    name: 'profileUrl',
    resolve: async p2p => {
      const profiles = await p2p.listProfiles()
      const writableProfiles = profiles.filter(mod => mod.metadata.isWritable)
      if (!writableProfiles.length) throw new UserError('No local profile')
      const following = await Promise.all(
        writableProfiles[0].rawJSON.follows.map(async url => {
          const [key, version] = url.split('+')
          const download = false
          const {
            module: { title }
          } = await p2p.clone(key, version, download)
          return { title, version, url }
        })
      )
      if (!following.length) throw new UserError('Not following anyone')
      return prompt({
        type: 'select',
        message: 'Select profile module to unfollow',
        choices: following.map(({ title, version, url }) => ({
          title: `${title}${version ? ` (v${version})` : ''}`,
          value: url
        }))
      })
    }
  }
]
exports.handler = async ({ p2p, profileUrl }) => {
  const profiles = await p2p.listProfiles()
  const writableProfiles = profiles.filter(mod => mod.metadata.isWritable)
  if (!writableProfiles.length) throw new UserError('No local profile')
  const following = await p2p.get(profileUrl)

  await p2p.unfollow(writableProfiles[0].rawJSON.url, profileUrl)
  const [, version] = profileUrl.split('+')
  if (version) {
    log.success(
      `"${writableProfiles[0].rawJSON.title}"`,
      'stopped following',
      `"${following.rawJSON.name}"`,
      `(v${version})`
    )
  } else {
    log.success(
      `"${writableProfiles[0].rawJSON.title}"`,
      'stopped following',
      `"${following.rawJSON.name}"`
    )
  }
}
