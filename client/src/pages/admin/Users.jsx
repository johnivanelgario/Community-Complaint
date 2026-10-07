import { useEffect, useState } from "react";
import api, { errorText } from "../../api";
import { useAuth } from "../../context/AuthContext";
import PageHead from "../../components/PageHead";
import Modal from "../../components/Modal";
import Avatar from "../../components/Avatar";
import Icon from "../../components/Icon";
import { fullName, formatDateTime } from "../../utils/format";

const BAN_LENGTHS = [
  { days: 1, label: "1 day" },
  { days: 3, label: "3 days" },
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" }
];

const activeBan = (u) => {
  const ban = u.ban;
  if (!ban || !ban.type || ban.type === "none") return null;
  if (ban.type === "temporary" && (!ban.until || new Date(ban.until) <= new Date())) return null;
  return ban;
};

const blank = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  studentId: "",
  course: "",
  password: "",
  role: "student",
  status: "active"
};

export default function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const [banning, setBanning] = useState(null);
  const [banForm, setBanForm] = useState({ type: "temporary", days: 3, reason: "" });
  const [banError, setBanError] = useState("");

  const load = async (q = search) => {
    setLoading(true);
    try {
      const { data } = await api.get("/users", { params: { search: q } });
      setUsers(data);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const openNew = () => {
    setForm(blank);
    setError("");
    setEditing("new");
  };

  const openEdit = (u) => {
    setForm({ ...blank, ...u, password: "" });
    setError("");
    setEditing(u._id);
  };

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editing === "new") {
        await api.post("/users", form);
      } else {
        const { password, ...rest } = form;
        await api.put(`/users/${editing}`, password ? form : rest);
      }
      setEditing(null);
      load();
    } catch (err) {
      setError(errorText(err));
    }
  };

  const remove = async (u) => {
    if (!window.confirm(`Delete ${fullName(u)}? Their complaints stay on record.`)) return;
    try {
      await api.delete(`/users/${u._id}`);
      setUsers(users.filter((x) => x._id !== u._id));
    } catch (err) {
      alert(errorText(err));
    }
  };

  const openBan = (u) => {
    setBanForm({ type: "temporary", days: 3, reason: "" });
    setBanError("");
    setBanning(u);
  };

  const saveBan = async (e) => {
    e.preventDefault();
    setBanError("");
    try {
      const { data } = await api.post(`/users/${banning._id}/ban`, banForm);
      setUsers(users.map((x) => (x._id === data._id ? data : x)));
      setBanning(null);
    } catch (err) {
      setBanError(errorText(err));
    }
  };

  const liftBan = async (u) => {
    if (!window.confirm(`Lift the ban on ${fullName(u)}? They can sign in again right away.`)) return;
    try {
      const { data } = await api.post(`/users/${u._id}/unban`);
      setUsers(users.map((x) => (x._id === data._id ? data : x)));
    } catch (err) {
      alert(errorText(err));
    }
  };

  const statusCell = (u) => {
    const ban = activeBan(u);
    if (ban?.type === "permanent") {
      return (
        <>
          <span className="badge badge-rejected">Banned</span>
          <p className="muted small ban-reason">{ban.reason}</p>
        </>
      );
    }
    if (ban) {
      return (
        <>
          <span className="badge badge-pending">Suspended</span>
          <p className="muted small ban-reason">
            Until {formatDateTime(ban.until)}
            <br />
            {ban.reason}
          </p>
        </>
      );
    }
    return (
      <span className={`badge badge-${u.status === "active" ? "resolved" : "rejected"}`}>{u.status}</span>
    );
  };

  return (
    <>
      <PageHead title="User management" sub={`${users.length} accounts`}>
        <div className="search">
          <Icon name="search" size={16} />
          <input
            placeholder="Search name, email or student ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Icon name="plus" size={16} /> Add user
        </button>
      </PageHead>

      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Full name</th>
              <th>Student ID</th>
              <th>Email address</th>
              <th>Phone number</th>
              <th>Role</th>
              <th>Status</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>
                  <div className="person">
                    <Avatar user={u} size={30} />
                    {fullName(u)}
                  </div>
                </td>
                <td className="nowrap">
                  {u.studentId || "–"}
                  {u.course && <p className="muted small">{u.course}</p>}
                </td>
                <td>{u.email}</td>
                <td>{u.phone || "–"}</td>
                <td className="cap">{u.role}</td>
                <td>{statusCell(u)}</td>
                <td className="row-actions">
                  <button className="icon-btn" onClick={() => openEdit(u)} aria-label="Edit user">
                    <Icon name="edit" size={16} />
                  </button>
                  {u.role !== "admin" &&
                    (activeBan(u) ? (
                      <button className="btn btn-ghost btn-small" onClick={() => liftBan(u)}>
                        Lift ban
                      </button>
                    ) : (
                      <button
                        className="icon-btn danger"
                        onClick={() => openBan(u)}
                        aria-label="Suspend or ban user"
                        title="Suspend or ban"
                      >
                        <Icon name="ban" size={16} />
                      </button>
                    ))}
                  {u._id !== me._id && (
                    <button className="icon-btn danger" onClick={() => remove(u)} aria-label="Delete user">
                      <Icon name="trash" size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && users.length === 0 && (
          <p className="muted empty">No one matches "{search}".</p>
        )}
      </div>

      {banning && (
        <Modal title={`Restrict ${fullName(banning)}`} onClose={() => setBanning(null)} width={440}>
          <form className="stack" onSubmit={saveBan}>
            <div className="role-switch" role="radiogroup" aria-label="Type">
              {[
                { value: "temporary", label: "Suspend" },
                { value: "permanent", label: "Ban permanently" }
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  role="radio"
                  aria-checked={banForm.type === t.value}
                  className={banForm.type === t.value ? "is-active" : ""}
                  onClick={() => setBanForm({ ...banForm, type: t.value })}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {banForm.type === "temporary" ? (
              <div className="field">
                <span>How long</span>
                <div className="chip-row">
                  {BAN_LENGTHS.map((b) => (
                    <button
                      key={b.days}
                      type="button"
                      className={`tab ${banForm.days === b.days ? "is-active" : ""}`}
                      onClick={() => setBanForm({ ...banForm, days: b.days })}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
                <p className="muted small">They can sign in again automatically when it ends.</p>
              </div>
            ) : (
              <p className="muted small">They won't be able to sign in until an admin lifts the ban.</p>
            )}

            <label className="field">
              <span>Reason (the student will see this)</span>
              <textarea
                rows={3}
                value={banForm.reason}
                onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })}
                placeholder="e.g. Filing spam complaints"
                required
              />
            </label>

            {banError && <div className="alert">{banError}</div>}

            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setBanning(null)}>
                Cancel
              </button>
              <button className="btn btn-danger">
                {banForm.type === "permanent" ? "Ban account" : `Suspend for ${banForm.days} day${banForm.days > 1 ? "s" : ""}`}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {editing && (
        <Modal title={editing === "new" ? "Add user" : "Edit user"} onClose={() => setEditing(null)}>
          <form className="stack" onSubmit={save}>
            <div className="grid-2">
              <label className="field">
                <span>First name</span>
                <input name="firstName" value={form.firstName} onChange={change} required />
              </label>
              <label className="field">
                <span>Last name</span>
                <input name="lastName" value={form.lastName} onChange={change} required />
              </label>
            </div>
            <label className="field">
              <span>Email</span>
              <input type="email" name="email" value={form.email} onChange={change} required />
            </label>
            <label className="field">
              <span>Phone number</span>
              <input name="phone" value={form.phone} onChange={change} />
            </label>
            {form.role === "student" && (
              <div className="grid-2">
                <label className="field">
                  <span>Student ID</span>
                  <input name="studentId" value={form.studentId} onChange={change} required />
                </label>
                <label className="field">
                  <span>Course, year & section</span>
                  <input name="course" value={form.course} onChange={change} />
                </label>
              </div>
            )}
            <label className="field">
              <span>{editing === "new" ? "Password" : "New password (leave blank to keep)"}</span>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={change}
                required={editing === "new"}
                minLength={6}
              />
            </label>
            <div className="grid-2">
              <label className="field">
                <span>Role</span>
                <select name="role" value={form.role} onChange={change}>
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <label className="field">
                <span>Status</span>
                <select name="status" value={form.status} onChange={change}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>
            {error && <div className="alert">{error}</div>}
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className="btn btn-primary">
                {editing === "new" ? "Add user" : "Save changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
