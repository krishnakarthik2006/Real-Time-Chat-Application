const mysql = require("mysql2/promise");
const env = require("./env");

let pool;

const schemaStatements = [
  `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(80) NOT NULL,
      email VARCHAR(120) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      avatar_seed VARCHAR(80) NOT NULL,
      last_seen DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
    CREATE TABLE IF NOT EXISTS conversations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NULL,
      type ENUM('direct', 'group') NOT NULL,
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_conversations_created_by
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
    CREATE TABLE IF NOT EXISTS conversation_participants (
      conversation_id INT NOT NULL,
      user_id INT NOT NULL,
      role ENUM('member', 'admin') NOT NULL DEFAULT 'member',
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_read_message_id BIGINT NULL,
      PRIMARY KEY (conversation_id, user_id),
      INDEX idx_conversation_participants_user_id (user_id),
      CONSTRAINT fk_conversation_participants_conversation
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      CONSTRAINT fk_conversation_participants_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
    CREATE TABLE IF NOT EXISTS messages (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      conversation_id INT NOT NULL,
      sender_id INT NOT NULL,
      content TEXT NULL,
      message_type ENUM('text', 'file') NOT NULL DEFAULT 'text',
      file_name VARCHAR(255) NULL,
      file_url VARCHAR(500) NULL,
      file_size INT NULL,
      mime_type VARCHAR(120) NULL,
      status ENUM('sent', 'delivered', 'seen') NOT NULL DEFAULT 'sent',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_messages_conversation_id (conversation_id, id),
      INDEX idx_messages_sender_id (sender_id),
      CONSTRAINT fk_messages_conversation
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      CONSTRAINT fk_messages_sender
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
    CREATE TABLE IF NOT EXISTS message_reactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      message_id BIGINT NOT NULL,
      user_id INT NOT NULL,
      emoji VARCHAR(10) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_reaction (message_id, user_id, emoji),
      INDEX idx_reactions_message_id (message_id),
      INDEX idx_reactions_user_id (user_id),
      CONSTRAINT fk_reactions_message
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
      CONSTRAINT fk_reactions_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
];

async function columnExists(tableName, columnName) {
  const [rows] = await pool.execute(
    `
      SELECT 1
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
      LIMIT 1
    `,
    [env.DB_NAME, tableName, columnName],
  );

  return Boolean(rows[0]);
}

async function indexExists(tableName, indexName) {
  const [rows] = await pool.execute(
    `
      SELECT 1
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
        AND INDEX_NAME = ?
      LIMIT 1
    `,
    [env.DB_NAME, tableName, indexName],
  );

  return Boolean(rows[0]);
}

async function addColumnIfMissing(tableName, columnName, definition) {
  if (await columnExists(tableName, columnName)) {
    return;
  }

  await pool.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`);
}

async function addIndexIfMissing(tableName, indexName, definition) {
  if (await indexExists(tableName, indexName)) {
    return;
  }

  await pool.query(`ALTER TABLE \`${tableName}\` ADD INDEX \`${indexName}\` ${definition}`);
}

async function runMigrations() {
  await addColumnIfMissing("messages", "reply_to_message_id", "BIGINT NULL AFTER `mime_type`");
  await addColumnIfMissing("messages", "is_deleted", "TINYINT(1) NOT NULL DEFAULT 0 AFTER `status`");
  await addColumnIfMissing("messages", "deleted_at", "DATETIME NULL AFTER `is_deleted`");
  await addColumnIfMissing("messages", "edited_at", "DATETIME NULL AFTER `deleted_at`");
  await addIndexIfMissing("messages", "idx_messages_reply_to_message_id", "(`reply_to_message_id`)");
}

async function createDatabaseIfNeeded() {
  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    multipleStatements: true,
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
  } finally {
    await connection.end();
  }
}

async function createSchema() {
  for (const statement of schemaStatements) {
    await pool.query(statement);
  }
}

async function initDatabase() {
  await createDatabaseIfNeeded();

  pool = mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
  });

  await createSchema();
  await runMigrations();

  return pool;
}

function getPool() {
  if (!pool) {
    throw new Error("Database pool has not been initialized.");
  }

  return pool;
}

async function query(sql, params = []) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

async function withTransaction(callback) {
  const connection = await getPool().getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  initDatabase,
  getPool,
  query,
  withTransaction,
};
