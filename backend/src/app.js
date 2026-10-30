import  express from "express"
import cors from "cors"
import stationRoutes from "./routes/stationRoute.js";
import incidentsRoutes from "./routes/incidentRoutes.js"
const app=express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://ev-charging-station-frontend.vercel.app/"
  ],
}));

app.use(express.json())

app.use("/api/stations",stationRoutes);
app.use("/api/incidents",incidentsRoutes);

export default app;
