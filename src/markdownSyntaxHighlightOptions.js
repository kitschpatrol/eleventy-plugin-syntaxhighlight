const Prism = require("prismjs");
const PrismLoader = require("./PrismLoader");
const HighlightLinesGroup = require("./HighlightLinesGroup");
const getAttributes = require("./getAttributes");
const md = require("markdown-it")();
const {parseHTML} = require("linkedom");

module.exports = function (options = {}) {
  const preAttributes = getAttributes(options.preAttributes);
  const codeAttributes = getAttributes(options.codeAttributes);

  return function(str, language, isInline = false) {
    if(!language) {
      // empty string means defer to the upstream escaping code built into markdown lib.

      if (isInline) {
        // Returning "" not working for inline for some reason
        return `<code ${codeAttributes}>${md.utils.escapeHtml(str)}</code>`
      } else {
        // Works for fenced
        return ""
      }
    }

    let split = language.split("/");
    if( split.length ) {
      language = split.shift();
    }

    let html;
    if(language === "text") {
      html = md.utils.escapeHtml(str);
    } else {
      // Prism.highlight takes unescaped input only...
      // But it escapes the output much less aggressively than markdown-it.
      // E.g. technically ">" does not need escaping, but validators kvetch...
      // and it would be nice to have a single definition of "escaping" across
      // md.utils.escapeHtml and prism
      // https://github.com/PrismJS/prism/issues/2516
      // https://github.com/PrismJS/prism/pull/2746

      // Overview of what escapes what...

      // escape        markdown-it  prism   linkedom toString()
      // & to &amp;    Yes          Yes     Yes
      // < to &lt;     Yes          Yes     Yes?
      // > to &gt;     Yes          No      Yes?
      // " to &quot    Yes          No      No

      const needsExtraEscaping = options.aggressiveEscaping && /[">]/.test(str);

      html = Prism.highlight(str, PrismLoader(language), language);

      if (options.aggressiveEscaping && needsExtraEscaping) {
        const window = parseHTML(html);

        // TODO fix terrible kludge to work-around innerHTML ampersand-escaping
        // This section tries to escape quotes from prism's output for
        // consistency with markdown-it innerHTML might be returning escaped
        // html resulting in double-escaped ampersands, so temporarily use a
        // different string to represent quotes for replacement after we've
        // grabbed the output from linkedom.
        const quoteReplacementKey = "BduTBc8sKjGXgUW3VzTCMdqLF3BmnPqD";
        window.document.querySelectorAll("*").forEach((node) => {
          node.textContent = node.textContent.replaceAll(
            '"',
            quoteReplacementKey
          );
        });

        html = window.document
          .toString()
          .replaceAll(quoteReplacementKey, "&quot;");
      }
    }

    if(isInline) {
      return `<code class="language-${language}"${codeAttributes}>${html}</code>`;
    } else {
      let hasHighlightNumbers = split.length > 0;
      let highlights = new HighlightLinesGroup(split.join("/"), "/");
      let lines = html.split("\n").slice(0, -1); // The last line is empty.

      lines = lines.map(function(line, j) {
        if(options.alwaysWrapLineHighlights || hasHighlightNumbers) {
          let lineContent = highlights.getLineMarkup(j, line);
          return lineContent;
        }
        return line;
      });

      return `<pre class="language-${language}"${preAttributes}><code class="language-${language}"${codeAttributes}>${lines.join(options.lineSeparator || "<br>")}</code></pre>`;
    }
  };
};
