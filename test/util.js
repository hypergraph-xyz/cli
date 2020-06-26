'use strict'

const { tmpdir } = require('os')
const { randomBytes } = require('crypto')
const fs = require('fs')
const execa = require('execa')
const dht = require('@hyperswarm/dht')

const DEBUG = process.env.DEBUG || process.env.CI
const path = `${__dirname}/../bin/hypergraph.js`

let bootstrapper

const BOOTSTRAP_PORT = 3301
const BOOTSTRAP_URL = `localhost:${BOOTSTRAP_PORT}`

const createLocalDHT = async () => {
  if (bootstrapper) return { bootstrap: BOOTSTRAP_URL, dht: bootstrapper }

  bootstrapper = dht({
    bootstrap: false
  })
  bootstrapper.listen(BOOTSTRAP_PORT)
  return new Promise(resolve => {
    bootstrapper.once('listening', () => {
      return resolve({
        bootstrap: BOOTSTRAP_URL,
        dht: bootstrapper
      })
    })
  })
}

const createEnv = ({
  env = `${tmpdir()}/${Date.now()}-${randomBytes(16).toString('hex')}`,
  rootDir = `${tmpdir()}/${Date.now()}-${randomBytes(16).toString('hex')}`
} = {}) => {
  if (env) fs.mkdirSync(env)
  const wrapExeca = args => {
    const ps = execa(
      path,
      [...args.split(' '), `--env=${env}`, `--root=${rootDir}`],
      {
        env: { CI: true }
      }
    )
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
  return { env, execa: wrapExeca, rootDir }
}

module.exports = { createEnv, createLocalDHT }
