import { useEffect, useState } from "react";
import api, { errorText } from "../../api";
import { useAuth } from "../../context/AuthContext";
import PageHead from "../../components/PageHead";
import Modal from "../../components/Modal";
import Avatar from "../../components/Avatar";
import Icon from "../../components/Icon";
import { fullName } from "../../utils/format";

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
                <td>
                  <span className={`badge badge-${u.status === "active" ? "resolved" : "rejected"}`}>
                    {u.status}
                  </span>
                </td>
                <td className="row-actions">
                  <button className="icon-btn" onClick={() => openEdit(u)} aria-label="Edit user">
                    <Icon name="edit" size={16} />
                  </button>
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
