# eleventy-plugin-syntaxhighlight

A pack of [Eleventy](https://github.com/11ty/eleventy) plugins for syntax highlighting. No browser/client JavaScript here, these highlight transformations are all done at build-time.

## Read the [Full Documentation on 11ty.dev](https://www.11ty.dev/docs/plugins/syntaxhighlight/)

---

## Kitschpatrol Fork Notes

### Features

- A markdown-it plugin with support for syntax highlighting inline markdown code like so:

    `` `cpp printf("I may be one line, but I am highlighted.");` ``

    As discussed [here](https://github.com/11ty/eleventy-plugin-syntaxhighlight/issues/38) and [here](https://github.com/sashaqred/sashaqred/blob/d165371710e059e01c6103405d8e998e4c5c938e/src/_markdown-it/index.js#L9-L12).

    Configuring this is a bit of a pain since you have to enable the markdown-it plugin explicitly (or risk invalidating any existing markdown-it options and plugins). There should be a better approach.



- Option to match Prism's HTML output escape the same characters markdown-it does. Enabled by passing the `aggressiveEscaping: true` option.

### Fixes

- Fix for unescaped output from `text` annotated code blocks. (See https://github.com/11ty/eleventy-plugin-syntaxhighlight/issues/54)

### Setup

In your project's `.eleventy.js`:

```js
const syntaxHighlightPlugin = require("@11ty/eleventy-plugin-syntaxhighlight")

module.exports = function (eleventyConfig) {
    // ...

    // Add eleventy plugin
    const syntaxHighlightOptions = { 
        inlineMarkdown: true,
        aggressiveEscaping: true
    }

    eleventyConfig.addPlugin(syntaxHighlightPlugin, syntaxHighlightOptions)

    //...

    // Add markdown-it plugin
    let markdownLib = markdownIt({
        // Your markdown-it options here...
    })
    .use(syntaxHighlight.markdownInlinePrismJs, syntaxHighlightOptions)

    eleventyConfig.setLibrary("md", markdownLib)

    //...

}
