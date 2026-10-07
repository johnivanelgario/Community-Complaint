import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errorText } from "../../api";
import PageHead from "../../components/PageHead";
import StatusBadge from "../../components/StatusBadge";
import Icon from "../../components/Icon";
import { STATUSES, formatDate } from "../../utils/format";

export default function MyComplaints() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get("/complaints", { params: { status } })
      .then(({ data }) => setItems(data))
      .catch((e) => setError(errorText(e)))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <>
      <PageHead title="My complaints" sub="Tap a complaint to see its details and any reply.">
        <Link to="/student/new" className="btn btn-primary">
          <Icon name="plus" size={16} /> New complaint
        </Link>
      </PageHead>

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

      {error && <div className="alert">{error}</div>}

      <ul className="cards">
        {items.map((c) => (
          <li key={c._id}>
            <Link to={`/student/complaints/${c._id}`} className="card">
              <div className="card-top">
                <strong>{c.title}</strong>
                <StatusBadge status={c.status} />
              </div>
              <p className="clip muted">{c.description}</p>
              <div className="card-meta">
                <span>{c.category}</span>
                {c.location && (
                  <span>
                    <Icon name="pin" size={14} /> {c.location}
                  </span>
                )}
                <span>{formatDate(c.createdAt)}</span>
              </div>
              {c.adminReply && <p className="card-reply">Office replied</p>}
            </Link>
          </li>
        ))}
      </ul>

      {!loading && items.length === 0 && (
        <div className="panel empty">
          <p className="muted">Nothing here yet.</p>
          <Link to="/student/new" className="btn btn-primary">File a complaint</Link>
        </div>
      )}
    </>
  );
}
