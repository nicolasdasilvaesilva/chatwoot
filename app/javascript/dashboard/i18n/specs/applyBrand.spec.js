import { applyBrand } from '../applyBrand';

describe('applyBrand', () => {
  it('replaces the sentinel with the installation name', () => {
    const messages = { en: { KEY: 'Welcome to %BRAND%!' } };

    expect(applyBrand(messages, 'Indica Fácil').en.KEY).toBe(
      'Welcome to Indica Fácil!'
    );
  });

  it('replaces every occurrence in the same string', () => {
    const messages = { en: { KEY: '%BRAND% talks to %BRAND%' } };

    expect(applyBrand(messages, 'Acme').en.KEY).toBe('Acme talks to Acme');
  });

  it('survives punctuation right after the sentinel', () => {
    // The reason this helper exists: vue-i18n linked messages swallow trailing
    // punctuation into the key, and its parenthesised escape is not supported.
    const messages = {
      en: { A: 'Use %BRAND%!', B: 'Use %BRAND%.', C: 'Use %BRAND%, please' },
    };
    const out = applyBrand(messages, 'Acme').en;

    expect([out.A, out.B, out.C]).toEqual([
      'Use Acme!',
      'Use Acme.',
      'Use Acme, please',
    ]);
  });

  it('walks nested objects and arrays', () => {
    const messages = {
      en: { A: { B: { C: 'from %BRAND%' } }, LIST: ['a %BRAND%', 'b'] },
    };
    const out = applyBrand(messages, 'Acme').en;

    expect(out.A.B.C).toBe('from Acme');
    expect(out.LIST).toEqual(['a Acme', 'b']);
  });

  it('leaves non-string values untouched', () => {
    const messages = { en: { N: 42, B: true, NIL: null } };

    expect(applyBrand(messages, 'Acme').en).toEqual({
      N: 42,
      B: true,
      NIL: null,
    });
  });

  // A blank installation name must not produce "Please update your  instance".
  it('falls back to the upstream name when none is configured', () => {
    const messages = { en: { KEY: 'Update %BRAND% now' } };

    expect(applyBrand(messages, undefined).en.KEY).toBe('Update Chatwoot now');
    expect(applyBrand(messages, '').en.KEY).toBe('Update Chatwoot now');
    expect(applyBrand(messages, '   ').en.KEY).toBe('Update Chatwoot now');
  });

  it('does not mutate the messages it was given', () => {
    const messages = { en: { KEY: 'Welcome to %BRAND%' } };
    applyBrand(messages, 'Acme');

    expect(messages.en.KEY).toBe('Welcome to %BRAND%');
  });
});
