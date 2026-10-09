import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const title = (new URL(request.url).searchParams.get("title") ?? "Makina Trafikskola").slice(0, 90);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0d0d0f",
          color: "#ffffff",
          padding: "64px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "999px", background: "#f5b429" }} />
          <div style={{ fontSize: "28px", fontWeight: 800 }}>Makina</div>
        </div>
        <div style={{ fontSize: "64px", fontWeight: 800, lineHeight: 1.05, maxWidth: "900px" }}>{title}</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
