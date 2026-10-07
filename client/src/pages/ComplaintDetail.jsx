import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { errorText } from "../api";
import { useAuth } from "../context/AuthContext";
import Icon from "../components/Icon";
import StatusBadge from "../components/StatusBadge";
import PriorityBadge from "../components/PriorityBadge";
import { STATUSES, PRIORITIES, OFFICES, formatDateTime, fullName } from "../utils/format";

const pickForm = (c) => ({
  status: c.status,
  priority: c.priority || "normal",
  assignedTo: c.assignedTo || "",
  adminReply: c.adminReply || "",
  internalNote: c.internalNote || ""
});

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user.role === "admin";
  const backTo = isAdmin ? "/admin/complaints" : "/student/complaints";

  const [complaint, setComplaint] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get(`/complaints/${id}`)
      .then(({ data }) => {
        setComplaint(data);
        setForm(pickForm(data));
      })
      .catch((err) => setError(errorText(err)));
  }, [id]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (payload, message) => {
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const { data } = await api.put(`/complaints/${id}`, payload);
      setComplaint(data);
      setForm(pickForm(data));
      setNotice(message);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const save = (e) => {
    e.preventDefault();
    submit(form, "Changes saved");
  };

  const quickResolve = () => submit({ ...form, status: "resolved" }, "Marked as resolved");

  const remove = async () => {
    const msg = isAdmin ? "Delete this complaint for good?" : "Withdraw this complaint?";
    if (!window.confirm(msg)) return;
    try {
      await api.delete(`/complaints/${id}`);
      navigate(backTo);
    } catch (err) {
      setError(errorText(err));
    }
  };

  if (error && !complaint) {
    return (
      <div className="panel empty">
        <p>{error}</p>
        <Link to={backTo} className="btn btn-ghost">Back to complaints</Link>
      </div>
    );
  }

  if (!complaint) return <p className="muted">Loading complaint...</p>;

  const student = complaint.submittedBy;
  const history = [...(complaint.history || [])].reverse();

  return (
    <div className="detail">
      <Link to={backTo} className="back-link">
        <Icon name="back" size={16} /> All complaints
      </Link>

      <div className="detail-grid">
        <div className="stack">
          <article className="panel detail-body">
            <div className="detail-title">
              <h1>{complaint.title}</h1>
              <div className="badges">
                {isAdmin && <PriorityBadge priority={complaint.priority} />}
                <StatusBadge status={complaint.status} />
              </div>
            </div>

            <dl className="meta">
              <div>
                <dt>Filed by</dt>
                <dd>{fullName(student)}</dd>
              </div>
              {isAdmin && student?.studentId && (
                <div>
                  <dt>Student ID</dt>
                  <dd>
                    {student.studentId}
                    {student.course && ` (${student.course})`}
                  </dd>
                </div>
              )}
              <div>
                <dt>Category</dt>
                <dd>{complaint.category}</dd>
              </div>
              <div>
                <dt>Filed on</dt>
                <dd>{formatDateTime(complaint.createdAt)}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{complaint.location || "Not given"}</dd>
              </div>
              <div>
                <dt>Handled by</dt>
                <dd>{complaint.assignedTo || "Not assigned yet"}</dd>
              </div>
            </dl>

            <h3>Description</h3>
            <p className="prose">{complaint.description}</p>

            <h3>Photo</h3>
            {complaint.photo ? (
              <a href={complaint.photo} target="_blank" rel="noreferrer">
                <img src={complaint.photo} alt="Attached to the complaint" className="detail-photo" />
              </a>
            ) : (
              <div className="photo-empty">
                <Icon name="image" size={22} />
                No photo attached
              </div>
            )}

            {isAdmin && student && (
              <>
                <h3>Contact the student</h3>
                <p className="muted">
                  {student.email}
                  {student.phone && `, ${student.phone}`}
                </p>
              </>
            )}
          </article>

          <section className="panel">
            <h2>Timeline</h2>
            {history.length ? (
              <ol className="timeline">
                {history.map((h, i) => (
                  <li key={i}>
                    <strong>{h.action}</strong>
                    <small className="muted">
                      {h.by ? `${fullName(h.by)}${h.by.role === "admin" ? " (admin)" : ""}` : "System"},{" "}
                      {formatDateTime(h.at)}
                    </small>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="muted">Filed {formatDateTime(complaint.createdAt)}. No updates yet.</p>
            )}
          </section>
        </div>

        <aside className="panel sticky">
          {isAdmin ? (
            <form onSubmit={save} className="stack">
              <h2>Manage complaint</h2>

              <div className="grid-2">
                <label className="field">
                  <span>Status</span>
                  <select value={form.status} onChange={set("status")}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Priority</span>
                  <select value={form.priority} onChange={set("priority")}>
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="field">
                <span>Assign to office</span>
                <select value={form.assignedTo} onChange={set("assignedTo")} className="no-cap">
                  <option value="">Not assigned</option>
                  {OFFICES.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Reply to student</span>
                <textarea
                  rows="5"
                  value={form.adminReply}
                  onChange={set("adminReply")}
                  placeholder="What's being done, and when they can expect it"
                />
              </label>

              <label className="field">
                <span className="with-icon">
                  <Icon name="lock" size={14} /> Internal note
                </span>
                <textarea
                  rows="3"
                  className="note-input"
                  value={form.internalNote}
                  onChange={set("internalNote")}
                  placeholder="Only admins can see this"
                />
              </label>

              {notice && <div className="alert alert-ok">{notice}</div>}
              {error && <div className="alert">{error}</div>}

              <button className="btn btn-primary btn-block" disabled={busy}>
                {busy ? "Saving..." : "Save changes"}
              </button>
              {complaint.status !== "resolved" && (
                <button type="button" className="btn btn-ghost btn-block" onClick={quickResolve} disabled={busy}>
                  Mark as resolved
                </button>
              )}
              <button type="button" className="btn btn-danger-ghost btn-block" onClick={remove}>
                Delete complaint
              </button>
            </form>
          ) : (
            <div className="stack">
              <h2>Reply from the admin</h2>
              {complaint.adminReply ? (
                <p className="prose reply">{complaint.adminReply}</p>
              ) : (
                <p className="muted">No reply yet. You'll see it here once the admin responds.</p>
              )}
              {error && <div className="alert">{error}</div>}
              {complaint.status === "pending" && (
                <button className="btn btn-danger-ghost btn-block" onClick={remove}>
                  Withdraw complaint
                </button>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
