<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Contents**

- [Installation instructions](#installation-instructions)
  - [Firefox](#firefox)
  - [Chrome](#chrome)
  - [Bergamot REST API server (temporary requirement)](#bergamot-rest-api-server-temporary-requirement)
    - [Mac OSX](#mac-osx)
    - [Linux](#linux)
    - [Windows](#windows)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Installation instructions

This document outlines how to get a pre-released version of the extension running locally.

## Firefox

- Click [here](https://github.com/mozilla-extensions/bergamot-browser-extension/releases/download/v0.1.0/bergamot_translate-0.1.0-an+fx.xpi)
- Allow extensions to be downloaded from GitHub in the popup that comes up (Click `Continue to Installation`)
- Add the extension to Firefox (Click `Add`)

## Chrome

- Download the latest Chrome zip file, linked [here](https://github.com/mozilla-extensions/bergamot-browser-extension/releases/download/v0.1.0/bergamot_translate-0.1.0.zip)
- Unpack the zip file locally
- Enter `chrome://extensions` in Chrome's address bar and press enter
- Flip the Developer mode switch up on the right so that the toolbar with the `Load unpacked`, `Pack extension` and `Update` buttons are shown
- Click `Load unpacked`
- Choose the directory that you unpacked from the zip file
- Note that the extension icon may not be visible directly. Click the puzzle icon far to the right of the address bar and click the pin symbol next to the Bergamot Translate icon so that the pin becomes blue. This will make the Bergamot Translate extension icon show at all times.

## Bergamot REST API server (temporary requirement)

Note: At this stage of development of the Bergamot translation engine, a REST API server needs to be launched from the command line on the same system that the extension runs on.

A pre-compiled native binary is only available for Mac OSX. For Windows and Linux, there is a [Docker image available](https://github.com/ugermann/marian-docker#running-the-server-locally). Instructions below.

[This dependence on a REST API server will be removed soon](https://github.com/mozilla-extensions/bergamot-browser-extension/issues/7).

### Mac OSX

```bash
git clone https://github.com/browsermt/macos-server.git
cd macos-server
./server/rest-server -c inboundModel/config.yml -p 8787 --log-level debug -w 5000
```

### Linux

```bash
git clone https://github.com/browsermt/macos-server.git
cd macos-server
docker run --rm -p 8787:8787 -v "$PWD/inboundModel":/opt/app/marian/model mariannmt/marian-rest-server /opt/app/marian/bin/rest-server -c model/config.yml -p 8787 --log-level debug -w 5000
```

### Windows

```bash
git clone https://github.com/browsermt/macos-server.git
cd macos-server
docker run --rm -p 8787:8787 -v %cd%/inboundModel:/opt/app/marian/model mariannmt/marian-rest-server /opt/app/marian/bin/rest-server -c model/config.yml -p 8787 --log-level debug -w 5000
```
