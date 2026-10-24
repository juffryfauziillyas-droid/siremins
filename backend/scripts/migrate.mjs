import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import "dotenv/config";

const migrationsDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../migrations"
);
const migrationFiles = (await readdir(migrationsDirectory))
    .filter((file) => /^\d{4}-\d{2}-\d{2}-.+\.sql$/.test(file))
    .sort();
const mode = process.argv[2] || "up";

const requiredColumns = {
    "2026-10-24-add-booking-dp-amount.sql": {
        bookings: ["dp_amount"],
    },
    "2026-10-24-add-booking-user-id.sql": {
        bookings: ["user_id"],
    },
    "2026-10-24-create-midtrans-payment-transactions.sql": {
        midtrans_payment_transactions: [
            "order_id",
            "booking_id",
            "payment_type",
            "gross_amount",
            "transaction_status",
            "fraud_status",
            "midtrans_transaction_id",
        ],
    },
    "2026-10-24-create-password-reset-otps.sql": {
        password_reset_otps: [
            "phone_number",
            "otp_hash",
            "expires_at",
            "attempts",
            "last_sent_at",
        ],
    },
};

let connection;

const tableExists = async (tableName) => {
    const [rows] = await connection.query(
        `SELECT COUNT(*) AS count
         FROM information_schema.tables
         WHERE table_schema = DATABASE() AND table_name = ?`,
        [tableName]
    );
    return Number(rows[0].count) > 0;
};

const columnExists = async (tableName, columnName) => {
    const [rows] = await connection.query(
        `SELECT COUNT(*) AS count
         FROM information_schema.columns
         WHERE table_schema = DATABASE()
           AND table_name = ?
           AND column_name = ?`,
        [tableName, columnName]
    );
    return Number(rows[0].count) > 0;
};

const indexExists = async (tableName, indexName, requireUnique = false) => {
    const [rows] = await connection.query(
        `SELECT COUNT(*) AS count
         FROM information_schema.statistics
         WHERE table_schema = DATABASE()
           AND table_name = ?
           AND index_name = ?
           ${requireUnique ? "AND non_unique = 0" : ""}`,
        [tableName, indexName]
    );
    return Number(rows[0].count) > 0;
};

const migrationSchemaExists = async (filename) => {
    const tablesAndColumns = requiredColumns[filename];
    if (!tablesAndColumns) {
        throw new Error(`Belum ada pemeriksaan skema untuk migrasi ${filename}.`);
    }

    for (const [tableName, columns] of Object.entries(tablesAndColumns)) {
        if (!await tableExists(tableName)) return false;
        for (const columnName of columns) {
            if (!await columnExists(tableName, columnName)) return false;
        }
    }

    if (
        filename === "2026-10-24-add-booking-user-id.sql"
        && !await indexExists("bookings", "idx_bookings_user_id")
    ) {
        return false;
    }
    if (
        filename === "2026-10-24-create-midtrans-payment-transactions.sql"
        && !await indexExists("midtrans_payment_transactions", "order_id", true)
    ) {
        return false;
    }
    return true;
};

const shouldSkipStatement = async (statement) => {
    const addColumn = statement.match(
        /^ALTER\s+TABLE\s+`?([a-z\d_]+)`?\s+ADD\s+COLUMN\s+`?([a-z\d_]+)`?/i
    );
    if (addColumn) return columnExists(addColumn[1], addColumn[2]);

    const createIndex = statement.match(
        /^CREATE\s+(?:UNIQUE\s+)?INDEX\s+`?([a-z\d_]+)`?\s+ON\s+`?([a-z\d_]+)`?/i
    );
    if (createIndex) return indexExists(createIndex[2], createIndex[1]);

    const createTable = statement.match(
        /^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([a-z\d_]+)`?/i
    );
    if (createTable) return tableExists(createTable[1]);
    return false;
};

const splitStatements = (sql) => sql
    .split(/\r?\n/)
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n")
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

try {
    if (!["up", "status"].includes(mode)) {
        throw new Error("Gunakan perintah: npm run migrate atau npm run migrate:status.");
    }

    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
        throw new Error("DB_HOST, DB_USER, dan DB_NAME wajib dikonfigurasi di backend/.env.");
    }

    connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    if (mode === "up") {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                filename VARCHAR(255) NOT NULL PRIMARY KEY,
                checksum CHAR(64) NOT NULL,
                applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    const hasMigrationTable = await tableExists("schema_migrations");
    let statusNeedsAction = false;
    for (const filename of migrationFiles) {
        const sql = await readFile(path.join(migrationsDirectory, filename), "utf8");
        const checksum = createHash("sha256").update(sql).digest("hex");
        const [records] = hasMigrationTable
            ? await connection.query(
                "SELECT checksum FROM schema_migrations WHERE filename = ?",
                [filename]
            )
            : [[]];
        const isApplied = await migrationSchemaExists(filename);

        if (records.length > 0) {
            if (records[0].checksum !== checksum) {
                throw new Error(`Checksum migrasi ${filename} berubah setelah dicatat.`);
            }
            if (!isApplied) {
                throw new Error(`Migrasi ${filename} tercatat tetapi skema database tidak lengkap.`);
            }
            console.log(`APPLIED  ${filename}`);
            continue;
        }

        if (mode === "status") {
            console.log(`${isApplied ? "UNRECORDED" : "PENDING "} ${filename}`);
            if (!records.length || !isApplied) statusNeedsAction = true;
            continue;
        }

        for (const statement of splitStatements(sql)) {
            if (!await shouldSkipStatement(statement)) {
                await connection.query(statement);
            }
        }

        if (!await migrationSchemaExists(filename)) {
            throw new Error(`Migrasi ${filename} selesai dijalankan tetapi skemanya belum lengkap.`);
        }

        await connection.query(
            "INSERT INTO schema_migrations (filename, checksum) VALUES (?, ?)",
            [filename, checksum]
        );
        console.log(`${isApplied ? "RECORDED" : "APPLIED "} ${filename}`);
    }
    if (statusNeedsAction) process.exitCode = 1;
} catch (error) {
    console.error("Migrasi database gagal:", error.message);
    process.exitCode = 1;
} finally {
    if (connection) await connection.end();
}
