#!/usr/bin/env node
'use strict'

process.title = 'hypergraph'

require('../lib/fs-promises')
const minimist = require('minimist')
const UserError = require('../lib/user-error')
const pkg = require('../package.json')
const hypergraph = require('..')
const updateNotifier = require('update-notifier')
const {
  errors: { ValidationError, InvalidKeyError }
} = require('../lib/p2p')
const log = require('../lib/log')
const actions = require('../actions')

const help = `
  Usage
    $ hypergraph <action> <input>

  Actions
    create   <type>               Create a module
    read     <hash> [key]         Read a module's metadata
    update   <hash> [key value]   Update a module's metadata
    open     <hash>               Open a module's folder
    main     <hash>               Open a module's main file
    path     <hash>               Print module path
    list     <type>               List writable modules
    edit     <hash>               Edit main file
    publish  <profile> <content>  Publish content to a profile
    config   <key> [value]        Change hypergraph configuration
    logout                        Log out of Vault account

  Options
    --env, -e                  Dotfiles path (default ~/.p2pcommons)
    --help, -h                 Display help text
    --version, -v              Display version
    --title, -t                A content module's title
    --name, -n                 A profile module's name
    --subtype, -s              A content module's subtype
    --description, -d          Module description
    --parent, -p               Module parent(s)
    --yes, -y                  Confirm license for module creation
  
  Module types
    - content                  A content module
    - profile                  A user profile module

  Examples
    $ hypergraph               [interactive mode]
`

const argv = minimist(process.argv.slice(2), {
  alias: {
    env: 'e',
    help: 'h',
    version: 'v',
    title: 't',
    name: 'n',
    description: 'd',
    yes: 'y',
    subtype: 's',
    parent: 'p'
  },
  string: ['env', 'title', 'name', 'description', 'parent']
})

if (argv.help || (argv._[0] && !actions[argv._[0]])) {
  console.log(help)
  process.exit(1)
}

if (argv.version) {
  console.log(pkg.version)
  process.exit(0)
}

updateNotifier({ pkg }).notify()

hypergraph(argv).catch(err => {
  // istanbul ignore else
  if (err instanceof ValidationError) {
    log.error(`Invalid ${err.key}`)
  } else if (err instanceof UserError || err instanceof InvalidKeyError) {
    if (err.message) {
      log.error(err.message)
    }
  } else {
    log.error(err.stack)
  }

  process.exit(1)
})
