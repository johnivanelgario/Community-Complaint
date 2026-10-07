import { useState } from "react";
import api, { errorText } from "../api";
import { useAuth } from "../context/AuthContext";
import PageHead from "../components/PageHead";

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone || "",
    course: user.course || ""
  });
  const [pw, setPw] = useState({ password: "", confirm: "" });
  const [msg, setMsg] = useState({ profile: "", password: "" });
  const [err, setErr] = useState({ profile: "", password: "" });

  const saveProfile = async (e) => {
    e.preventDefault();
    setMsg({ ...msg, profile: "" });
    setErr({ ...err, profile: "" });
    try {
      const { data } = await api.put("/auth/me", profile);
      updateUser(data);
      setMsg({ ...msg, profile: "Profile saved" });
    } catch (e2) {
      setErr({ ...err, profile: errorText(e2) });
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setMsg({ ...msg, password: "" });
    if (pw.password.length < 6) return setErr({ ...err, password: "Use at least 6 characters" });
    if (pw.password !== pw.confirm) return setErr({ ...err, password: "Passwords don't match" });
    setErr({ ...err, password: "" });
    try {
      await api.put("/auth/me", { password: pw.password });
      setPw({ password: "", confirm: "" });
      setMsg({ ...msg, password: "Password changed" });
    } catch (e2) {
      setErr({ ...err, password: errorText(e2) });
    }
  };

  return (
    <>
      <PageHead title="Settings" sub="Update your details and password." />

      <div className="settings-grid">
        <form className="panel stack" onSubmit={saveProfile}>
          <h2>Profile</h2>
          <div className="grid-2">
            <label className="field">
              <span>First name</span>
              <input
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>Last name</span>
              <input
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                required
              />
            </label>
          </div>
          <label className="field">
            <span>Email</span>
            <input value={user.email} disabled />
          </label>
          {user.role === "student" && (
            <div className="grid-2">
              <label className="field">
                <span>Student ID</span>
                <input value={user.studentId || ""} disabled />
              </label>
              <label className="field">
                <span>Course, year & section</span>
                <input
                  value={profile.course}
                  onChange={(e) => setProfile({ ...profile, course: e.target.value })}
                />
              </label>
            </div>
          )}
          <label className="field">
            <span>Phone number</span>
            <input
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            />
          </label>
          {msg.profile && <div className="alert alert-ok">{msg.profile}</div>}
          {err.profile && <div className="alert">{err.profile}</div>}
          <button className="btn btn-primary">Save profile</button>
        </form>

        <form className="panel stack" onSubmit={savePassword}>
          <h2>Password</h2>
          <label className="field">
            <span>New password</span>
            <input
              type="password"
              value={pw.password}
              onChange={(e) => setPw({ ...pw, password: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Confirm new password</span>
            <input
              type="password"
              value={pw.confirm}
              onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
            />
          </label>
          {msg.password && <div className="alert alert-ok">{msg.password}</div>}
          {err.password && <div className="alert">{err.password}</div>}
          <button className="btn btn-primary">Change password</button>
        </form>
      </div>
    </>
  );
}
