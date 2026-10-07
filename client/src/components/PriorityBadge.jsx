export default function PriorityBadge({ priority = "normal" }) {
  if (priority === "normal") return <span className="prio prio-normal">normal</span>;
  return <span className={`prio prio-${priority}`}>{priority}</span>;
}
