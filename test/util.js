'use strict'

const { tmpdir } = require('os')
const { randomBytes } = require('crypto')
const fs = require('fs')
const execa = require('execa')

const DEBUG = process.env.DEBUG || process.env.CI
const path = `${__dirname}/../bin/hypergraph.js`

const createEnv = ({
  env = `${tmpdir()}/${Date.now()}-${randomBytes(16).toString('hex')}`
} = {}) => {
  if (env) fs.mkdirSync(env)
  const wrapExeca = args => {
    const ps = execa(path, [...args.split(' '), `--env=${env}`], {
      env: { CI: true }
    })
    // istanbul ignore next
    if (DEBUG) {
      ps.stdout.on('data', d => console.log(d.toString()))
      ps.stderr.on('data', d => console.log(d.toString()))
    }
    const then = ps.then
    ps.then = (resolve, reject) => {
      ps.stdin.end()
      then.call(ps, resolve, reject)
    }
    return ps
  }
  return { env, execa: wrapExeca }
}

module.exports = { createEnv }
