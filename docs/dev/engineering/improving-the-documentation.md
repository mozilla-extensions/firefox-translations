# Improving the documentation

The documentation in this repository pertains to the client-side code for the Firefox Translations feature.

The human-written documentation is written in Markdown and converted to static HTML using [mdBook](https://rust-lang.github.io/mdBook/).

API docs are generated using [TypeDoc](https://typedoc.org/) using the [typedoc-plugin-markdown](https://www.npmjs.com/package/typedoc-plugin-markdown).

## Building documentation

### Generating the API documentation

```sh
yarn workspace docs generate-api-docs
```

### Building the human-written documentation

Rust and [mdBook](https://rust-lang.github.io/mdBook/) is required in order to build the documentation. Installation instructions for Mac:

```sh
xcode-select --install
brew install rust
cargo install mdbook mdbook-mermaid mdbook-open-on-gh
```

Add `~/.cargo/bin` to your PATH, eg:

```sh
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bash_profile
```

Open up a new terminal.

Now the docs can be built with:

```sh
yarn workspace docs build
```

The built documentation is saved in `build/docs/`.

## Developer/watch mode

```sh
yarn workspace docs watch
```

This makes the user documentation available locally on http://0.0.0.0:3000/user/index.html and http://0.0.0.0:3000/dev/index.html. Changes made in the `docs/` directory will result in a rebuild and client reload.

### Checking links

Internal links within the documentation can be checked using the [`link-checker`](https://www.npmjs.com/package/link-checker) tool.
External links are currently not checked, since this takes considerable time and frequently fails in CI due to networking restrictions or issues.

Link checking runs automatically in CI, and requires building the human-written documentation as well the generated API documentation first. To run link checking locally, run:

```sh
yarn workspace docs linkcheck
```

### Spell checking

The human-written documentation (but not the generated API documentation) is spell checked using [aspell](http://aspell.net/).

On Unix-like platforms, it can be installed using your system's package manager:

```sh
sudo apt install aspell-en
# ...or...
sudo dnf install aspell-en
# ...or...
brew install aspell
```

Note that aspell 0.60.8 or later is required, as that is the first release with markdown support.

Spell checking runs automatically in CI. You can the spell check the documentation using the following:

```sh
yarn workspace docs spellcheck
```

This will bring up an interactive spell-checking environment in the console.
Pressing `a` to add a word will add it to the project's local `.dictionary` file, and the changes should be committed to `git`.
