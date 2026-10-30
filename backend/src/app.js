import  express from "express"
import cors from "cors"
import stationRoutes from "./routes/stationRoute.js";
import incidentsRoutes from "./routes/incidentRoutes.js"
const app=express();

const allowedOrigins = [
    "https://ev-charging-station-frontend.vercel.app"
];

app.use(cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json())

app.use("/api/stations",stationRoutes);
app.use("/api/incidents",incidentsRoutes);

export default app;
