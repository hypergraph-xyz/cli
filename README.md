# Liberate Science CLI

[![NPM](https://nodei.co/npm/libscie-cli.png)](https://npmjs.org/package/libscie-cli)

Command Line Interface (CLI) for a Public Collaborative Project (PCP)
infrastructure.

This environment was developed initially for use in scholarly
communication but can be applied outside as well.

## Installation

```bash
npm install -g libscie-cli
```

If you do not have [NodeJS](https://nodejs.org/en/) installed, please
install this first. If you are running Windows/Mac OS X it is easiest
to download the installer. If you are using a package manager, you can
install `node`.

## Usage

This is a tool to start using public collaborative infrastructure.

After installation, the `libscie` command is exported to your command
line. If you want to develop applications on using this public
collaborative infrastructure, we recommend you look at our
[Application Programmatic Interface
(API)](https://github.com/libscie/api).

We follow a simple format for the commands, similar to Git. This means
that all commands are structured as

```bash
libscie <action> <input>
```

Help is provided under `libscie --help`

```bash
Command Line Interface (CLI) for a p2p scholarly communication infrastructure.

  Usage
    $ libscie <action> <input>

  Options
    --env, -e  Custom environment (defaults to ~/.libscie/)

  Examples
    $ libscie init profile
```

## Contributing

