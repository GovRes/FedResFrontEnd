"use client";

import { useApplication } from "@/app/providers/applicationContext";

export default function StepsDebugger() {
  const { steps, applicationId } = useApplication();

  return (
    <div
      style={{
        position: "fixed",
        bottom: "10px",
        right: "10px",
        background: "#f0f0f0",
        padding: "10px",
        border: "1px solid #ccc",
        borderRadius: "4px",
        maxWidth: "400px",
        maxHeight: "300px",
        overflow: "auto",
        zIndex: 1000,
        fontSize: "12px",
      }}
    >
      <h4 style={{ margin: "0 0 5px" }}>Application Debug</h4>
      <p style={{ margin: "0 0 5px" }}>App ID: {applicationId || "None"}</p>
      <div>
        <p style={{ margin: "0 0 5px" }}>Steps State:</p>
        <pre style={{ margin: 0, fontSize: "10px" }}>
          {JSON.stringify(steps, null, 2)}
        </pre>
      </div>
    </div>
  );
}
