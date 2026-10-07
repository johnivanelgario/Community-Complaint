import { useEffect, useState } from "react";
import api, { errorText } from "../../api";
import PageHead from "../../components/PageHead";
import { formatDateTime, fullName } from "../../utils/format";

const filters = [
  { value: "", label: "All" },
  { value: "auth", label: "Sign-ins" },
  { value: "complaint", label: "Complaints" },
  { value: "user", label: "Accounts" }
];

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get("/logs", { params: { type } })
      .then(({ data }) => setLogs(data))
      .catch((e) => setError(errorText(e)))
      .finally(() => setLoading(false));
  }, [type]);

  return (
    <>
      <PageHead title="System logs" sub="Every sign-in, complaint and account change, newest first." />

      <div className="tabs" role="tablist">
        {filters.map((f) => (
          <button
            key={f.value}
            role="tab"
            aria-selected={type === f.value}
            className={type === f.value ? "tab is-active" : "tab"}
            onClick={() => setType(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Activity</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id}>
                <td className="nowrap muted">{formatDateTime(log.createdAt)}</td>
                <td className="nowrap">{fullName(log.user)}</td>
                <td>
                  <span className={`dot dot-${log.type}`} /> {log.action}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && logs.length === 0 && <p className="muted empty">No activity in this view yet.</p>}
      </div>
    </>
  );
}
