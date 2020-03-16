'use strict'

const UserError = require('../lib/user-error')
const log = require('../lib/log')
const create = require('./create')
const { decode } = require('dat-encoding')
const prompt = require('../lib/prompt')

exports.title = 'Follow a profile'
exports.help = `
  Usage
    $ hypergraph follow [profile]

  Examples
    $ hypergraph follow                Interactive mode
    $ hypergraph follow PROFILE_URL    Follow profile
`
exports.input = [
  {
    name: 'profileUrl',
    resolve: async () => {
      const url = await prompt({
        type: 'text',
        message: 'Url'
      })
      try {
        decode(url)
      } catch (_) {
        throw new UserError('Invalid url')
      }
      return url
    }
  }
]
exports.handler = async ({ p2p, profileUrl }) => {
  let writableProfiles = []
  while (!writableProfiles.length) {
    const profileMods = await p2p.listProfiles()
    writableProfiles = profileMods.filter(mod => mod.metadata.isWritable)
    if (!writableProfiles.length) {
      log.info('Please create your profile first')
      await create.handler({ p2p, type: 'profile' })
    }
  }

  await p2p.follow(writableProfiles[0].rawJSON.url, profileUrl)
  const [key, version] = profileUrl.split('+')
  if (version) {
    log.success(
      `"${writableProfiles[0].rawJSON.title}" now follows ${key} (v${version})`
    )
  } else {
    log.success(`"${writableProfiles[0].rawJSON.title}" now follows ${key}`)
  }
}
