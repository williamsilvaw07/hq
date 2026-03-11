"use client";

import { useEffect, useState } from "react";

export default function DbStatusPage() {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    fetch("/api/db-status")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setStatus("ok");
          setMessage("Connected to database.");
        } else {
          setStatus("error");
          setMessage(data.error || "Connection failed.");
        }
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.message || "Request failed.");
      });
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif", maxWidth: "32rem" }}>
      <h1 style={{ marginBottom: "1rem" }}>Database status</h1>
      {status === "loading" && <p>Checking connection…</p>}
      {status === "ok" && (
        <p style={{ color: "green", fontWeight: 600 }}>✓ {message}</p>
      )}
      {status === "error" && (
        <p style={{ color: "crimson", fontWeight: 600 }}>✗ {message}</p>
      )}
    </div>
  );
}
