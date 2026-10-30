
import express from "express";
import {
  createIncident,
  saveIncident
} from "../services/incidentServices.js";

import { stations, incidents } from "../data/store.js";

const router = express.Router();

// Get all stations
router.get("/", (req, res) => {
  res.json(stations);
});

// Get station by ID
router.get("/:id", (req, res) => {
  const station = stations.find(
    (station) => station.id === req.params.id
  );

  if (!station) {
    return res.status(404).json({
      message: "Station not found"
    });
  }

  res.json(station);
});

// Simulate station fault
router.post("/:id/fault", async (req, res) => {
  try {
    const station = stations.find(
      (station) => station.id === req.params.id
    );

    if (!station) {
      return res.status(404).json({
        message: "Station not found"
      });
    }

    if (station.status === "FAULT") {
      return res.status(409).json({
        message: "Station is already faulty"
      });
    }

    if (
      station.status === "OFFLINE" ||
      station.status === "MAINTENANCE"
    ) {
      return res.status(409).json({
        message: "Station cannot be faulted in its current state"
      });
    }

    station.status = "FAULT";
    station.faultAt = Date.now();
    station.resetAttempts = 0;

    // Save incident in PostgreSQL
    await createIncident(station);

    res.json({
      message: "Station fault simulated successfully",
      station
    });

  } catch (error) {
    console.error("Fault simulation error:", error);

    res.status(500).json({
      message: "Failed to create incident"
    });
  }
});

// Manually reset a faulty station
router.post("/:id/reset", async (req, res) => {
  try {
    const station = stations.find(
      (station) => station.id === req.params.id
    );

    if (!station) {
      return res.status(404).json({
        message: "Station not found"
      });
    }

    if (station.status !== "FAULT") {
      return res.status(409).json({
        message: "Only faulty stations can be reset"
      });
    }

    const incident = [...incidents].reverse().find(
      (item) =>
        item.stationId === station.id &&
        item.result === "PENDING"
    );

    if (!incident) {
      return res.status(404).json({
        message: "No pending incident found"
      });
    }

    // Calculate recovery time BEFORE clearing faultAt
    const recoveredAt = Date.now();

    incident.recoveredAt =
      new Date(recoveredAt).toISOString();

    incident.recoverySeconds =
      (recoveredAt - Date.parse(incident.faultAt)) / 1000;

    incident.result = "RECOVERED";

    // Save updated incident in PostgreSQL
    await saveIncident(incident);

    // Update station status
    station.status = "AVAILABLE";
    station.faultAt = null;
    station.resetAttempts = 0;

    res.json({
      message: "Station reset successfully",
      station,
      incident
    });

  } catch (error) {
    console.error("Station reset error:", error);

    res.status(500).json({
      message: "Failed to reset station"
    });
  }
});

export default router;
