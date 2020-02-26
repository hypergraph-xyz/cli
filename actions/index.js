module.exports = {
  create: () => require('./create'),
  read: () => require('./read'),
  update: () => require('./update'),
  delete: () => require('./delete'),
  open: () => require('./open'),
  main: () => require('./main'),
  path: () => require('./path'),
  list: () => require('./list'),
  edit: () => require('./edit'),
  publish: () => require('./publish'),
  unpublish: () => require('./unpublish'),
  follow: () => require('./follow'),
  unfollow: () => require('./unfollow'),
  config: () => require('./config'),
  logout: () => require('./logout')
}
