/**
 * REFERENCE ONLY — not imported by the app build.
 *
 * Canonical source for production `lifeProfileOperations` injected into
 * `lib/database.ts` on the server.
 */

// @patch-inject-start
let lifeProfileTableReady = false;
function ensureLifeProfileTable() {
  if (lifeProfileTableReady) return;
  db.exec(`
    CREATE TABLE IF NOT EXISTS life_profiles (
      user_id TEXT NOT NULL,
      birth_signature TEXT NOT NULL,
      profile_json TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, birth_signature),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_life_profiles_user_id ON life_profiles(user_id);
  `);
  lifeProfileTableReady = true;
}

function mapLifeProfileRow(row) {
  try {
    const profile = JSON.parse(row.profile_json || '{}');
    if (!profile || typeof profile !== 'object') return null;
    return {
      birthSignature: row.birth_signature,
      profile: {
        ...profile,
        birthSignature: row.birth_signature,
      },
    };
  } catch {
    return null;
  }
}

export const lifeProfileOperations = {
  listByUserId(userId) {
    ensureLifeProfileTable();
    const rows = db.prepare(`
      SELECT birth_signature, profile_json
      FROM life_profiles
      WHERE user_id = ?
      ORDER BY updated_at DESC
    `).all(userId);
    return rows.map(mapLifeProfileRow).filter(Boolean);
  },

  upsertMany(userId, profiles) {
    ensureLifeProfileTable();
    const stmt = db.prepare(`
      INSERT INTO life_profiles (user_id, birth_signature, profile_json, updated_at)
      VALUES (@user_id, @birth_signature, @profile_json, datetime('now'))
      ON CONFLICT(user_id, birth_signature) DO UPDATE SET
        profile_json = excluded.profile_json,
        updated_at = datetime('now')
      WHERE life_profiles.user_id = @user_id
    `);

    const tx = db.transaction((items) => {
      for (const item of items) {
        if (!item?.birthSignature) continue;
        stmt.run({
          user_id: userId,
          birth_signature: item.birthSignature,
          profile_json: JSON.stringify(item),
        });
      }
    });
    tx(profiles);
  },
};
// @patch-inject-end