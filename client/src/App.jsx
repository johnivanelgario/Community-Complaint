import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Guard from "./components/Guard";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Settings from "./pages/Settings";
import ComplaintDetail from "./pages/ComplaintDetail";
import Overview from "./pages/admin/Overview";
import Users from "./pages/admin/Users";
import Logs from "./pages/admin/Logs";
import Reports from "./pages/admin/Reports";
import Complaints from "./pages/admin/Complaints";
import Announcements from "./pages/admin/Announcements";
import Dashboard from "./pages/student/Dashboard";
import NewComplaint from "./pages/student/NewComplaint";
import MyComplaints from "./pages/student/MyComplaints";
import Faq from "./pages/student/Faq";

export default function App() {
  const { user } = useAuth();
  const home = user ? (user.role === "admin" ? "/admin" : "/student") : "/login";

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={home} replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={home} replace /> : <Register />} />

      <Route
        path="/admin"
        element={
          <Guard role="admin">
            <Layout />
          </Guard>
        }
      >
        <Route index element={<Overview />} />
        <Route path="users" element={<Users />} />
        <Route path="logs" element={<Logs />} />
        <Route path="reports" element={<Reports />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="complaints/:id" element={<ComplaintDetail />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route
        path="/student"
        element={
          <Guard role="student">
            <Layout />
          </Guard>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="new" element={<NewComplaint />} />
        <Route path="complaints" element={<MyComplaints />} />
        <Route path="complaints/:id" element={<ComplaintDetail />} />
        <Route path="faq" element={<Faq />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  );
}
