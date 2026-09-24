/**
 * WhatsApp click-to-chat.
 *
 * This is the site's conversion point. There is no cart and no checkout
 * (§40, §42), so an inquiry that arrives already knowing which product it is
 * about is the whole mechanism — a bare "contact us" would make the visitor
 * retype what the page already knew.
 *
 * A plain `https://wa.me/...` link, which works on a static host with nothing
 * behind it.
 */

/**
 * Fills a message template. The token is `{product}` rather than a positional
 * argument so the string stays editable as content — an editor rewriting the
 * greeting never has to think about argument order.
 */
export function fillTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

export function whatsappLink(number: string, message: string): string {
  // Digits only: wa.me rejects punctuation, and a leading "+" breaks the path.
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
