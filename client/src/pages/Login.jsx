import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errorText } from "../api";

const roles = [
  { value: "student", label: "Student" },
  { value: "admin", label: "Admin" }
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const registered = location.state?.registered;
  const [role, setRole] = useState("student");
  const [form, setForm] = useState({ email: registered || "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const pickRole = (value) => {
    setRole(value);
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await login(form.email, form.password, role);
      navigate(user.role === "admin" ? "/admin" : "/student", { replace: true });
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
        <h1>Speak up about what needs fixing on campus.</h1>
        <p>
          Report broken facilities, slow Wi-Fi, dirty restrooms or safety concerns, and follow each
          one until the school resolves it.
        </p>
      </section>

      <section className="auth-form">
        <form onSubmit={submit} className="stack">
          <div>
            <h2>Sign in</h2>
            <p className="muted">Choose how you're signing in.</p>
          </div>

          <div className="role-switch" role="radiogroup" aria-label="Sign in as">
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                role="radio"
                aria-checked={role === r.value}
                className={role === r.value ? "is-active" : ""}
                onClick={() => pickRole(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>

          {registered && !error && role === "student" && (
            <div className="alert alert-ok">Account created. Sign in with your new password.</div>
          )}

          {error && <div className="alert">{error}</div>}

          <label className="field">
            <span>{role === "admin" ? "Admin email" : "School email"}</span>
            <input type="email" name="email" value={form.email} onChange={change} required autoFocus />
          </label>

          <label className="field">
            <span>Password</span>
            <input type="password" name="password" value={form.password} onChange={change} required />
          </label>

          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Signing in..." : role === "admin" ? "Sign in as admin" : "Sign in as student"}
          </button>

          {role === "student" ? (
            <p className="muted center">
              No account yet? <Link to="/register">Register as a student</Link>
            </p>
          ) : (
            <p className="muted center">Admin accounts are created by the school.</p>
          )}
        </form>
      </section>
    </div>
  );
}
