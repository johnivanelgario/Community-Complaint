import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { errorText } from "../../api";
import PageHead from "../../components/PageHead";
import StatusBadge from "../../components/StatusBadge";
import PriorityBadge from "../../components/PriorityBadge";
import Icon from "../../components/Icon";
import { STATUSES, PRIORITIES, OFFICES, formatDate, fullName } from "../../utils/format";

const toCsv = (rows) => {
  const head = ["Title", "Student", "Student ID", "Category", "Location", "Priority", "Office", "Status", "Filed on", "Reply"];
  const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((c) =>
    [
      c.title,
      fullName(c.submittedBy),
      c.submittedBy?.studentId,
      c.category,
      c.location,
      c.priority,
      c.assignedTo,
      c.status,
      formatDate(c.createdAt),
      c.adminReply
    ]
      .map(cell)
      .join(",")
  );
  return [head.map(cell).join(","), ...lines].join("\r\n");
};

export default function Complaints() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [office, setOffice] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      api
        .get("/complaints", { params: { status, priority, assignedTo: office, search } })
        .then(({ data }) => setItems(data))
        .catch((e) => setError(errorText(e)))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [status, priority, office, search]);

  const exportCsv = () => {
    const blob = new Blob(["\ufeff" + toCsv(items)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `complaints-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const open = (id) => navigate(`/admin/complaints/${id}`);

  return (
    <>
      <PageHead title="Complaints" sub="Open a complaint to reply, set its priority or assign it to an office.">
        <div className="search">
          <Icon name="search" size={16} />
          <input placeholder="Search by title" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-ghost" onClick={exportCsv} disabled={!items.length}>
          <Icon name="download" size={16} /> Export CSV
        </button>
      </PageHead>

      <div className="filter-bar">
        <div className="tabs" role="tablist">
          {["", ...STATUSES].map((s) => (
            <button
              key={s || "all"}
              role="tab"
              aria-selected={status === s}
              className={status === s ? "tab is-active" : "tab"}
              onClick={() => setStatus(s)}
            >
              {s || "All"}
            </button>
          ))}
        </div>
        <div className="filter-selects">
          <select value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Priority">
            <option value="">Any priority</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select value={office} onChange={(e) => setOffice(e.target.value)} aria-label="Office">
            <option value="">Any office</option>
            <option value="none">Not assigned</option>
            {OFFICES.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="panel table-wrap">
        <table className="clickable">
          <thead>
            <tr>
              <th>Student</th>
              <th>Complaint</th>
              <th>Priority</th>
              <th>Office</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr
                key={c._id}
                tabIndex={0}
                onClick={() => open(c._id)}
                onKeyDown={(e) => e.key === "Enter" && open(c._id)}
              >
                <td className="nowrap">
                  {fullName(c.submittedBy)}
                  {c.submittedBy?.studentId && <p className="muted small">{c.submittedBy.studentId}</p>}
                </td>
                <td>
                  <strong>{c.title}</strong>
                  <p className="clip muted">
                    {c.category}
                    {c.location && `, ${c.location}`}
                  </p>
                </td>
                <td>
                  <PriorityBadge priority={c.priority} />
                </td>
                <td className="nowrap">{c.assignedTo || <span className="muted">Not assigned</span>}</td>
                <td className="nowrap">{formatDate(c.createdAt)}</td>
                <td>
                  <StatusBadge status={c.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && items.length === 0 && <p className="muted empty">No complaints match these filters.</p>}
      </div>
    </>
  );
}
