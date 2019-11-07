'use strict'

const childProcess = require('child_process')
const { tmpdir } = require('os')
const { promisify } = require('util')

const { DEBUG } = process.env

exports.createEnv = () => {
  const path = `${__dirname}/../bin/hypergraph.js`
  const env = `${tmpdir()}/${Date.now()}-${Math.random()}`
  const spawn = args => {
    // istanbul ignore next
    if (DEBUG) console.log(`spawn ${args}`)

    const ps = childProcess.spawn(path, [...args.split(' '), `--env=${env}`])

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

exports.onExit = ps => new Promise(resolve => ps.on('exit', resolve))
