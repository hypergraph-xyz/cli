'use strict'

const P2PCommons = require('@p2pcommons/sdk-js')
const UserError = require('./user-error')
const validate = require('./validate')

// Multiple layers of wrappers around the P2PCommons SDK,
// each implementing a certain feature set.

// Validate keys on set
class WithValidations extends P2PCommons {
  constructor (...args) {
    super(...args)
    this.InvalidKeyError = class InvalidKeyError extends UserError {}
    this.ValidationError = class ValidationError extends UserError {}
  }

  // Already covered by WithTitleRename
  // async set (update) {
  //   const metadata = await super.get(update.url)
  //   const allowedKeys = this.allowedProperties(metadata.type)
  //   for (const key of Object.keys(update)) {
  //     if (update[key] !== metadata[key]) {
  //       if (!allowedKeys.includes(key)) {
  //         throw new this.InvalidKeyError(
  //           `Only allowed to update keys ${allowedKeys.join(', ')}`
  //         )
  //       } else if (validate[key]) {
  //         const result = validate[key](update[key])
  //         if (typeof result === 'string') {
  //           throw new this.ValidationError(result)
  //         }
  //       }
  //     }
  //   }
  //   return super.set(update)
  // }
}

// Use `name` instead of `title` when `type` is `'profile'`
class WithTitleRename extends WithValidations {
  allowedKeyUpdatesWithTitleRename (type) {
    return this.allowedProperties()
      .filter(key => key !== 'subtype')
      .map(key => (key === 'title' && type === 'profile' ? 'name' : key))
  }

  _exportWithTitleRename (metadata) {
    metadata = { ...metadata }
    if (metadata.type === 'profile') {
      metadata.name = metadata.title
      delete metadata.title
    }
    return metadata
  }

  _importWithTitleRename (update, type) {
    update = { ...update }
    if (!type) type = update.type
    if (type === 'profile') {
      update.title = update.name
      delete update.name
    }
    return update
  }

  async get (hash, ...args) {
    const metadata = await super.get(hash, ...args)
    return this._exportWithTitleRename(metadata)
  }

  async set (update) {
    const metadata = await super.get(update.url)
    const allowedKeys = this.allowedKeyUpdatesWithTitleRename(metadata.type)

    for (const key of Object.keys(update)) {
      if (update[key] !== metadata[key]) {
        if (!allowedKeys.includes(key)) {
          throw new this.InvalidKeyError(
            `Only allowed to update keys ${allowedKeys.join(', ')}`
          )
        } else if (validate[key]) {
          const result = validate[key](update[key])
          if (typeof result === 'string') {
            throw new this.ValidationError(result)
          }
        }
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

class P2P extends WithTitleRename {}

module.exports = P2P
