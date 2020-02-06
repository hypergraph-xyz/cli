const { test } = require('tap')
const { exec } = require('child_process')
const { platform } = require('os')
const { promisify } = require('util')

test('autocomplete', async t => {
  const path = `${__dirname}/../bin/autocomplete.js`
  let cmd, args

  // istanbul ignore next
  if (platform() === 'win32') {
    cmd = 'node'
    args = `${path} ${args}`
  } else {
    cmd = path
    args = ''
  }

  await promisify(exec)(cmd, args)
})
