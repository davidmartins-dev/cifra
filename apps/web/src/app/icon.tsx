import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#09090b",
          borderRadius: "8px",
          border: "1px solid rgba(16, 185, 129, 0.4)",
          fontWeight: 800,
          fontFamily: "sans-serif",
          fontSize: 20,
          color: "#ffffff",
        }}
      >
        <span>C</span>
        <span style={{ color: "#10b981", marginLeft: "1px" }}>.</span>
      </div>
    ),
    {
      ...size,
    }
  );
}
