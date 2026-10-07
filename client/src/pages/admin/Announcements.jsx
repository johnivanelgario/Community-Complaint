import { useEffect, useState } from "react";
import api, { errorText } from "../../api";
import PageHead from "../../components/PageHead";
import Modal from "../../components/Modal";
import Icon from "../../components/Icon";
import { formatDateTime, fullName } from "../../utils/format";

const blank = { title: "", body: "", pinned: false };

export default function Announcements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");

  const load = () =>
    api
      .get("/announcements")
      .then(({ data }) => setItems(data))
      .catch((e) => setError(errorText(e)))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setForm(blank);
    setError("");
    setEditing("new");
  };

  const openEdit = (a) => {
    setForm({ title: a.title, body: a.body, pinned: a.pinned });
    setError("");
    setEditing(a._id);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing === "new") await api.post("/announcements", form);
      else await api.put(`/announcements/${editing}`, form);
      setEditing(null);
      load();
    } catch (err) {
      setError(errorText(err));
    }
  };

  const togglePin = async (a) => {
    try {
      await api.put(`/announcements/${a._id}`, { pinned: !a.pinned });
      load();
    } catch (err) {
      alert(errorText(err));
    }
  };

  const remove = async (a) => {
    if (!window.confirm(`Remove "${a.title}"? Students will no longer see it.`)) return;
    try {
      await api.delete(`/announcements/${a._id}`);
      setItems(items.filter((x) => x._id !== a._id));
    } catch (err) {
      alert(errorText(err));
    }
  };

  return (
    <>
      <PageHead title="Announcements" sub="Posts here show up on every student's dashboard. Pinned posts stay on top.">
        <button className="btn btn-primary" onClick={openNew}>
          <Icon name="plus" size={16} /> New announcement
        </button>
      </PageHead>

      {error && !editing && <div className="alert">{error}</div>}

      <div className="announce-list">
        {items.map((a) => (
          <article key={a._id} className={`panel announce ${a.pinned ? "is-pinned" : ""}`}>
            <div className="announce-head">
              <div>
                <h2>{a.title}</h2>
                <small className="muted">
                  {fullName(a.createdBy)}, {formatDateTime(a.createdAt)}
                  {a.pinned && <span className="pin-tag">Pinned</span>}
                </small>
              </div>
              <div className="row-actions">
                <button
                  className="icon-btn"
                  onClick={() => togglePin(a)}
                  aria-label={a.pinned ? "Unpin" : "Pin to top"}
                  title={a.pinned ? "Unpin" : "Pin to top"}
                >
                  <Icon name="pinned" size={16} />
                </button>
                <button className="icon-btn" onClick={() => openEdit(a)} aria-label="Edit">
                  <Icon name="edit" size={16} />
                </button>
                <button className="icon-btn danger" onClick={() => remove(a)} aria-label="Remove">
                  <Icon name="trash" size={16} />
                </button>
              </div>
            </div>
            <p className="prose">{a.body}</p>
          </article>
        ))}
      </div>

      {!loading && items.length === 0 && (
        <div className="panel empty">
          <p className="muted">No announcements yet. Post one to let students know about maintenance, schedules or fixes.</p>
          <button className="btn btn-primary" onClick={openNew}>Post an announcement</button>
        </div>
      )}

      {editing && (
        <Modal
          title={editing === "new" ? "New announcement" : "Edit announcement"}
          onClose={() => setEditing(null)}
          width={560}
        >
          <form className="stack" onSubmit={save}>
            <label className="field">
              <span>Title</span>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Wi-Fi maintenance this Friday"
                required
              />
            </label>
            <label className="field">
              <span>Message</span>
              <textarea
                rows="6"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="What's happening, when, and what students should do"
                required
              />
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
              />
              Pin to the top of student dashboards
            </label>
            {error && <div className="alert">{error}</div>}
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className="btn btn-primary">{editing === "new" ? "Post announcement" : "Save changes"}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
