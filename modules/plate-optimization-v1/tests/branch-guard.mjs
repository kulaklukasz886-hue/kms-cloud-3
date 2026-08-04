import { execFileSync } from 'node:child_process';

function currentBranch() {
  const fromEnvironment = process.env.KMS_OPTIMIZATION_BRANCH || process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME;
  if (fromEnvironment) return fromEnvironment.trim();

  try {
    return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    throw new Error('Cannot determine current branch. Set KMS_OPTIMIZATION_BRANCH explicitly.');
  }
}

const branch = currentBranch();
const allowed = branch === 'feature/kms-optymalizacja-plyt-v1' ||
  branch.startsWith('integration/kms-optymalizacja-');

if (!allowed) {
  throw new Error([
    `Plate optimization tests are blocked on branch: ${branch}`,
    'Allowed branches:',
    '- feature/kms-optymalizacja-plyt-v1',
    '- integration/kms-optymalizacja-*',
    'Do not run or integrate this module directly on main or recovery.'
  ].join('\n'));
}

console.log(`OK: branch separation guard accepted ${branch}.`);
