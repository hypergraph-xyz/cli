# Hypergraph CLI

[![All Contributors](https://img.shields.io/badge/all_contributors-3-orange.svg?style=flat-square)](#contributors-)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Code Style Prettier Standard](https://img.shields.io/badge/format-prettier_standard-ff69b4.svg)](https://github.com/sheerun/prettier-standard)
[![Greenkeeper badge](https://badges.greenkeeper.io/hypergraph-xyz/cli.svg)](https://greenkeeper.io/)
![ci](https://github.com/hypergraph-xyz/cli/workflows/ci/badge.svg)

Command Line Interface (CLI) utilising the [peer-to-peer commons](https://p2pcommons.com).

This environment was developed initially for use in scholarly
communication but can be applied outside as well. Anything that can
benefit from a step-by-step approach with provenance pretty much
(@chartgerink also hopes to use it for music :musical_keyboard:).

## Installation

```bash
npm install -g @hypergraph-xyz/cli
```

If you do not have [NodeJS](https://nodejs.org/) installed, please
install this first. Some additional instructions follow.

### Windows

Directly download the NodeJS installer, or install it through the [Chocolatey](https://chocolatey.org/) package manager.

### Mac OS

[Install Homebrew](https://brew.sh/) and install NodeJS and the Hypergraph dependencies from the Terminal

```zsh
brew install node libtool autoconf automake
```

### Linux

Using your package manager, install NodeJS.

```bash
apt install nodejs
```

## Usage

```bash
$ hypergraph --help

  Usage
    $ hypergraph <action> <input>

  Actions
    create   <type>               Create a module
    read     <hash> [key]         Read a module's metadata
    update   <hash> [key value]   Update a module's metadata
    delete   <hash>               Delete a content module
    open     <hash>               Open a module's folder
    main     <hash>               Open a module's main file
    path     <hash>               Print module path
    list     <type>               List writable modules
    edit     <hash>               Edit main file
    publish  <profile> <content>  Publish content to a profile
    config   <key> [value]        Change hypergraph configuration
    logout                        Log out of Vault account

  Options
    --env, -e                  Dotfiles path (default ~/.p2pcommons)
    --help, -h                 Display help text
    --version, -v              Display version
    --title, -t                A content module's title
    --name, -n                 A profile module's name
    --subtype, -s              A content module's subtype
    --description, -d          Module description
    --parent, -p               Module parent(s)
    --yes, -y                  Confirm license for module creation

  Module types
    - content                  A content module
    - profile                  A user profile module

  Examples
    $ hypergraph               [interactive mode]

```

This tool _directly_ allows you to start using public collaborative
infrastructure.

After installation, the `hypergraph` command is exported to your command
line.

We follow a simple format for the commands. However, we realize this
isn't easy to remember at first so you can also invoke interactive
mode by simply giving `hypergraph`. You will be guided through all the
options one-by-one. :angel-tone4:

All commands are structured as

```bash
hypergraph <action> <input> <arguments>
```

You will always be provided with an interactive set of options if you
omit an action, input, or argument(s) (if relevant).

Help is provided under `hypergraph --help` and the maintainers will do
their best to answer your questions in the issues.

## Contributing

Please note we adhere to a [Code of Conduct](./CODE_OF_CONDUCT.md) and
any contributions not in line with it (_tl;dr_ be an empathetic,
considerate person) will not be accepted. Please notify
[@chartgerink](mailto:chris@libscie.org) if anything happens.

If you want to develop your own applications using this public
collaborative infrastructure, we recommend you look at our
[Application Programmatic Interface
(API)](https://github.com/libscie/api). All data is portable between
applications if it adheres to the specifications outlined in that
repository.

## How to release

1. `npm run release` will guide you through the node module process and create a GitHub release
1. Write release notes and publish the GitHub release
1. Tell your Hypergraph friends about it

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
<table>
  <tr>
    <td align="center"><a href="http://twitter.com/juliangruber/"><img src="https://avatars2.githubusercontent.com/u/10247?v=4" width="100px;" alt="Julian Gruber"/><br /><sub><b>Julian Gruber</b></sub></a><br /><a href="#maintenance-juliangruber" title="Maintenance">🚧</a> <a href="https://github.com/hypergraph-xyz/cli/commits?author=juliangruber" title="Code">💻</a> <a href="https://github.com/hypergraph-xyz/cli/commits?author=juliangruber" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/nehamoopen"><img src="https://avatars3.githubusercontent.com/u/37183829?v=4" width="100px;" alt="nehamoopen"/><br /><sub><b>nehamoopen</b></sub></a><br /><a href="#ideas-nehamoopen" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://chjh.nl"><img src="https://avatars0.githubusercontent.com/u/2946344?v=4" width="100px;" alt="Chris Hartgerink"/><br /><sub><b>Chris Hartgerink</b></sub></a><br /><a href="#ideas-chartgerink" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/hypergraph-xyz/cli/commits?author=chartgerink" title="Tests">⚠️</a> <a href="https://github.com/hypergraph-xyz/cli/commits?author=chartgerink" title="Code">💻</a></td>
  </tr>
</table>

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
