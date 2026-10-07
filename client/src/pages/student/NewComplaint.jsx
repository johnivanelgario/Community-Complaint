import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { errorText } from "../../api";
import PageHead from "../../components/PageHead";
import Icon from "../../components/Icon";
import { CATEGORIES } from "../../utils/format";

export default function NewComplaint() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", category: "Other", location: "", description: "" });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const pickPhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setError("Photo must be under 5 MB");
    setError("");
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const clearPhoto = () => {
    setPhoto(null);
    setPreview("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      Object.entries(form).forEach(([k, v]) => body.append(k, v));
      if (photo) body.append("photo", photo);
      const { data } = await api.post("/complaints", body);
      navigate(`/student/complaints/${data._id}`);
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };

  return (
    <>
      <PageHead title="File a complaint" sub="Be specific so the right office can act on it quickly." />

      <form className="panel complaint-form" onSubmit={submit}>
        <div className="stack">
          <label className="field">
            <span>What's the problem?</span>
            <input
              name="title"
              value={form.title}
              onChange={change}
              placeholder="Broken aircon in Room 204"
              required
              maxLength={120}
            />
          </label>

          <div className="grid-2">
            <label className="field">
              <span>Category</span>
              <select name="category" value={form.category} onChange={change}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Location</span>
              <input
                name="location"
                value={form.location}
                onChange={change}
                placeholder="Building, room or area"
              />
            </label>
          </div>

          <label className="field">
            <span>Details</span>
            <textarea
              name="description"
              rows="7"
              value={form.description}
              onChange={change}
              placeholder="When did it start, how often does it happen, and who is affected?"
              required
            />
          </label>
        </div>

        <div className="stack">
          <span className="field-label">Photo (optional)</span>
          {preview ? (
            <div className="photo-preview">
              <img src={preview} alt="Selected" />
              <button type="button" className="btn btn-ghost" onClick={clearPhoto}>
                Remove photo
              </button>
            </div>
          ) : (
            <label className="dropzone">
              <Icon name="image" size={26} />
              <span>Add a photo</span>
              <small>JPG, PNG or WEBP up to 5 MB</small>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={pickPhoto} hidden />
            </label>
          )}

          {error && <div className="alert">{error}</div>}

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={busy}>
              {busy ? "Sending..." : "Send complaint"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
