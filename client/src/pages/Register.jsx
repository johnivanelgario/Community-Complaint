import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errorText } from "../api";

export default function Register() {
  const { sendCode, register } = useAuth();
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
  const [step, setStep] = useState("details");
  const [code, setCode] = useState("");
  const [wait, setWait] = useState(0);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const { confirm, ...payload } = form;

  const requestCode = async () => {
    setError("");
    setBusy(true);
    try {
      const data = await sendCode(payload);
      setStep("code");
      setCode("");
      setWait(data.seconds || 60);
      setNotice(`We sent a 6-digit code to ${form.email}`);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const submitDetails = (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return setError("Passwords don't match");
    if (form.password.length < 6) return setError("Password needs at least 6 characters");
    requestCode();
  };

  const submitCode = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register({ ...payload, code });
      navigate("/login", { replace: true, state: { registered: form.email } });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const goBack = () => {
    setStep("details");
    setError("");
    setNotice("");
  };

  return (
    <div className="auth">
      <section className="auth-side">
        <img src="/logo.svg" alt="" width="52" height="52" />
        <h1>One account for every concern you raise at school.</h1>
        <p>File complaints, attach photos, and read the admin's replies in one place.</p>
      </section>

      <section className="auth-form">
        {step === "details" ? (
          <form onSubmit={submitDetails} className="stack">
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
              {busy ? "Sending code..." : "Continue"}
            </button>

            <p className="muted center">
              Already registered? <Link to="/login">Sign in</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={submitCode} className="stack">
            <div>
              <h2>Check your email</h2>
              <p className="muted">Enter the code we sent to finish creating your account. It expires in 10 minutes.</p>
            </div>

            {notice && !error && <div className="alert alert-ok">{notice}</div>}
            {error && <div className="alert">{error}</div>}

            <label className="field">
              <span>Verification code</span>
              <input
                className="code-input"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                autoFocus
                required
              />
            </label>

            <button className="btn btn-primary btn-block" disabled={busy || code.length !== 6}>
              {busy ? "Checking..." : "Verify and create account"}
            </button>

            <p className="muted center">
              Didn't get it? Check your spam folder or{" "}
              {wait > 0 ? (
                <span>resend in {wait}s</span>
              ) : (
                <button type="button" className="text-btn" onClick={requestCode} disabled={busy}>
                  send a new code
                </button>
              )}
            </p>

            <p className="muted center">
              <button type="button" className="text-btn" onClick={goBack}>
                Change my details
              </button>
            </p>
          </form>
        )}
      </section>
    </div>
  );
}
