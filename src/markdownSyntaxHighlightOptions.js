const Prism = require("prismjs");
const PrismLoader = require("./PrismLoader");
const HighlightLinesGroup = require("./HighlightLinesGroup");
const getAttributes = require("./getAttributes");
const md = require("markdown-it")();

// TODO use existing linkedom dependency instead and remove jsdom
const { JSDOM } = require("jsdom");

module.exports = function (options = {}) {
  const preAttributes = getAttributes(options.preAttributes);
  const codeAttributes = getAttributes(options.codeAttributes);

  return function(str, language) {
    if(!language) {
      // empty string means defer to the upstream escaping code built into markdown lib.
      return "";
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

      // escape        markdown-it  prism   JSDOM.serialize()
      // & to &amp;    Yes          Yes     ?
      // < to &lt;     Yes          Yes     Yes
      // > to &gt;     Yes          No      Yes
      // " to &quot    Yes          No      No

      const needsExtraEscaping = options.aggressiveEscaping && /[">]/.test(str);

      html = Prism.highlight(str, PrismLoader(language), language);

      if(options.aggressiveEscaping && needsExtraEscaping) {
        const dom = new JSDOM(html);

        // Explicitly escape " so output matches markdown-it
        dom.window.document.querySelectorAll("*").forEach((node) => {
          node.textContent = node.textContent.replaceAll('"', "&quot;");
        });

        // Serialize escapes >
        html = dom.serialize();
      }
    }

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
  };
};
