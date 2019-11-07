'use strict'

const childProcess = require('child_process')
const { tmpdir } = require('os')
const { promisify } = require('util')
const { randomBytes } = require('crypto')

const DEBUG = process.env.DEBUG || process.env.CI

exports.createEnv = () => {
  const path = `${__dirname}/../bin/hypergraph.js`
  const env = `${tmpdir()}/${Date.now()}-${randomBytes(16).toString('hex')}`
  const spawn = args => {
    // istanbul ignore next
    if (DEBUG) console.log(`spawn ${args}`)

    const ps = childProcess.spawn(path, [...args.split(' '), `--env=${env}`], {
      shell: true
    })

    ps.stdoutDebug = ''
    ps.stdout.on('data', d => (ps.stdoutDebug += d))

    // istanbul ignore next
    if (DEBUG) {
      ps.stdout.on('data', d => console.log(d.toString()))
      ps.stderr.on('data', d => console.log(d.toString()))
    }

    return ps
  }
  const exec = args => {
    // istanbul ignore next
    if (DEBUG) console.log(`exec ${args}`)

    return promisify(childProcess.exec)(`${path} ${args} --env=${env}`)
  }
  return { env, spawn, exec }
}

exports.onExit = ps =>
  new Promise((resolve, reject) => {
    ps.stdin.end()
    ps.on('exit', (code, signal) => {
      if (typeof code === 'number') {
        resolve(code)
      } else {
        reject(new Error(`${signal}\n${ps.stdoutDebug}`))
      }
    })
  })
