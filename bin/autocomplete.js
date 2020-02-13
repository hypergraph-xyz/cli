#!/usr/bin/env node
'use strict'

require('../lib/fs-promises')
const { platform } = require('os')
const { promises: fs } = require('fs')
const actions = require('../actions')
const kleur = require('kleur')

const actionNames = Object.keys(actions).join(' ')

const bash = `
# Completion for @hypergraph-xyz/cli
_hypergraph () {
  local cur
  COMPREPLY=()
  cur=\${COMP_WORDS[COMP_CWORD]}
  case "$COMP_CWORD" in
    1)
    COMPREPLY=($(compgen -W "${actionNames}" $cur))
  esac

  return 0
}
complete -F _hypergraph hypergraph
`

const main = async () => {
  if (!['darwin', 'linux'].includes(platform())) return

  const file = {
    darwin: '.profile',
    linux: '.bashrc'
  }[platform()]
  let profile
  try {
    profile = await fs.readFile(`${process.env.HOME}/${file}`, 'utf8')
  } catch (err) {
    console.error(kleur.gray('No profile file found.'))
    return
  }

  if (profile.includes(bash)) {
    console.log(kleur.green('Hypergraph auto complete correctly set up!'))
  } else {
    console.log(
      kleur.yellow(
        `Add this to your ~/${file} then reload to enable Hypergraph action auto completion:`
      )
    )
    console.log(kleur.gray(bash))
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
