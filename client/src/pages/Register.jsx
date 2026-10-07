import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errorText } from "../api";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    studentId: "",
    course: "",
    email: "",
    phone: "",
    password: "",
    confirm: ""
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return setError("Passwords don't match");
    if (form.password.length < 6) return setError("Password needs at least 6 characters");
    setError("");
    setBusy(true);
    try {
      const { confirm, ...payload } = form;
      await register(payload);
      navigate("/student", { replace: true });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <section className="auth-side">
        <img src="/logo.svg" alt="" width="52" height="52" />
        <h1>One account for every concern you raise at school.</h1>
        <p>File complaints, attach photos, and read the admin's replies in one place.</p>
      </section>

      <section className="auth-form">
        <form onSubmit={submit} className="stack">
          <div>
            <h2>Student registration</h2>
            <p className="muted">Use your real name and student ID so the admin can reach you.</p>
          </div>

          {error && <div className="alert">{error}</div>}

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

          <div className="grid-2">
            <label className="field">
              <span>Student ID</span>
              <input name="studentId" value={form.studentId} onChange={change} placeholder="2024-00123" required />
            </label>
            <label className="field">
              <span>Course, year & section</span>
              <input name="course" value={form.course} onChange={change} placeholder="BSIT 3-A" />
            </label>
          </div>

          <label className="field">
            <span>Email</span>
            <input type="email" name="email" value={form.email} onChange={change} required />
          </label>

          <label className="field">
            <span>Phone number</span>
            <input name="phone" value={form.phone} onChange={change} placeholder="09XX XXX XXXX" />
          </label>

          <div className="grid-2">
            <label className="field">
              <span>Password</span>
              <input type="password" name="password" value={form.password} onChange={change} required />
            </label>
            <label className="field">
              <span>Confirm password</span>
              <input type="password" name="confirm" value={form.confirm} onChange={change} required />
            </label>
          </div>

          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Creating account..." : "Create student account"}
          </button>

          <p className="muted center">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
