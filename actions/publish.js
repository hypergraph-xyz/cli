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
const ora = require('ora')
const log = require('../lib/log')

exports.title = 'Publish content to a profile'
exports.help = `
  Usage
    $ hypergraph publish [profile] [content]

  Examples
    $ hypergraph publish                          Interactive mode
    $ hypergraph publish PROFILE_URL              Publish content to profile
    $ hypergraph publish PROFILE_URL \\            Publish content
                         CONTENT_URL
`
exports.input = [
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
      const [contentMods, profileMod] = await Promise.all([
        p2p.listContent(),
        p2p.get(profileKey)
      ])
      if (!contentMods.length) throw new UserError('No content modules')

      const choices = []
      for (const contentMod of contentMods) {
        const choice = {
          title: `${contentMod.rawJSON.title} (v${contentMod.metadata.version})`,
          value: `${contentMod.rawJSON.url}+${contentMod.metadata.version}`,
          disabled: false
        }
        if (
          !contentMod.rawJSON.title ||
          !contentMod.rawJSON.main ||
          profileMod.rawJSON.contents.find(publishedUrl => {
            const [publishedKey, publishedVersion] = publishedUrl.split('+')
            return (
              encode(publishedKey) === encode(contentMod.rawJSON.url) &&
              Number(publishedVersion) === contentMod.metadata.version
            )
          })
        ) {
          choice.disabled = true
        } else {
          try {
            const path = `${env}/${encode(contentMod.rawJSON.url)}/${
              contentMod.rawJSON.main
            }`
            await fs.stat(path)
          } catch (err) {
            choice.disabled = true
          }
        }
        choices.push(choice)
      }

      const publishableChoices = choices.filter(choice => !choice.disabled)
      if (!publishableChoices.length) {
        throw new UserError('No unpublished module with valid .main and .title')
      }

      choices.sort(
        /* istanbul ignore next */
        (a, b) => (a.disabled === b.disabled ? 0 : a.disabled ? 1 : -1)
      )

      return prompt({
        type: 'select',
        message: 'Select content module',
        warn: 'Need unpublished module with valid .main and .title',
        choices
      })
    }
  }
]
exports.handler = async ({ p2p, contentKey, profileKey, config }) => {
  const [content, profile] = await Promise.all([
    p2p.get(contentKey),
    p2p.get(profileKey)
  ])
  await p2p.publish(contentKey, profileKey)

  log.success(
    content.rawJSON.title,
    `(version ${kleur.bold(content.metadata.version)})`,
    'published to',
    profile.rawJSON.name
  )

  if (!config.get('vaultUrl')) return
  const publishToVault = await prompt({
    type: 'confirm',
    message: `Also publish to the Vault at ${kleur.cyan(
      config.get('vaultUrl')
    )}?`
  })
  if (!publishToVault) return

  if (!config.get('vaultToken')) {
    const email = await prompt({
      type: 'text',
      message: 'Enter email to authenticate'
    })

    const spinner = ora('Sending email').start()
    const server = http.createServer()
    await promisify(server.listen.bind(server))()
    const callback = `http://localhost:${server.address().port}`

    const url = `${config.get('vaultUrl')}/authenticate`
    const authenticateRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ email, callback })
    })
    const { testWords } = await authenticateRes.json()
    spinner.stop()

    log.info('Please check your email for an authentication link.')
    log.info(`The email must contain "${kleur.bold(testWords)}".`)

    const [req, res] = await once(server, 'request')
    const { token } = await promisify(jsonBody)(req)
    res.end()
    server.close()

    await config.set('vaultToken', token)
    log.success('Successfully logged in!')
  }

  const publishRes = await fetch(`${config.get('vaultUrl')}/api/modules`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.get('vaultToken')}`
    },
    body: JSON.stringify({
      url: `dat://${encode(contentKey)}+${content.metadata.version}`
    })
  })
  if (!publishRes.ok) throw new Error(await publishRes.text())

  console.log('Module successfully published to the Vault!')
}
