# Hypergraph CLI

[![NPM](https://nodei.co/npm/@hypergraph-xyz/cli.png)](https://npmjs.org/package/@hypergraph-xyz/cli)

[![Build Status](https://travis-ci.com/hypergraph-xyz/cli.svg?branch=master)](https://travis-ci.com/hypergraph-xyz/cli)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Code Style Prettier Standard](https://img.shields.io/badge/format-prettier_standard-ff69b4.svg)](https://github.com/sheerun/prettier-standard)

Command Line Interface (CLI) for a Public Collaborative Project (PCP)
infrastructure.

This environment was developed initially for use in scholarly
communication but can be applied outside as well. Anything that can
benefit from a step-by-step approach with provenance pretty much
(@chartgerink also hopes to use it for music :musical_keyboard:).

## Installation

```bash
npm install -g @hypergraph-xyz/cli
```

If you do not have [NodeJS](https://nodejs.org/en/) installed, please
install this first. If you are running Windows/Mac OS X it is easiest
to download the installer. If you are using a package manager, you can
install `node`.

## Usage

```bash
$ hypergraph --help

  Usage
    $ hypergraph <action> <input>

  Actions
    create <type>              Create a module
    read   <hash> [key]        Read a module's metadata
    update <hash> [key value]  Update a module's metadata
    open   <hash>              Open a module's folder
    path   <hash>              Print module path
    list   <type>              List writable modules

  Options
    --env, -e                  Dotfiles path (default ~/.p2pcommons)
    --help, -h                 Display help text
    --version, -v              Display version
    --title, -t                A content module's title
    --name, -n                 A profile module's name
    --description, -d          Module description

  Module types
    - content                  A content module
    - profile                  A user profile module

  Examples
    $ hypergraph               [interactive mode]

```

This tool *directly* allows you to start using public collaborative
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
any contributions not in line with it (*tl;dr* be an empathetic,
considerate person) will not be accepted. Please notify
[@chartgerink](mailto:chris@libscie.org) if anything happens.

If you want to develop your own applications using this public
collaborative infrastructure, we recommend you look at our
[Application Programmatic Interface
(API)](https://github.com/libscie/api). All data is portable between
applications if it adheres to the specifications outlined in that
repository.

