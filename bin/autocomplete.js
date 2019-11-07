#!/usr/bin/env node
'use strict'

require('../lib/fs-promises')
const { platform } = require('os')
const { promises: fs } = require('fs')
const { actions } = require('..')
const kleur = require('kleur')

const actionNames = Object.keys(actions).join(' ')

const darwin = `
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
  if (platform() !== 'darwin') return

  const profile = await fs.readFile(`${process.env.HOME}/.profile`, 'utf8')
  if (profile.includes(darwin)) {
    console.log(kleur.green('Hypergraph auto complete correctly set up!'))
  } else {
    console.log(
      kleur.yellow(
        'Add this to your ~/.profile then reload to enable Hypergraph action auto completion:'
      )
    )
    console.log(kleur.gray(darwin))
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
