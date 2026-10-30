import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  CheckCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import "./App.css";

const API_URL ="https://ev-charging-station-frontend-e7xo.vercel.app/api";

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString();
}

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return "—";
  return `${Number(seconds).toFixed(2)} s`;
}

function App() {
  const [stations, setStations] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      const [stationResponse, incidentResponse, statsResponse] =
        await Promise.all([
          fetch(`${API_URL}/stations`),
          fetch(`${API_URL}/incidents`),
          fetch(`${API_URL}/incidents/status`),
        ]);

      if (!stationResponse.ok || !incidentResponse.ok || !statsResponse.ok) {
        throw new Error("One or more backend APIs returned an error.");
      }

      const [stationData, incidentData, statsData] = await Promise.all([
        stationResponse.json(),
        incidentResponse.json(),
        statsResponse.json(),
      ]);

      setStations(
        Array.isArray(stationData) ? stationData : stationData.stations || []
      );
      setIncidents(
        Array.isArray(incidentData)
          ? incidentData
          : incidentData.incidents || []
      );
      setStats(statsData);
      setError("");
    } catch (err) {
      setError(
        "Cannot load dashboard data. Check that your backend is running on port 5000 and that CORS is enabled."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();

    const timer = setInterval(loadDashboard, 5000);

    return () => clearInterval(timer);
  }, []);

const statusCounts = stats?.statusCounts || {};

const recoveredCount = incidents.filter(
  (item) => item.result === "RECOVERED"
).length;

const failedCount = incidents.filter(
  (item) => item.result === "NEEDS_TECHNICIAN"
).length;

const completedIncidents = recoveredCount + failedCount;

const successRate =
  completedIncidents === 0
    ? null
    : (recoveredCount / completedIncidents) * 100;

const chargingCount = statusCounts.CHARGING ?? 0;
const maintenanceCount = statusCounts.MAINTENANCE ?? 0;

const pendingCount = incidents.filter(
  (item) => item.result === "PENDING"
).length;

  const cards = [
    {
      label: "Total Stations",
      value: stats?.totalStations ?? stations.length,
      icon: BatteryCharging,
      color: "blue",
    },
    {
      label: "Available",
      value: statusCounts.AVAILABLE ?? 0,
      icon: CheckCircle,
      color: "green",
    },
    {
      label: "Faulty Stations",
      value: statusCounts.FAULT ?? 0,
      icon: AlertTriangle,
      color: "red",
    },
    {
      label: "Recovered Incidents",
      value: recoveredCount,
      icon: Activity,
      color: "purple",
    },
  ];

  return (
    <main className="dashboard">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <BatteryCharging size={25} />
          </div>
          <div>
            <h1>EV Reliability Monitor</h1>
            <p>Charging station monitoring & auto-recovery</p>
          </div>
        </div>

        <button className="refresh-button" onClick={loadDashboard}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p className="message">Loading dashboard...</p>
      ) : (
        <>
          <section className="welcome">
            <div>
              <p className="eyebrow">SYSTEM OVERVIEW</p>
              <h2>Charging Network Dashboard</h2>
              <p>Monitor station health and automatic recovery incidents.</p>
            </div>
            <div className="live-indicator">
              <span />
              Auto-refresh: 5 seconds
            </div>
          </section>

          <section className="stats-grid">
            {cards.map(({ label, value, icon: Icon, color }) => (
              <article className="stat-card" key={label}>
                <div className={`stat-icon ${color}`}>
                  <Icon size={22} />
                </div>
                <p>{label}</p>
                <h3>{value}</h3>
              </article>
            ))}
          </section>

          <section className="panel">
            <div className="section-heading">
              <div>
                <h2>Charging Stations</h2>
                <p>Current status of each station</p>
              </div>
              <span className="count-label">{stations.length} stations</span>
            </div>

            {stations.length === 0 ? (
              <p className="message">No station data returned by the API.</p>
            ) : (
              <div className="station-grid">
                {stations.map((station) => (
                  <article className="station-card" key={station.id}>
                    <div className="station-card-top">
                      <BatteryCharging size={23} />
                      <span
                        className={`status-badge ${String(
                          station.status || "UNKNOWN"
                        ).toLowerCase()}`}
                      >
                        {station.status || "UNKNOWN"}
                      </span>
                    </div>
                    <h3>{station.id}</h3>
                    <p>Charging station</p>
                    {station.resetAttempts !== undefined && (
                      <small>Reset attempts: {station.resetAttempts}</small>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
          
<section className="panel">
  <div className="section-heading">
    <div>
      <h2>Reliability Overview</h2>
      <p>Station health and recovery performance</p>
    </div>
  </div>

  <div className="reliability-grid">
    <div className="metric-tile">
      <span>Charging</span>
      <strong>{chargingCount}</strong>
    </div>

    <div className="metric-tile">
      <span>Maintenance</span>
      <strong>{maintenanceCount}</strong>
    </div>

    <div className="metric-tile">
      <span>Pending Incidents</span>
      <strong>{pendingCount}</strong>
    </div>

    <div className="metric-tile">
      <span>Recovery Success Rate</span>
      <strong>
        {successRate === null ? "—" : `${successRate.toFixed(1)}%`}
      </strong>
    </div>
  </div>
</section>


          <section className="panel">
            <div className="section-heading">
              <div>
                <h2>Incident History</h2>
                <p>Faults and recovery results saved in PostgreSQL</p>
              </div>
              <span className="count-label">
                {incidents.length} incidents
              </span>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Station</th>
                    <th>Fault Time</th>
                    <th>Recovery Time</th>
                    <th>Attempts</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-cell">
                        No incidents recorded yet.
                      </td>
                    </tr>
                  ) : (
                    [...incidents]
                      .sort((a, b) => {
                        const timeA = new Date(a.faultAt).getTime() || 0;
                        const timeB = new Date(b.faultAt).getTime() || 0;
                        return timeB - timeA;
                      })
                      .map((incident, index) => (
                        <tr key={incident.id ?? index}>
                          <td>{incident.stationId}</td>
                          <td>{formatDate(incident.faultAt)}</td>
                          <td>
                            {formatDuration(incident.recoverySeconds)}
                          </td>
                          <td>{incident.resetAttempts ?? 0}</td>
                          <td>
                            <span
                              className={`status-badge ${String(
                                incident.result || "UNKNOWN"
                              ).toLowerCase()}`}
                            >
                              {incident.result || "UNKNOWN"}
                            </span>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </section>


          <section className="panel reliability-panel">
            <div className="reliability-icon">
              <Clock size={28} />
            </div>

            <div className="reliability-content">
              <p className="eyebrow">SYSTEM PERFORMANCE</p>
              <h2>Reliability Metrics</h2>
              <p>Average recovery time across recovered incidents</p>

              <div className="recovery-value">
                <strong>
                  {stats?.averageRecoverySeconds == null
                    ? "—"
                    : Number(stats.averageRecoverySeconds).toFixed(2)}
                </strong>
                <span>seconds</span>
              </div>

              <small>Calculated from successfully recovered incidents</small>
            </div>
          </section>

        </>
      )}

      <footer>EV Charging Reliability Project · Cloud Computing</footer>
    </main>
  );
}

export default App;
