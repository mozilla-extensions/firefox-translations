# Introduction

The **Firefox Translations Web Extension** ties together the various components that together form the **Firefox Translations** feature.

The source code is available at [https://github.com/mozilla-extensions/firefox-translations/]().

## About this guide

This guide is meant for developers of the **Firefox Translations Web Extension**.

For developer documentation related to any other part than the Web Extension (and what those parts may be), check the section called `Related repositories` below.

For user documentation on the **Firefox Translations** feature, refer to [Firefox Translations User Guide](../user/index.html).

## The main sections of this guide

- **[Engineering](./engineering/overview.md)** - Details how to get your hands dirty and contribute to the codebase
- **[Architecture](./architecture/overview.md)** - A description of the main components and how they interact with each other
- **[Maintenance](./maintenance/overview.md)** - Shorter tutorials on how to achieve specific maintenance tasks

## Reporting bugs/issues

To report engineering-related issues or request changes specific to the **Firefox Translations Web Extension**, [file a bug on GitHub](https://github.com/mozilla-extensions/firefox-translations/issues/).

## Related repositories

The other repositories that together build up the **Firefox Translations** feature are:

- **Bergamot Translator** - The translation engine ([Source code](https://github.com/mozilla/bergamot-translator))
- **Language Models** - The files that the translation engine uses to translate between languages ([Source code](https://github.com/mozilla-applied-ml/bergamot-models))
- **Firefox** - Contains UI elements and optimizations specific to the translations feature ([Firefox source code documentation](https://firefox-source-docs.mozilla.org/))

### The relationship between the repositories

<pre class="mermaid">erDiagram
    BROWSER ||--|| THIS-WEB-EXTENSION : bundles-or-installs
    THIS-WEB-EXTENSION ||..|{ LANGUAGE-MODELS : downloads
    THIS-WEB-EXTENSION ||..|| BERGAMOT-TRANSLATOR : downloads
    THIS-WEB-EXTENSION ||--|| BERGAMOT-TRANSLATOR : consumes
    BERGAMOT-TRANSLATOR ||--|{ LANGUAGE-MODELS : loads
</pre>

## License

Firefox Translations Source Code is subject to the terms of the Mozilla Public License v2.0.
You can obtain a copy of the MPL at <https://mozilla.org/MPL/2.0/>.
