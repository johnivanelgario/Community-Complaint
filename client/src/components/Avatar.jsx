import { initials } from "../utils/format";

export default function Avatar({ user, size = 34 }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials(user)}
    </span>
  );
}
