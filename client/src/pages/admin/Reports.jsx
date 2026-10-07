import { useEffect, useState } from "react";
import api, { errorText } from "../../api";
import PageHead from "../../components/PageHead";
import Icon from "../../components/Icon";
import { CATEGORIES, STATUSES, OFFICES } from "../../utils/format";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function Bars({ rows, tone }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="bars">
      {rows.map((r) => (
        <li key={r.label}>
          <span className="bars-label">{r.label}</span>
          <span className="bars-track">
            <span
              className={`bars-fill ${tone ? tone(r.label) : ""}`}
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </span>
          <strong>{r.value}</strong>
        </li>
      ))}
    </ul>
  );
}

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/stats/admin").then(({ data }) => setStats(data)).catch((e) => setError(errorText(e)));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!stats) return <p className="muted">Crunching the numbers...</p>;

  const total = stats.totalComplaints;
  const resolved = stats.byStatus.resolved || 0;
  const rate = total ? Math.round((resolved / total) * 100) : 0;

  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i), 1);
    const hit = stats.monthly.find((m) => m._id.y === d.getFullYear() && m._id.m === d.getMonth() + 1);
    return { label: `${months[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, value: hit?.count || 0 };
  });

  const topCategory = CATEGORIES.reduce(
    (best, c) => ((stats.byCategory[c] || 0) > (stats.byCategory[best] || 0) ? c : best),
    CATEGORIES[0]
  );

  return (
    <>
      <PageHead title="Reports & analytics" sub="How the community's complaints are moving.">
        <button className="btn btn-ghost" onClick={() => window.print()}>
          <Icon name="print" size={16} /> Print report
        </button>
      </PageHead>

      <section className="stats">
        <div className="stat">
          <span>Complaints on record</span>
          <strong>{total}</strong>
        </div>
        <div className="stat stat-resolved">
          <span>Resolution rate</span>
          <strong>{rate}%</strong>
        </div>
        <div className="stat">
          <span>Most reported</span>
          <strong className="stat-word">{total ? topCategory : "–"}</strong>
        </div>
        <div className="stat">
          <span>Active accounts</span>
          <strong>
            {stats.activeUsers}
            <small> / {stats.users}</small>
          </strong>
        </div>
      </section>

      <div className="two-col">
        <section className="panel">
          <h2>By status</h2>
          <Bars
            rows={STATUSES.map((s) => ({ label: s, value: stats.byStatus[s] || 0 }))}
            tone={(l) => `fill-${l.replace(" ", "-")}`}
          />
        </section>
        <section className="panel">
          <h2>By category</h2>
          <Bars rows={CATEGORIES.map((c) => ({ label: c, value: stats.byCategory[c] || 0 }))} />
        </section>
      </div>

      <div className="two-col">
        <section className="panel">
          <h2>Assigned per office</h2>
          <Bars rows={OFFICES.map((o) => ({ label: o, value: stats.byOffice?.[o] || 0 }))} />
        </section>
        <section className="panel">
          <h2>Needs attention</h2>
          <ul className="attention">
            <li>
              <strong>{stats.urgent}</strong>
              <span>urgent complaints still open</span>
            </li>
            <li>
              <strong>{stats.unassigned}</strong>
              <span>open complaints not assigned to an office</span>
            </li>
            <li>
              <strong>{stats.byStatus.pending || 0}</strong>
              <span>complaints with no response yet</span>
            </li>
          </ul>
        </section>
      </div>

      <section className="panel">
        <h2>Filed in the last six months</h2>
        <div className="columns">
          {last6.map((m) => {
            const max = Math.max(1, ...last6.map((x) => x.value));
            return (
              <div key={m.label} className="column">
                <strong>{m.value}</strong>
                <span className="column-bar" style={{ height: `${(m.value / max) * 100}%` }} />
                <small>{m.label}</small>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
