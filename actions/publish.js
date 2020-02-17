'use strict'

const { encode } = require('dat-encoding')
const UserError = require('../lib/user-error')
const kleur = require('kleur')
const { promises: fs } = require('fs')
const prompt = require('../lib/prompt')
const fetch = require('node-fetch')
const http = require('http')
const { promisify } = require('util')
const { once } = require('events')
const jsonBody = require('body/json')
const chalk = require('chalk')

module.exports = {
  title: 'Publish content to a profile',
  input: [
    {
      name: 'contentKey',
      resolve: async (p2p, { env }) => {
        const mods = await p2p.listContent()
        if (!mods.length) throw new UserError('No content modules')

        const profileMods = await p2p.listProfiles()
        if (!profileMods.length) throw new UserError('No profile modules')

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
        choices.sort(
          /* istanbul ignore next */
          (a, b) => (a.disabled === b.disabled ? 0 : a.disabled ? 1 : -1)
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
  handler: async ({ p2p, contentKey, profileKey, config }) => {
    const [content, profile] = await Promise.all([
      p2p.get(contentKey),
      p2p.get(profileKey)
    ])
    await p2p.publish(contentKey, profileKey)

    console.log(
      kleur.green('✔'),
      kleur.cyan().bold(content.rawJSON.title),
      `(version ${kleur.bold(content.metadata.version)})`,
      'published to',
      kleur.cyan().bold(profile.rawJSON.name)
    )

    if (!(await config.get('vaultUrl'))) return
    const publishToVault = await prompt({
      type: 'confirm',
      message: `Also publish to the Vault at ${await config.get('vaultUrl')}?`
    })
    if (!publishToVault) return

    if (!(await config.get('vaultToken'))) {
      const email = await prompt({
        type: 'text',
        message: 'Enter email to authenticate'
      })

      const server = http.createServer()
      await promisify(server.listen.bind(server))()
      const callback = `http://localhost:${server.address().port}`

      const url = `${await config.get('vaultUrl')}/authenticate`
      const authenticateRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ email, callback })
      })
      const { testWords } = await authenticateRes.json()
      console.log('Please check your email for an authentication link.')
      console.log(`The email must contain "${chalk.bold(testWords)}".`)

      const [req, res] = await once(server, 'request')
      const { token } = await promisify(jsonBody)(req)
      res.end()
      server.close()

      await config.set('vaultToken', token)
    }

    const publishRes = await fetch(
      `${await config.get('vaultUrl')}/api/modules`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await config.get('vaultToken')}`
        },
        body: JSON.stringify({
          url: `dat://${encode(contentKey)}+${content.metadata.version}`
        })
      }
    )
    if (!publishRes.ok) throw new Error(await publishRes.text())

    console.log('Module successfully published to the Vault!')
  }
}
