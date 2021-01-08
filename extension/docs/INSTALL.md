<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Contents**

- [Installation and usage instructions](#installation-and-usage-instructions)
  - [Bergamot REST API server (temporary requirement)](#bergamot-rest-api-server-temporary-requirement)
    - [Mac OSX](#mac-osx)
    - [Windows and Linux](#windows-and-linux)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Installation and usage instructions

## Bergamot REST API server (temporary requirement)

Note: At this stage of development of the Bergamot translation engine, a REST API server needs to be launched from the command line on the same system that the extension runs on.
[This dependence on a REST API server will be removed soon](https://github.com/mozilla-extensions/bergamot-browser-extension/issues/7).

### Mac OSX

```
git clone https://github.com/browsermt/macos-server.git
cd macos-server
./server/rest-server -c inboundModel/config.yml -p 8787 --log-level debug -w 5000
```

### Windows and Linux

The binary is currently only available for Mac OSX. For any other system, compile from source: [https://github.com/browsermt/mts](https://github.com/browsermt/mts).
