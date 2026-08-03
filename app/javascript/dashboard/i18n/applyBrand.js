/**
 * Replaces the %BRAND% sentinel in translation messages with the installation's
 * configured name, at boot, before vue-i18n compiles anything.
 *
 * Why a sentinel instead of vue-i18n's own mechanisms:
 *
 *   - Named interpolation (`{installationName}`) needs every call site to pass
 *     the value. When it is missing vue-i18n renders an empty string, so a
 *     forgotten call site silently ships "Please update your  instance".
 *   - Linked messages (`@:BRAND.NAME`) swallow trailing punctuation into the
 *     key, so "Welcome to @:BRAND.NAME!" resolves nothing. The documented
 *     parenthesised form is not supported by vue-i18n 9 — it renders the
 *     literal "(BRAND.NAME)".
 *
 * A plain string substitution has neither failure mode, and a missing brand
 * falls back to the upstream name rather than to an empty gap.
 */

const SENTINEL = /%BRAND%/g;
const FALLBACK = 'Chatwoot';

const substitute = (node, brand) => {
  if (typeof node === 'string') {
    return node.replace(SENTINEL, brand);
  }

  if (Array.isArray(node)) {
    return node.map(item => substitute(item, brand));
  }

  if (node && typeof node === 'object') {
    return Object.fromEntries(
      Object.entries(node).map(([key, value]) => [
        key,
        substitute(value, brand),
      ])
    );
  }

  return node;
};

/**
 * @param {object} messages - locale => message tree, as built by i18n/index.js
 * @param {string} [brandName] - installation name; falls back to 'Chatwoot'
 * @returns {object} a new message tree with the sentinel resolved
 */
export const applyBrand = (messages, brandName) => {
  const brand = (brandName || '').trim() || FALLBACK;

  return substitute(messages, brand);
};

export default applyBrand;
