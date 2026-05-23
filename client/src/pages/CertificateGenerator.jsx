import { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import { getParticipants, getTrainings } from "../lib/api";

// ─── Palette & Design Tokens ───────────────────────────────────────────────
const gold = "#C9962C";
const goldLight = "#E8C068";
const goldDark = "#8B6914";
const deepNavy = "#0D1B2A";
const cream = "#FDF8EE";
const burgundy = "#6B1A2A";

// ─── Decorative SVG border for the certificate canvas ─────────────────────
function CertBorder() {
  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      viewBox="0 0 800 560"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer frame */}
      <rect x="10" y="10" width="780" height="540" fill="none" stroke={gold} strokeWidth="2" rx="4" />
      <rect x="18" y="18" width="764" height="524" fill="none" stroke={goldLight} strokeWidth="0.5" rx="2" />
      <rect x="24" y="24" width="752" height="512" fill="none" stroke={gold} strokeWidth="1" rx="2" />

      {/* Corner ornaments */}
      {[[10, 10], [790, 10], [10, 550], [790, 550]].map(([cx, cy], i) => (
        <g key={i} transform={`translate(${cx},${cy})`}>
          <circle cx="0" cy="0" r="6" fill={gold} />
          <circle cx="0" cy="0" r="3" fill={cream} />
        </g>
      ))}

      {/* Top decorative band */}
      <rect x="10" y="10" width="780" height="52" fill={deepNavy} rx="4" />

      {/* Bottom band */}
      <rect x="10" y="498" width="780" height="52" fill={deepNavy} rx="4" />

      {/* Side flourishes */}
      <line x1="10" y1="280" x2="60" y2="280" stroke={gold} strokeWidth="1" />
      <line x1="740" y1="280" x2="790" y2="280" stroke={gold} strokeWidth="1" />
      <circle cx="60" cy="280" r="4" fill="none" stroke={gold} strokeWidth="1" />
      <circle cx="740" cy="280" r="4" fill="none" stroke={gold} strokeWidth="1" />

      {/* Divider line under header area */}
      <line x1="80" y1="148" x2="720" y2="148" stroke={gold} strokeWidth="0.75" />
      <line x1="80" y1="152" x2="720" y2="152" stroke={goldLight} strokeWidth="0.25" />

      {/* Divider above signature */}
      <line x1="80" y1="430" x2="720" y2="430" stroke={gold} strokeWidth="0.75" />
      <line x1="80" y1="434" x2="720" y2="434" stroke={goldLight} strokeWidth="0.25" />

      {/* Small diamond decorations */}
      {[200, 400, 600].map((x) => (
        <g key={x} transform={`translate(${x}, 150)`}>
          <rect x="-5" y="-5" width="10" height="10" fill={gold} transform="rotate(45)" />
          <rect x="-2.5" y="-2.5" width="5" height="5" fill={cream} transform="rotate(45)" />
        </g>
      ))}
      {[200, 400, 600].map((x) => (
        <g key={x} transform={`translate(${x}, 432)`}>
          <rect x="-5" y="-5" width="10" height="10" fill={gold} transform="rotate(45)" />
          <rect x="-2.5" y="-2.5" width="5" height="5" fill={cream} transform="rotate(45)" />
        </g>
      ))}
    </svg>
  );
}

