import { ImageResponse } from "next/og";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const width = Number(searchParams.get("w"));
  const height = Number(searchParams.get("h"));

  if (!width || !height || width > 4000 || height > 4000) {
    return NextResponse.json({ error: "Invalid dimensions" }, { status: 400 });
  }

  // Determine theme from query param, default to dark
  const theme = searchParams.get("theme") === "light" ? "light" : "dark";
  const bgColor = theme === "dark" ? "#1a1a1a" : "#ffffff";

  // Fetch the icon from the same origin
  const iconUrl = new URL("/icon-512x512.png", request.url);
  const iconRes = await fetch(iconUrl);
  const iconBuffer = await iconRes.arrayBuffer();
  const iconBase64 = `data:image/png;base64,${Buffer.from(iconBuffer).toString("base64")}`;

  const iconSize = Math.min(width, height) * 0.25;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: bgColor,
      }}
    >
      {/** biome-ignore lint/performance/noImgElement: ImageResponse no support for next/image */}
      <img
        src={iconBase64}
        alt=""
        width={iconSize}
        height={iconSize}
        style={{ borderRadius: iconSize * 0.2 }}
      />
    </div>,
    {
      width,
      height,
    },
  );
}
