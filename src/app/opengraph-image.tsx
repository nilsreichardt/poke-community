import { ImageResponse } from "next/og";
import { siteMetadata } from "@/lib/seo";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(circle at 10% 20%, #3b82f6 0, transparent 60%), radial-gradient(circle at 80% 0, #a855f7 0, transparent 60%), linear-gradient(135deg, #0f172a 0%, #111827 60%, #1f2937 100%)",
          color: "#f8fafc",
          fontFamily: "Geist, 'DM Sans', 'Inter', system-ui, sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 32,
            border: "1px solid rgba(148, 163, 184, 0.25)",
            borderRadius: 32,
            backdropFilter: "blur(8px)",
          }}
        />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "80px 96px",
            position: "relative",
            gap: 48,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 20px",
                borderRadius: 999,
                backgroundColor: "rgba(15, 23, 42, 0.45)",
                border: "1px solid rgba(148, 163, 184, 0.35)",
                fontSize: 28,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              {siteMetadata.shortName}
            </span>
            <h1
              style={{
                fontSize: 86,
                fontWeight: 600,
                lineHeight: 1.05,
                maxWidth: "820px",
              }}
            >
              Discover &amp; share Poke automations
            </h1>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 22,
              fontSize: 32,
              color: "rgba(226, 232, 240, 0.9)",
            }}
          >
            <p style={{ maxWidth: "820px", lineHeight: 1.4 }}>
              Community-curated library of workflows, prompts, and setup guides
              to help you move faster with Poke.
            </p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {["Trending automations", "Setup-ready prompts", "Real-world playbooks"].map(
                (label) => (
                  <span
                    key={label}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 999,
                      backgroundColor: "rgba(15, 23, 42, 0.65)",
                      border: "1px solid rgba(148, 163, 184, 0.4)",
                      fontSize: 28,
                    }}
                  >
                    {label}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