// ─── The actual certificate (rendered on a canvas-like div) ─────────────
function Certificate({ data, certRef }) {
  const { participantName, occupation, trainingTitle, trainerName, date, orgName, certNumber } = data;

  const formattedDate = date
    ? new Date(date).toLocaleDateString("en-RW", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  return (
    <div
      ref={certRef}
      style={{
        position: "relative",
        width: "800px",
        height: "560px",
        background: cream,
        fontFamily: "'IM Fell English', 'Georgia', serif",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <CertBorder />

      {/* Header band content */}
      <div style={{
        position: "absolute", top: 10, left: 10, right: 10, height: 52,
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 12,
      }}>
        <span style={{ color: gold, fontSize: 14, letterSpacing: 8 }}>✦ ✦ ✦</span>
        <span style={{
          color: cream, fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase",
          fontFamily: "'Cinzel', serif", fontWeight: 400,
        }}>
          {orgName || "Women Empowerment Programme"}
        </span>
        <span style={{ color: gold, fontSize: 14, letterSpacing: 8 }}>✦ ✦ ✦</span>
      </div>

      {/* Certificate of Completion title */}
      <div style={{ position: "absolute", top: 68, left: 0, right: 0, textAlign: "center" }}>
        <div style={{
          fontFamily: "'Cinzel Decorative', 'Palatino', serif",
          fontSize: 11, letterSpacing: "0.4em", color: goldDark,
          textTransform: "uppercase", marginBottom: 6,
        }}>
          Certificate of
        </div>
        <div style={{
          fontFamily: "'Cinzel Decorative', 'Palatino', serif",
          fontSize: 32, color: deepNavy, letterSpacing: "0.05em", lineHeight: 1,
        }}>
          Completion
        </div>
      </div>

      {/* "This certifies that" */}
      <div style={{
        position: "absolute", top: 164, left: 0, right: 0, textAlign: "center",
        fontStyle: "italic", color: "#5a4a3a", fontSize: 13, letterSpacing: "0.05em",
      }}>
        This certificate is proudly presented to
      </div>

      {/* Participant name */}
      <div style={{ position: "absolute", top: 184, left: 60, right: 60, textAlign: "center" }}>
        <div style={{
          fontFamily: "'IM Fell English', 'Georgia', serif",
          fontSize: 38, color: burgundy, lineHeight: 1.2,
          borderBottom: `1.5px solid ${gold}`,
          paddingBottom: 8, marginBottom: 4,
        }}>
          {participantName || "Participant Name"}
        </div>
        <div style={{ fontSize: 11, color: "#7a6a5a", letterSpacing: "0.2em", textTransform: "uppercase" }}>
          {occupation || "Participant"}
        </div>
      </div>

      {/* Body text */}
      <div style={{
        position: "absolute", top: 300, left: 80, right: 80, textAlign: "center",
        fontSize: 13, color: "#3a2a1a", lineHeight: 1.8,
      }}>
        <span>has successfully completed the training program</span>
        <div style={{
          fontFamily: "'Cinzel', serif", fontSize: 15, color: deepNavy,
          fontWeight: 600, margin: "6px 0", letterSpacing: "0.05em",
        }}>
          "{trainingTitle || "Training Title"}"
        </div>
        <span>facilitated by <strong style={{ color: burgundy }}>{trainerName || "Trainer Name"}</strong></span>
        <br />
        <span>on <strong>{formattedDate}</strong></span>
      </div>

      {/* Bottom band content */}
      <div style={{
        position: "absolute", bottom: 10, left: 10, right: 10, height: 52,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 100, borderTop: `1px solid ${goldLight}`, marginBottom: 4 }} />
          <div style={{ fontSize: 9, color: cream, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Programme Director
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 44, height: 44, border: `1.5px solid ${gold}`,
            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto",
          }}>
            <span style={{ color: gold, fontSize: 18 }}>✦</span>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 100, borderTop: `1px solid ${goldLight}`, marginBottom: 4 }} />
          <div style={{ fontSize: 9, color: cream, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Lead Trainer
          </div>
        </div>
      </div>

      {/* Certificate number */}
      {certNumber && (
        <div style={{
          position: "absolute", bottom: 62, right: 32,
          fontSize: 9, color: "#9a8a7a", letterSpacing: "0.1em",
        }}>
          Cert. No: {certNumber}
        </div>
      )}
    </div>
  );
}

// ─── Form field ────────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 600,
        color: "#6B1A2A", letterSpacing: "0.1em",
        textTransform: "uppercase", marginBottom: 6,
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "9px 12px", fontSize: 14,
  border: "1px solid #ddd", borderRadius: 6, outline: "none",
  background: "#fff", color: "#1a1a1a", boxSizing: "border-box",
  fontFamily: "inherit",
};
const selectStyle = { ...inputStyle, cursor: "pointer" };

// ─── Main component ────────────────────────────────────────────────────────
export default function CertificateGenerator() {
  const certRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [participants, setParticipants] = useState([]);
  const [trainings, setTrainings] = useState([]);

  const [form, setForm] = useState({
    participantName: "",
    occupation: "",
    trainingTitle: "",
    trainerName: "",
    date: "",
    orgName: "Rwanda Women Empowerment Programme",
    certNumber: "",
  });

  const [participantId, setParticipantId] = useState("");
  const [trainingId, setTrainingId] = useState("");

  // Load participants and trainings from the real API
  useEffect(() => {
    Promise.all([getParticipants(), getTrainings()])
      .then(([p, t]) => {
        setParticipants(p);
        setTrainings(t);
      })
      .catch((err) => setLoadError(err.message || "Failed to load data"));
  }, []);

  // Auto-fill from participant selection
  function handleParticipantChange(id) {
    setParticipantId(id);
    if (!id) return;
    const p = participants.find((x) => String(x.id) === id);
    if (p) setForm((f) => ({ ...f, participantName: p.full_name || "", occupation: p.occupation || "" }));
  }

  // Auto-fill from training selection
  function handleTrainingChange(id) {
    setTrainingId(id);
    if (!id) return;
    const t = trainings.find((x) => String(x.id) === id);
    if (t) {
      // Use end_date as completion date, fall back to start_date or date
      const rawDate = t.end_date || t.start_date || t.date || "";
      setForm((f) => ({
        ...f,
        trainingTitle: t.title || "",
        trainerName: t.trainer_name || "",
        date: rawDate ? rawDate.slice(0, 10) : "",
      }));
    }
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Generate a random cert number
  const generateCertNo = () => {
    const num = "WEP-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
    setForm((f) => ({ ...f, certNumber: num }));
  };

  // Download using html2canvas (npm package)
  const download = async () => {
    if (!certRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: cream,
        logging: false,
      });
      const link = document.createElement("a");
      const name = (form.participantName || "certificate").replace(/\s+/g, "_");
      link.download = `certificate_${name}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const isReady = form.participantName && form.trainingTitle && form.date;

  return (
    <div style={{
      fontFamily: "'Segoe UI', sans-serif",
      background: "#f5f5f0",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>

      {/* Page title bar */}
      <div style={{ padding: "20px 28px 16px", flexShrink: 0 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: deepNavy }}>Certificate Generator</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#666" }}>
          Fill in the details below, preview the certificate, then download as PNG.
        </p>
        {loadError && (
          <div style={{
            marginTop: 10, padding: "10px 14px", background: "#fff0f0",
            border: "1px solid #f5c6c6", borderRadius: 8, fontSize: 13, color: "#a00",
          }}>
            ⚠ {loadError}
          </div>
        )}
      </div>

      {/* Layout: form left, preview right — fills remaining height */}
      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "320px 1fr",
        gap: 0,
        overflow: "hidden",
      }}>

        {/* ─── Form panel ─────────────────────────────────────────────── */}
        <div style={{
          background: "#fff",
          borderRight: "1px solid #e8e0d0",
          padding: "20px 20px",
          overflowY: "auto",
          height: "100%",
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: burgundy,
            letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 20,
          }}>
            1 — Participant
          </div>

          <Field label="Select participant">
            <select
              style={selectStyle}
              value={participantId}
              onChange={(e) => handleParticipantChange(e.target.value)}
            >
              <option value="">— Choose from database —</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </Field>

          <Field label="Full name">
            <input style={inputStyle} value={form.participantName}
              onChange={set("participantName")} placeholder="e.g. Uwimana Chantal" />
          </Field>

          <Field label="Occupation">
            <input style={inputStyle} value={form.occupation}
              onChange={set("occupation")} placeholder="e.g. Entrepreneur" />
          </Field>

          <div style={{
            fontSize: 11, fontWeight: 700, color: burgundy,
            letterSpacing: "0.15em", textTransform: "uppercase", margin: "24px 0 16px",
          }}>
            2 — Training
          </div>

          <Field label="Select training">
            <select
              style={selectStyle}
              value={trainingId}
              onChange={(e) => handleTrainingChange(e.target.value)}
            >
              <option value="">— Choose from database —</option>
              {trainings.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </Field>

          <Field label="Training title">
            <input style={inputStyle} value={form.trainingTitle}
              onChange={set("trainingTitle")} placeholder="e.g. Financial Literacy" />
          </Field>

          <Field label="Trainer name">
            <input style={inputStyle} value={form.trainerName}
              onChange={set("trainerName")} placeholder="e.g. Dr. Alice Mukabaranga" />
          </Field>

          <Field label="Completion date">
            <input type="date" style={inputStyle} value={form.date} onChange={set("date")} />
          </Field>

          <div style={{
            fontSize: 11, fontWeight: 700, color: burgundy,
            letterSpacing: "0.15em", textTransform: "uppercase", margin: "24px 0 16px",
          }}>
            3 — Organisation
          </div>

          <Field label="Organisation name">
            <input style={inputStyle} value={form.orgName} onChange={set("orgName")} />
          </Field>

          <Field label="Certificate number">
            <div style={{ display: "flex", gap: 8 }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={form.certNumber}
                onChange={set("certNumber")}
                placeholder="e.g. WEP-2025-1042"
              />
              <button
                onClick={generateCertNo}
                style={{
                  padding: "9px 12px", border: "1px solid #ddd", borderRadius: 6,
                  background: "#f5f5f0", cursor: "pointer", fontSize: 12, whiteSpace: "nowrap",
                  color: deepNavy, fontWeight: 500,
                }}
              >
                Auto
              </button>
            </div>
          </Field>

          {/* Download button */}
          <button
            onClick={download}
            disabled={!isReady || downloading}
            style={{
              width: "100%", marginTop: 8, padding: "12px",
              background: isReady ? burgundy : "#ccc",
              color: "#fff", border: "none", borderRadius: 8,
              fontSize: 14, fontWeight: 600, cursor: isReady ? "pointer" : "not-allowed",
              letterSpacing: "0.04em", transition: "background .2s",
            }}
          >
            {downloading ? "Generating…" : success ? "✓ Downloaded!" : "⬇ Download Certificate PNG"}
          </button>

          {!isReady && (
            <p style={{ marginTop: 8, fontSize: 11, color: "#999", textAlign: "center" }}>
              Fill in name, training, and date to enable download.
            </p>
          )}
        </div>

        {/* ─── Preview panel ───────────────────────────────────────────── */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          overflow: "auto",
          height: "100%",
          background: "#edeae3",
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "#666",
            letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16,
            alignSelf: "flex-start",
          }}>
            Live Preview
          </div>
          <div style={{ borderRadius: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.18)" }}>
            <Certificate data={form} certRef={certRef} />
          </div>
          <p style={{ marginTop: 12, fontSize: 11, color: "#888", textAlign: "center" }}>
            Certificate renders at 800×560px — downloaded at 2× resolution (1600×1120px)
          </p>
        </div>
      </div>
    </div>
  );
}
