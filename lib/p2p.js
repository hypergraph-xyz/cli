'use strict'

const P2PCommons = require('@p2pcommons/sdk-js')
const validate = require('./validate')
const UserError = require('./user-error')

// Wrapper around the P2PCommons SDK.
// Use `name` instead of `title` when `type` is `'profile'`.
class P2P extends P2PCommons {
  _exportWithTitleRename (metadata) {
    metadata = { ...metadata }
    if (metadata.type === 'profile') {
      metadata.name = metadata.title
      delete metadata.title
    }
    return metadata
  }

  _importWithTitleRename (metadata, type) {
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
    return this._exportWithTitleRename(metadata)
  }

  async set (update) {
    const metadata = await super.get(update.url)
    if (metadata.type === 'profile') {
      if (update.title) {
        throw new UserError(
          'Only allowed to update keys name, description, main'
        )
      }
      if (update.name) {
        const result = validate.name(update.name)
        if (result !== true) throw new UserError(result)
      }
    }

    update = this._importWithTitleRename(update, metadata.type)
    return super.set(update)
  }

  async init (data) {
    data = this._importWithTitleRename(data)
    const metadata = await super.init(data)
    return this._exportWithTitleRename(metadata)
  }
}

module.exports = P2P
