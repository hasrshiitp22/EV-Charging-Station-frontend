import expess from "express"
import { createIncident } from "../services/incidentServices.js";
import { stations,incidents} from "../data/store.js";
const router =expess.Router()

router.get("/",(req,res)=>{
  res.json(stations);
})

router.get("/:id",(req,res)=>{

    let station=null;
  for(let i=0;i<stations.length;i++){
     if(stations[i].id===req.params.id){
       station=stations[i];
     }
  }
  
  if(!station){
    return res.status(404).json({
        message:"stations not found",
    })
  }
  res.json(station);
});
router.post("/:id/fault",(req,res)=>{
  
  const station = stations.find(
    (station) => station.id === req.params.id
  );
  
  if(!station){
    return res.status(404).json({
      message:"station not found",
    })
  }
  if (station.status === "FAULT") {
    return res.status(409).json({
      message: "Station is already faulty",
    });
  }
  
  if(station.status=="OFFLINE" ||station.status=="MAINTENANCE" ){
    return res.status(409).json({
      message: "Station cannot be faulted in its current state",
    });
  }
  station.status="FAULT";
  station.faultAt= Date.now(),
  station.resetAttempts= 0;
  

createIncident(station);
  
  res.json({
    message: "Station fault simulated successfully",
    station,
  });
  
})

router.post("/:id/reset",(req,res)=>{
  const station =stations.find(
    (station)=>station.id===req.params.id
  );
  
  if(!station){
    return res.status(404).json({
      message:"Station is not found",
    })
  }
  if(station.status !="FAULT"){
    return res.status(409).json({
      message: "Only faulty stations can be reset",
    });
  }
  station.status="AVAILABLE";
  station.faultAt=null;
  station.resetAttempts=0;
  const incident=[...incidents].reverse().find(
    (item)=>
      item.stationId==station.id && item.result=="PENDING"
    
  );
if (incident) {
  const recoveredAt = Date.now();

  incident.recoveredAt =
    new Date(recoveredAt).toISOString();

  incident.recoverySeconds =
    (recoveredAt - Date.parse(incident.faultAt)) / 1000;

  incident.result = "RECOVERED";
}
  res.json({
    message: "Station reset successfully",
    station,
  });
  
});

export default router





