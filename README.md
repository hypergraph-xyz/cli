# Liberate Science CLI

Command Line Interface (CLI) for a p2p scholarly communication
infrastructure. More information on this infrastructure is available
in this [conceptual
publication](https://doi.org/10.3390/publications6020021) and this
[technical
publication](https://chartgerink.github.io/2018dat-com/)More
information on this infrastructure is available in this [conceptual
publication](https://doi.org/10.3390/publications6020021) and this
[technical publication](https://chartgerink.github.io/2018dat-com/)
(note these might have been extended by now and should not be regarded
as specifications).

## Usage

This is a tool for researchers to start using this new
infrastructure. In other words, it exports a `libscie` command to your
command line. If you want to develop on this infrastructure, we
recommend you look at our [Application Programmatic Interface
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

## Installation

```bash
npm install -g libscie-cli
```

If you do not have [NodeJS](https://nodejs.org/en/) installed, please
install this first. If you are running Windows/Mac OS X it is easiest
to download the installer. If you are using a package manager, you can
install `node`.

