import { d1Rows } from './ops-common.mjs';

const checks = [
  ['accounts without matching owner portfolio', `SELECT COUNT(*) AS count FROM trading_accounts a LEFT JOIN portfolios p ON p.id=a.portfolio_id AND p.owner_id=a.owner_id WHERE p.id IS NULL`],
  ['trades without matching owner account', `SELECT COUNT(*) AS count FROM trades t LEFT JOIN trading_accounts a ON a.id=t.account_id AND a.owner_id=t.owner_id WHERE a.id IS NULL`],
  ['connections without matching owner account', `SELECT COUNT(*) AS count FROM broker_connections c LEFT JOIN trading_accounts a ON a.id=c.account_id AND a.owner_id=c.owner_id WHERE a.id IS NULL`],
  ['MT5 credentials without matching owner connection', `SELECT COUNT(*) AS count FROM mt5_credentials m LEFT JOIN broker_connections c ON c.id=m.connection_id AND c.owner_id=m.owner_id WHERE c.id IS NULL`],
  ['users without profiles', `SELECT COUNT(*) AS count FROM users u LEFT JOIN profiles p ON p.owner_id=u.id WHERE p.owner_id IS NULL`],
  ['users without subscriptions', `SELECT COUNT(*) AS count FROM users u LEFT JOIN subscriptions s ON s.owner_id=u.id WHERE s.owner_id IS NULL`],
  ['invalid JSON payloads', `SELECT (SELECT COUNT(*) FROM profiles WHERE NOT json_valid(payload))+(SELECT COUNT(*) FROM portfolios WHERE NOT json_valid(payload))+(SELECT COUNT(*) FROM trading_accounts WHERE NOT json_valid(payload))+(SELECT COUNT(*) FROM trades WHERE NOT json_valid(payload))+(SELECT COUNT(*) FROM goals WHERE NOT json_valid(payload))+(SELECT COUNT(*) FROM rules WHERE NOT json_valid(payload))+(SELECT COUNT(*) FROM playbooks WHERE NOT json_valid(payload))+(SELECT COUNT(*) FROM daily_checkins WHERE NOT json_valid(payload))+(SELECT COUNT(*) FROM broker_connections WHERE NOT json_valid(payload))+(SELECT COUNT(*) FROM subscriptions WHERE NOT json_valid(payload)) AS count`],
];

let failed = false;
console.log('Tradovia production data audit');
for (const [label, sql] of checks) {
  const count = Number(d1Rows(sql)[0]?.count ?? -1);
  const ok = count === 0;
  failed ||= !ok;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: ${count}`);
}

const totals = d1Rows(`SELECT (SELECT COUNT(*) FROM users) AS users,(SELECT COUNT(*) FROM trades) AS trades,(SELECT COUNT(*) FROM trade_images) AS images,(SELECT COUNT(*) FROM auth_sessions WHERE expires_at<=unixepoch('subsec')*1000) AS expired_sessions`)[0];
console.log(`INFO  users=${totals.users} trades=${totals.trades} image_records=${totals.images} expired_sessions=${totals.expired_sessions}`);
if (failed) process.exitCode = 1;
