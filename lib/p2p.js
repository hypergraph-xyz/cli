'use strict'

const P2PCommons = require('@p2pcommons/sdk-js')
const validate = require('./validate')

// Wrapper around the P2PCommons SDK.
// Uses `name` instead of `title` when `type` is `'profile'`.
class P2P extends P2PCommons {
  _export (metadata) {
    metadata = { ...metadata }
    if (metadata.type === 'profile') {
      metadata.name = metadata.title
      delete metadata.title
    }
    return metadata
  }

  _import (metadata, type) {
    metadata = { ...metadata }
    if (!type) type = metadata.type
    if (type === 'profile') {
      metadata.title = metadata.name
      delete metadata.name
    }
    return metadata
  }

  async get (hash, ...args) {
    const metadata = await super.get(hash, ...args)
    return this._export(metadata)
  }

  async set (update) {
    const metadata = await super.get(update.url)
    if (metadata.type === 'profile') {
      if (update.title) {
        throw new P2PCommons.errors.InvalidKeyError('title')
      }
      if (typeof update.name !== 'undefined') {
        const result = validate.name(update.name)
        if (result !== true) {
          throw new P2PCommons.errors.ValidationError('name', update.name)
        }
      }
    }

    update = this._import(update, metadata.type)
    return super.set(update)
  }

  async init (data) {
    data = this._import(data)
    const metadata = await super.init(data)
    return this._export(metadata)
  }
}

module.exports = P2P
