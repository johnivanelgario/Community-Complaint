import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Icon from "./Icon";
import Avatar from "./Avatar";
import Modal from "./Modal";
import { fullName } from "../utils/format";

const adminLinks = [
  { to: "/admin", label: "Overview", icon: "home", end: true },
  { to: "/admin/users", label: "User management", icon: "users" },
  { to: "/admin/logs", label: "System logs", icon: "logs" },
  { to: "/admin/reports", label: "Reports & analytics", icon: "chart" },
  { to: "/admin/complaints", label: "Complaints", icon: "inbox" },
  { to: "/admin/announcements", label: "Announcements", icon: "megaphone" },
  { to: "/admin/settings", label: "Settings", icon: "settings" }
];

const studentLinks = [
  { to: "/student", label: "Dashboard", icon: "home", end: true },
  { to: "/student/new", label: "File a complaint", icon: "plus" },
  { to: "/student/complaints", label: "My complaints", icon: "file" },
  { to: "/student/faq", label: "FAQ", icon: "help" },
  { to: "/student/settings", label: "Settings", icon: "settings" }
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const links = user.role === "admin" ? adminLinks : studentLinks;

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <img src="/logo.svg" alt="" width="34" height="34" />
          <div>
            <strong>Community</strong>
            <span>Complaint & Services</span>
          </div>
        </div>

        <nav className="nav">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>
              <Icon name={l.icon} />
              {l.label}
            </NavLink>
          ))}
        </nav>

        <button className="nav-logout" onClick={() => setConfirming(true)}>
          <Icon name="logout" />
          Log out
        </button>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-user">
            <div className="topbar-name">
              <strong>{fullName(user)}</strong>
              <span>{user.role === "admin" ? "Administrator" : user.studentId || "Student"}</span>
            </div>
            <Avatar user={user} />
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>

      {confirming && (
        <Modal title="Log out?" onClose={() => setConfirming(false)} width={380}>
          <p className="muted">You'll need to sign in again to file or manage complaints.</p>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setConfirming(false)}>
              Stay signed in
            </button>
            <button className="btn btn-primary" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
