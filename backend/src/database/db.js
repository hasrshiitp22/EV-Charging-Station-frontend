
import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

try {
    await db.query(`
        CREATE TABLE IF NOT EXISTS incidents (
            id SERIAL PRIMARY KEY,
            "stationId" TEXT NOT NULL,
            "faultAt" TEXT NOT NULL,
            "recoveredAt" TEXT,
            "recoverySeconds" DOUBLE PRECISION,
            "resetAttempts" INTEGER NOT NULL DEFAULT 0,
            result TEXT NOT NULL DEFAULT 'PENDING'
        );
    `);

    console.log("PostgreSQL connected successfully");
} catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
}

export default db;
