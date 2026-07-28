import { hasAnUpdateAvailable } from '../versionCheckHelper';

describe('#hasAnUpdateAvailable', () => {
  it('return false if latest version is invalid', () => {
    expect(hasAnUpdateAvailable('invalid', '1.0.0')).toBe(false);
    expect(hasAnUpdateAvailable(null, '1.0.0')).toBe(false);
    expect(hasAnUpdateAvailable(undefined, '1.0.0')).toBe(false);
    expect(hasAnUpdateAvailable('', '1.0.0')).toBe(false);
  });

  it('return correct value if latest version is valid', () => {
    expect(hasAnUpdateAvailable('1.1.0', '1.0.0')).toBe(true);
    expect(hasAnUpdateAvailable('0.1.0', '1.0.0')).toBe(false);
  });

  describe('fork versions carrying the -indica-facil.NN suffix', () => {
    it('compares the upstream base first', () => {
      expect(
        hasAnUpdateAvailable('4.16.2-indica-facil.06', '4.16.1-indica-facil.05')
      ).toBe(true);
      expect(
        hasAnUpdateAvailable('4.16.1-indica-facil.05', '4.16.2-indica-facil.06')
      ).toBe(false);
    });

    it('compares the suffix numerically when the base matches', () => {
      expect(
        hasAnUpdateAvailable('4.16.2-indica-facil.07', '4.16.2-indica-facil.06')
      ).toBe(true);
      expect(
        hasAnUpdateAvailable('4.16.2-indica-facil.06', '4.16.2-indica-facil.07')
      ).toBe(false);
      expect(
        hasAnUpdateAvailable('4.16.2-indica-facil.06', '4.16.2-indica-facil.06')
      ).toBe(false);
    });

    it('reads the suffix as a number, not a string', () => {
      // '10' sorts before '9' lexicographically, which is why this is pinned.
      expect(
        hasAnUpdateAvailable('4.16.2-indica-facil.10', '4.16.2-indica-facil.9')
      ).toBe(true);
    });

    it('treats a leading zero as the same number', () => {
      expect(
        hasAnUpdateAvailable('4.16.2-indica-facil.7', '4.16.2-indica-facil.06')
      ).toBe(true);
      expect(
        hasAnUpdateAvailable('4.16.2-indica-facil.07', '4.16.2-indica-facil.7')
      ).toBe(false);
    });

    it('treats a plain upstream version as suffix zero', () => {
      expect(hasAnUpdateAvailable('4.16.2-indica-facil.01', '4.16.2')).toBe(
        true
      );
      expect(hasAnUpdateAvailable('4.16.2', '4.16.2-indica-facil.01')).toBe(
        false
      );
    });

    it('tolerates a leading v', () => {
      expect(
        hasAnUpdateAvailable(
          'v4.16.2-indica-facil.07',
          'v4.16.2-indica-facil.06'
        )
      ).toBe(true);
    });

    // Regression: semver.lt throws on an unparseable version. Before the fix, a
    // valid latest version checked against an install on .05 raised
    // "Invalid Version: 4.16.1-indica-facil.05" inside a computed property.
    it('never throws on an unparseable installed version', () => {
      expect(() =>
        hasAnUpdateAvailable('4.16.2-indica-facil.7', 'not-a-version')
      ).not.toThrow();
      expect(
        hasAnUpdateAvailable('4.16.2-indica-facil.7', 'not-a-version')
      ).toBe(false);
      expect(() => hasAnUpdateAvailable('4.16.2', undefined)).not.toThrow();
      expect(hasAnUpdateAvailable('4.16.2', undefined)).toBe(false);
    });
  });
});
