'use strict'

const P2PCommons = require('@p2pcommons/sdk-js')
const validate = require('./validate')
const delegate = require('delegates')

// Wrapper around the P2PCommons SDK
// - uses `name` instead of `title` when `type` is `'profile'`

class P2P {
  constructor (opts) {
    this.p2p = new P2PCommons(opts)

    delegate(this, 'p2p')
      .method('ready')
      .method('destroy')
      .method('list')
      .method('listContent')
      .method('listProfiles')
      .method('publish')
  }

  async init (rawJSON) {
    rawJSON = this._import(rawJSON)
    const data = await this.p2p.init(rawJSON)
    return this._export(data)
  }

  _export (data) {
    data = { ...data }
    if (data.rawJSON.type === 'profile') {
      data.rawJSON.name = data.rawJSON.title
      delete data.rawJSON.title
    }
    return data
  }

  _import (rawJSON, type) {
    rawJSON = { ...rawJSON }
    if (!type) type = rawJSON.type
    if (type === 'profile') {
      rawJSON.title = rawJSON.name
      delete rawJSON.name
    }
    return rawJSON
  }

  async get (hash) {
    const data = await this.p2p.get(hash)
    return this._export(data)
  }

  async set (update) {
    const { rawJSON } = await this.p2p.get(update.url)
    if (rawJSON.type === 'profile') {
      if (update.title) {
        throw new P2PCommons.errors.InvalidKeyError('title')
      }
      if (typeof update.name !== 'undefined') {
        const result = validate.name(update.name)
        if (result !== true) {
          throw new P2PCommons.errors.ValidationError(null, null, 'name')
        }
      }
    }

    update = this._import(update, rawJSON.type)
    return this.p2p.set(update)
  }
}

P2P.errors = P2PCommons.errors

module.exports = P2P
