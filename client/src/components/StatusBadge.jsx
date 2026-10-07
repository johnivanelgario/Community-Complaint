export default function StatusBadge({ status }) {
  const key = status.replace(" ", "-");
  return <span className={`badge badge-${key}`}>{status}</span>;
}
