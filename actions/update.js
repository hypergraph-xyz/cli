'use strict'

const prompt = require('../lib/prompt')
const readdirp = require('readdirp')
const validate = require('../lib/validate')
const UserError = require('../lib/user-error')
const { encode } = require('dat-encoding')
const log = require('../lib/log')

exports.title = 'Update metadata'
exports.help = `
  Usage
    $ hypergraph update [hash]

  Command options
    --title, -t                             A content module's title
    --name, -n                              A profile module's name
    --subtype, -s                           WikiData identifier
    --description, -d                       Module description
    --parent, -p                            A content module's parent(s)
    --main, -m                              Path to main file

  Examples
    $ hypergraph update                     Interactive mode
    $ hypergraph update URL                 Update module
    $ hypergraph update URL -t title \\      Update title and description
                            -d description       
`
exports.input = [
  {
    name: 'hash',
    resolve: async p2p => {
      const mods = await p2p.list()
      const writable = mods.filter(mod => mod.metadata.isWritable)
      if (!writable.length) throw new UserError('No writable modules')
      return prompt({
        type: 'select',
        message: 'Select module',
        choices: writable.map(({ rawJSON }) => ({
          title: rawJSON.title,
          value: rawJSON.url
        }))
      })
    }
  }
]
exports.handler = async ({
  p2p,
  env,
  hash,
  title,
  name,
  subtype,
  description,
  parent,
  main
}) => {
  const update = { url: hash }

  if (
    title !== undefined ||
    name !== undefined ||
    subtype !== undefined ||
    description !== undefined ||
    parent !== undefined ||
    main !== undefined
  ) {
    if (title !== undefined) update.title = title
    if (name !== undefined) update.name = name
    if (subtype !== undefined) update.subtype = subtype
    if (description !== undefined) update.description = description
    if (main !== undefined) update.main = main
    if (parent !== undefined) {
      update.parents = typeof parent === 'string' ? [parent] : parent
      update.parents = update.parents.map(url => {
        const [key, ...version] = url.split('+')
        return [`dat://${encode(key)}`, ...version].join('+')
      })
    }
  } else {
    const { rawJSON } = await p2p.get(hash)

    if (rawJSON.type === 'content') {
      // title
      update.title = await prompt({
        type: 'text',
        message: 'Title',
        initial: rawJSON.title,
        validate: validate.title
      })
    } else {
      // name
      update.name = await prompt({
        type: 'text',
        message: 'Name',
        initial: rawJSON.name,
        validate: validate.name
      })
    }

    // description
    update.description = await prompt({
      type: 'text',
      message: 'Description',
      initial: rawJSON.description
    })

    // main
    const entries = await readdirp.promise(`${env}/${encode(rawJSON.url)}/`, {
      fileFilter: ['!dat.json', '!.*'],
      directoryFilter: ['.dat']
    })
    if (entries.length) {
      update.main = await prompt({
        type: 'select',
        message: 'Main',
        choices: entries.map(entry => ({
          title: entry.path,
          value: entry.path
        }))
      })
    } else {
      log.info('No main file to set available')
    }

    if (rawJSON.type === 'content') {
      // subtype
      update.subtype = await prompt.subType(rawJSON.subtype)

      // parents
      const published = await p2p.listPublished()
      const potentialParents = published
        .filter(mod => mod.rawJSON.url !== rawJSON.url)
        .sort((a, b) => a.rawJSON.title.localeCompare(b.rawJSON.title))
      if (potentialParents.length) {
        update.parents = await prompt({
          type: 'multiselect',
          message: 'Parents',
          choices: potentialParents.map(mod => ({
            title: mod.rawJSON.title,
            value: `dat://${encode(mod.rawJSON.url)}`,
            selected: rawJSON.parents.includes(mod.rawJSON.url)
          }))
        })
      } else {
        log.info('No parent module to set available')
      }
    }
  }

  await p2p.set(update)
}
