import semver from 'semver';

// Fork versions look like `4.16.2-indica-facil.07`. That NN suffix increments
// globally and is written with a leading zero — which makes the whole string
// invalid semver, because the spec forbids leading zeroes in a numeric
// prerelease identifier. `semver.valid()` returned null for every release this
// fork has ever cut (.01 through .06), so this function always answered false
// and the update notice never appeared, silently.
//
// Dropping the zero would not be enough either: `semver.lt` throws on an
// unparseable version, so a fixed instance checking against an older install
// (`4.16.1-indica-facil.05`) would raise inside a computed property instead of
// simply returning false. Hence: compare the upstream base with semver, the
// suffix as a plain number, and never let an unparseable input throw.
const FORK_VERSION = /^v?(\d+\.\d+\.\d+)(?:-indica-facil\.(\d+))?$/;

const parseForkVersion = version => {
  const match = FORK_VERSION.exec(String(version ?? '').trim());
  if (!match) return null;

  return { base: match[1], suffix: Number(match[2] ?? 0) };
};

export const hasAnUpdateAvailable = (latestVersion, currentVersion) => {
  const latest = parseForkVersion(latestVersion);
  const current = parseForkVersion(currentVersion);

  // Not fork-shaped (an upstream release candidate, say): fall back to plain
  // semver, validating both sides so neither can throw.
  if (!latest || !current) {
    if (!semver.valid(latestVersion) || !semver.valid(currentVersion)) {
      return false;
    }

    return semver.lt(currentVersion, latestVersion);
  }

  if (latest.base !== current.base) {
    return semver.gt(latest.base, current.base);
  }

  return latest.suffix > current.suffix;
};
