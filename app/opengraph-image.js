import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "FIR Turel — Banco de preguntas oficiales FIR";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#047857",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 800 }}>FIR Turel</div>
        <div style={{ fontSize: 32, marginTop: 20, opacity: 0.9 }}>
          Preguntas FIR oficiales · Respuestas verificadas
        </div>
      </div>
    ),
    { ...size }
  );
}
