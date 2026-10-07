import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { errorText } from "../../api";
import { useAuth } from "../../context/AuthContext";
import StatusBadge from "../../components/StatusBadge";
import Icon from "../../components/Icon";
import { formatDate } from "../../utils/format";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [news, setNews] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/stats/me"), api.get("/complaints"), api.get("/announcements", { params: { limit: 3 } })])
      .then(([s, c, a]) => {
        setStats(s.data);
        setRecent(c.data.slice(0, 5));
        setNews(a.data);
      })
      .catch((e) => setError(errorText(e)));
  }, []);

  const s = stats?.byStatus || {};
  const cards = [
    { label: "Filed", value: stats?.total },
    { label: "Pending", value: s.pending || 0, tone: "pending" },
    { label: "In progress", value: s["in progress"] || 0, tone: "in-progress" },
    { label: "Resolved", value: s.resolved || 0, tone: "resolved" }
  ];

  return (
    <>
      <section className="welcome">
        <div>
          <h1>Welcome back, {user.firstName}</h1>
          <p>Something on campus that needs fixing or attention? Let the admin know.</p>
        </div>
        <Link to="/student/new" className="btn btn-light">
          File a complaint
        </Link>
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

      {news.length > 0 && (
        <section className="stack">
          <h2 className="with-icon">
            <Icon name="megaphone" size={18} /> From the admin
          </h2>
          <div className="announce-list">
            {news.map((a) => (
              <article key={a._id} className={`panel announce ${a.pinned ? "is-pinned" : ""}`}>
                <div className="announce-head">
                  <div>
                    <h2>{a.title}</h2>
                    <small className="muted">
                      {formatDate(a.createdAt)}
                      {a.pinned && <span className="pin-tag">Pinned</span>}
                    </small>
                  </div>
                </div>
                <p className="prose">{a.body}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="panel table-wrap">
        <div className="panel-head">
          <h2>Your latest complaints</h2>
          <Link to="/student/complaints">View all</Link>
        </div>
        {recent.length ? (
          <table className="clickable">
            <thead>
              <tr>
                <th>Complaint</th>
                <th>Category</th>
                <th>Date filed</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((c) => (
                <tr
                  key={c._id}
                  tabIndex={0}
                  onClick={() => navigate(`/student/complaints/${c._id}`)}
                  onKeyDown={(e) => e.key === "Enter" && navigate(`/student/complaints/${c._id}`)}
                >
                  <td><strong>{c.title}</strong></td>
                  <td>{c.category}</td>
                  <td className="nowrap">{formatDate(c.createdAt)}</td>
                  <td><StatusBadge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty">
            <p className="muted">You haven't filed anything yet.</p>
            <Link to="/student/new" className="btn btn-primary">File your first complaint</Link>
          </div>
        )}
      </section>
    </>
  );
}
