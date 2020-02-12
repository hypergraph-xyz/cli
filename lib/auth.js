'use strict'

const fetch = require('node-fetch')

exports.authenticate = async ({ config }) => {
  let token = await config.get('token')
  if (token) return token

  await fetch()
}
