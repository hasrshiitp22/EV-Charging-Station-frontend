
import { incidents } from "../data/store.js";
import db from "../database/db.js";

// Load previously saved incidents when the server starts.
const savedIncidents = await db.query(`
    SELECT * FROM incidents ORDER BY id DESC
`);

incidents.splice(0, incidents.length, ...savedIncidents.rows);

// Create a new incident.
export async function createIncident(station) {
    const faultAt = new Date(station.faultAt).toISOString();

    const result = await db.query(
        `
        INSERT INTO incidents (
            "stationId",
            "faultAt",
            "recoveredAt",
            "recoverySeconds",
            "resetAttempts",
            result
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
        `,
        [
            station.id,
            faultAt,
            null,
            null,
            0,
            "PENDING"
        ]
    );

    const incident = {
        id: Number(result.rows[0].id),
        stationId: station.id,
        faultAt,
        recoveredAt: null,
        recoverySeconds: null,
        resetAttempts: 0,
        result: "PENDING"
    };

    incidents.unshift(incident);

    return incident;
}

// Find a pending incident for a station.
export function findPendingIncident(stationId) {
    return incidents.find(
        (incident) =>
            incident.stationId === stationId &&
            incident.result === "PENDING"
    );
}

// Update an existing incident.
export async function saveIncident(incident) {
    await db.query(
        `
        UPDATE incidents
        SET "recoveredAt" = $1,
            "recoverySeconds" = $2,
            "resetAttempts" = $3,
            result = $4
        WHERE id = $5
        `,
        [
            incident.recoveredAt,
            incident.recoverySeconds,
            incident.resetAttempts,
            incident.result,
            incident.id
        ]
    );
}
