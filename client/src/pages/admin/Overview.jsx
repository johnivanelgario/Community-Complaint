import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errorText } from "../../api";
import { useAuth } from "../../context/AuthContext";
import Icon from "../../components/Icon";
import PriorityBadge from "../../components/PriorityBadge";
import { fullName, timeAgo, formatDate } from "../../utils/format";

export default function Overview() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/stats/admin").then(({ data }) => setStats(data)).catch((e) => setError(errorText(e)));
  }, []);

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });

  const s = stats?.byStatus || {};
  const cards = [
    { label: "Total complaints", value: stats?.totalComplaints },
    { label: "Urgent and still open", value: stats?.urgent, tone: "urgent" },
    { label: "Waiting for action", value: s.pending || 0, tone: "pending" },
    { label: "In progress", value: s["in progress"] || 0, tone: "in-progress" },
    { label: "Resolved", value: s.resolved || 0, tone: "resolved" },
    { label: "Open but unassigned", value: stats?.unassigned }
  ];

  return (
    <>
      <section className="welcome">
        <div>
          <p className="welcome-date">{today}</p>
          <h1>Welcome back, {user.lastName}, {user.firstName}</h1>
          <p>
            {stats
              ? `${s.pending || 0} complaint${s.pending === 1 ? "" : "s"} still need a first response.`
              : "Loading today's numbers..."}
          </p>
        </div>
        <div className="welcome-actions">
          <Link to="/admin/complaints" className="btn btn-light">
            Review complaints
          </Link>
          <Link to="/admin/announcements" className="btn btn-outline-light">
            Post announcement
          </Link>
        </div>
      </section>

      {error && <div className="alert">{error}</div>}

      <section className="stats">
        {cards.map((c) => (
          <div key={c.label} className={`stat ${c.tone ? `stat-${c.tone}` : ""}`}>
            <span>{c.label}</span>
            <strong>{c.value ?? "–"}</strong>
          </div>
        ))}
      </section>

      <div className="two-col">
        <section className="panel">
          <div className="panel-head">
            <h2>Recent activity</h2>
            <Link to="/admin/logs">See all logs</Link>
          </div>
          {stats?.recentLogs?.length ? (
            <ul className="activity">
              {stats.recentLogs.map((log) => (
                <li key={log._id}>
                  <span className={`dot dot-${log.type}`} />
                  <div>
                    <p>{log.action}</p>
                    <small>{timeAgo(log.createdAt)}</small>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Nothing has happened yet.</p>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>
              <Icon name="bell" size={16} /> Needs a first response
            </h2>
            <Link to="/admin/complaints">Open queue</Link>
          </div>
          {stats?.pending?.length ? (
            <ul className="queue">
              {stats.pending.map((c) => (
                <li key={c._id}>
                  <Link to={`/admin/complaints/${c._id}`}>
                    <strong>
                      {c.title} {c.priority === "urgent" && <PriorityBadge priority="urgent" />}
                    </strong>
                    <span>
                      {fullName(c.submittedBy)}, {c.category}, {formatDate(c.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Every complaint has a response. Nice work.</p>
          )}
        </section>
      </div>
    </>
  );
}
