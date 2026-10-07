export const fullName = (u) => (u ? `${u.firstName} ${u.lastName}` : "Deleted user");

export const initials = (u) =>
  u ? `${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}`.toUpperCase() : "?";

export const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

export const formatDateTime = (d) =>
  new Date(d).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });

export const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const days = Math.floor(h / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
};

export const CATEGORIES = ["Facilities", "Classroom", "Cleanliness", "Internet", "Canteen", "Safety", "Faculty", "Other"];
export const STATUSES = ["pending", "in progress", "resolved", "rejected"];
export const PRIORITIES = ["low", "normal", "urgent"];
export const OFFICES = [
  "Facilities Office",
  "IT Office",
  "Guidance Office",
  "Registrar",
  "Canteen Management",
  "Campus Security",
  "Dean's Office"
];
