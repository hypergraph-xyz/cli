const { test } = require('tap')
const { exec } = require('child_process')
const { platform } = require('os')
const { promisify } = require('util')

test('autocomplete', async t => {
  let cmd = `${__dirname}/../bin/autocomplete.js`
  let args = ''

  // istanbul ignore next
  if (platform() === 'win32') {
    [cmd, args] = ['node', cmd]
  }

  await promisify(exec)(cmd, args)
})
