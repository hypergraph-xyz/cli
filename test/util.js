'use strict'

const childProcess = require('child_process')
const { tmpdir } = require('os')
const { promisify } = require('util')

exports.createEnv = () => {
  const path = `${__dirname}/../bin/hypergraph.js`
  const env = `${tmpdir()}/${Date.now()}-${Math.random()}`
  const spawn = args =>
    childProcess.spawn(path, [...args.split(' '), `--env=${env}`])
  const exec = args =>
    promisify(childProcess.exec)(`${path} ${args} --env=${env}`)
  return { env, spawn, exec }
}

exports.onExit = ps => new Promise(resolve => ps.on('exit', resolve))
