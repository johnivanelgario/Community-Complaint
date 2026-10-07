import Log from "../models/Log.js";

export default async function addLog(user, action, type = "system") {
  try {
    await Log.create({ user, action, type });
  } catch (err) {
    console.error("Could not write log:", err.message);
  }
}
