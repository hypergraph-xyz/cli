'use strict'

const P2PCommons = require('@p2pcommons/sdk-js')
const validate = require('./validate')
const delegate = require('delegates')

// Wrapper around the P2PCommons SDK
// - uses `name` instead of `title` when `type` is `'profile'`.
// - disables the swarm in CI

class P2P {
  constructor (opts) {
    this.p2p = new P2PCommons(opts)

    delegate(this, 'p2p')
      .method('ready')
      .method('destroy')
      .method('list')
      .method('listContent')
      .method('listProfiles')
  }

  async init (rawJSON) {
    rawJSON = this._import(rawJSON)
    rawJSON = await this.p2p.init(rawJSON)
    return this._exportRawJSON(rawJSON)
  }

  _exportRawJSON (rawJSON) {
    rawJSON = { ...rawJSON }
    if (rawJSON.type === 'profile') {
      rawJSON.name = rawJSON.title
      delete rawJSON.title
    }
    return rawJSON
  }

  _export (data) {
    data = { ...data }
    data.rawJSON = this._exportRawJSON(data.rawJSON)
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
          throw new P2PCommons.errors.ValidationError(null, '[name]')
        }
      }
    }

    update = this._import(update, rawJSON.type)
    return this.p2p.set(update)
  }
}

P2P.errors = P2PCommons.errors

module.exports = P2P
