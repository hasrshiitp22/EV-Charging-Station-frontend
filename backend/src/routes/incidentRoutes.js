
import express from "express";
import { stations, incidents, STATUSES } from "../data/store.js";

const router = express.Router();

// GET /api/incidents
router.get("/", (req, res) => {
  res.json([...incidents].reverse());
});

// GET /api/incidents/status
router.get("/status", (req, res) => {
  const counts = Object.fromEntries(
    STATUSES.map((status) => [status, 0])
  );

  // Count current station statuses
  for (const station of stations) {
    if (counts[station.status] !== undefined) {
      counts[station.status]++;
    } else {
      console.warn(`Unknown station status: ${station.status}`);
    }
  }

  // Count incident results
  const recoveredCount = incidents.filter(
    (incident) => incident.result === "RECOVERED"
  ).length;

  const failedCount = incidents.filter(
    (incident) => incident.result === "NEEDS_TECHNICIAN"
  ).length;

  const pendingCount = incidents.filter(
    (incident) => incident.result === "PENDING"
  ).length;

  // Calculate completed incidents
  const completedIncidents = recoveredCount + failedCount;

  // Calculate recovery success rate
  const recoverySuccessRate =
    completedIncidents === 0
      ? 0
      : Number(
          ((recoveredCount / completedIncidents) * 100).toFixed(1)
        );

  // Calculate average recovery time
  const recoveredIncidents = incidents.filter(
    (incident) =>
      incident.result === "RECOVERED" &&
      incident.recoverySeconds !== null &&
      incident.recoverySeconds !== undefined
  );

  const totalRecoveryTime = recoveredIncidents.reduce(
    (total, incident) =>
      total + Number(incident.recoverySeconds),
    0
  );

  const averageRecoverySeconds =
    recoveredIncidents.length > 0
      ? totalRecoveryTime / recoveredIncidents.length
      : null;

  res.json({
    totalStations: stations.length,
    statusCounts: counts,
    totalIncidents: incidents.length,
    recoveredIncidents: recoveredCount,
    failedIncidents: failedCount,
    pendingIncidents: pendingCount,
    recoverySuccessRate,
    averageRecoverySeconds
  });
});

export default router;
