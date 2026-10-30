
import { stations } from "../data/store.js";
import { createIncident } from "./incidentServices.js";

let isRunning = false;

async function simulateStations() {

    if (isRunning) return;

    isRunning = true;

    try {
        for (const station of stations) {

            if (
                station.status !== "AVAILABLE" &&
                station.status !== "CHARGING"
            ) {
                continue;
            }

            const random = Math.random();

            if (random < 0.04) {

                station.status = "FAULT";
                station.faultAt = Date.now();
                station.resetAttempts = 0;

                // Save the new incident in PostgreSQL.
                await createIncident(station);

                console.log(`${station.id} developed a fault`);

            } else if (
                station.status === "AVAILABLE" &&
                random < 0.04
            ) {

                station.status = "CHARGING";

                console.log(`${station.id} is now CHARGING`);

            } else if (
                station.status === "CHARGING" &&
                random < 0.03
            ) {

                station.status = "AVAILABLE";

                console.log(`${station.id} is now AVAILABLE`);
            }
        }

    } catch (error) {
        console.error("Station simulator error:", error);

    } finally {
        isRunning = false;
    }
}

export function startStationSimulator() {

    console.log("Station simulator started");

    setInterval(simulateStations, 5000);
}
