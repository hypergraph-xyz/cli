const { test } = require('tap')
const execa = require('execa')

test('autocomplete', () => execa(`${__dirname}/../bin/autocomplete.js`))
