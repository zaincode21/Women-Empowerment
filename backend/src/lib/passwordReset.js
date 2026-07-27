const crypto = require('crypto');
const db = require('../db');

async function ensurePasswordResetTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      account_type VARCHAR(20) NOT NULL,
      account_id INT NOT NULL,
      email VARCHAR(255) NOT NULL,
      token_hash VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createRawToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function createPasswordReset({ accountType, accountId, email }) {
  await ensurePasswordResetTable();
  const rawToken = createRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.query(
    `UPDATE password_reset_tokens SET used_at = NOW()
     WHERE account_type=$1 AND account_id=$2 AND used_at IS NULL`,
    [accountType, accountId]
  );

  await db.query(
    `INSERT INTO password_reset_tokens (account_type, account_id, email, token_hash, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [accountType, accountId, email, tokenHash, expiresAt]
  );

  return { rawToken, expiresAt };
}

async function consumePasswordResetToken(rawToken) {
  await ensurePasswordResetTable();
  const tokenHash = hashToken(rawToken);
  const result = await db.query(
    `SELECT * FROM password_reset_tokens
     WHERE token_hash=$1 AND used_at IS NULL AND expires_at > NOW()
     ORDER BY id DESC LIMIT 1`,
    [tokenHash]
  );
  const row = result.rows[0];
  if (!row) return null;
  await db.query('UPDATE password_reset_tokens SET used_at=NOW() WHERE id=$1', [row.id]);
  return row;
}

module.exports = {
  ensurePasswordResetTable,
  createPasswordReset,
  consumePasswordResetToken,
};
