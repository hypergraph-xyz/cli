// Add fs.promises support for node 10
const emitWarning = process.emitWarning
process.emitWarning = (...args) => {
  // istanbul ignore next
  if (args[1] !== 'ExperimentalWarning') {
    emitWarning.call(process, ...args)
  }
}
