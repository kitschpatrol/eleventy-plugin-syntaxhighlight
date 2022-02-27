const Prism = require("prismjs")
const PrismLoader = require("./PrismLoader")
const markdownPrismJs = require("./markdownSyntaxHighlightOptions")

module.exports = function markdownInlineSyntaxHighlight(md, options) {
  const pluginOptions = options

  md.renderer.rules.code_inline = function (tokens, idx, options, env, slf) {
    // Fish language out of content
    const token = tokens[idx]
    let language = token.content.match(/^[^\s]*/)[0]
    let str = token.content

    // Use default rule if no language is detected
    if (language && (language == "text" || Prism.languages[language])) {
      // Remove the language prefix from the content
      const stripLanguageRegEx = new RegExp("^" + language + "\\s*")
      str = str.replace(stripLanguageRegEx, "")
    } else {
      language = undefined
    }

    return markdownPrismJs(pluginOptions)(str, language, true)
  }
}
