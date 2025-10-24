import { ImageResponse } from "next/og";
import { getAutomationBySlug } from "@/lib/data/automations";
import { siteMetadata } from "@/lib/seo";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

type AutomationPageParams = {
  slug: string;
};

type AutomationPageProps = {
  params?: Promise<AutomationPageParams>;
};

export default async function AutomationOgImage({
  params,
}: AutomationPageProps) {
  const resolvedParams = params ? await params : null;
  const slug = resolvedParams?.slug;

  if (!slug) {
    return renderFallback("Automation not found");
  }

  const automation = await getAutomationBySlug(slug);

  if (!automation) {
    return renderFallback("Automation not found");
  }

  const summary = truncate(
    automation.summary ??
      automation.description?.replace(/\s+/g, " ").trim() ??
      "",
    180
  );

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(circle at 20% -10%, rgba(139, 92, 246, 0.5), transparent 55%), radial-gradient(circle at 80% 10%, rgba(56, 189, 248, 0.45), transparent 55%), linear-gradient(135deg, #0f172a 0%, #111827 45%, #1e293b 100%)",
          color: "#f8fafc",
          fontFamily: "Geist, 'DM Sans', 'Inter', system-ui, sans-serif",
          position: "relative",
          padding: 64,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 32,
            borderRadius: 32,
            border: "1px solid rgba(148, 163, 184, 0.25)",
            backdropFilter: "blur(12px)",
          }}
        />
        <div
          style={{
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            gap: 36,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 22px",
                borderRadius: 999,
                backgroundColor: "rgba(15, 23, 42, 0.45)",
                border: "1px solid rgba(148, 163, 184, 0.35)",
                fontSize: 26,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {siteMetadata.shortName}
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "100%",
                  backgroundColor: "rgba(148, 163, 184, 0.65)",
                }}
              />
              Automation spotlight
            </span>
            <h1
              style={{
                fontSize: 78,
                fontWeight: 600,
                lineHeight: 1.05,
                maxWidth: "880px",
              }}
            >
              {automation.title}
            </h1>
          </div>
          {summary ? (
            <p
              style={{
                fontSize: 34,
                lineHeight: 1.4,
                color: "rgba(226, 232, 240, 0.9)",
                maxWidth: "840px",
              }}
            >
              {summary}
            </p>
          ) : null}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 32,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 18,
                flexWrap: "wrap",
                color: "rgba(226, 232, 240, 0.9)",
                fontSize: 30,
              }}
            >
              {automation.tags?.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 999,
                    border: "1px solid rgba(148, 163, 184, 0.3)",
                    backgroundColor: "rgba(15, 23, 42, 0.55)",
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 22px",
                borderRadius: 16,
                border: "1px solid rgba(148, 163, 184, 0.3)",
                backgroundColor: "rgba(15, 23, 42, 0.6)",
                fontSize: 30,
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "100%",
                  backgroundColor: "rgba(56, 189, 248, 0.8)",
                  boxShadow: "0 0 20px rgba(56, 189, 248, 0.8)",
                }}
              />
              {automation.vote_total ?? 0} community votes
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

function renderFallback(message: string) {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(135deg, #0f172a 0%, #1f2937 50%, #111827 100%)",
          color: "#f8fafc",
          fontFamily: "Geist, 'DM Sans', 'Inter', system-ui, sans-serif",
          fontSize: 48,
        }}
      >
        {message}
      </div>
    ),
    { ...size }
  );
}

function truncate(value: string, maxLength: number) {
  if (!value) {
    return "";
  }
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}
