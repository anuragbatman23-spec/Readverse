import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const redirectUri = `${url.origin}/api/auth/callback/google`;
  const clientId = process.env.GOOGLE_CLIENT_ID || "";

  if (!clientId) {
    return NextResponse.json({ error: "Missing GOOGLE_CLIENT_ID environment variable" }, { status: 500 });
  }

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "https://www.googleapis.com/auth/drive.file email profile openid");
  googleAuthUrl.searchParams.set("access_type", "offline");
  googleAuthUrl.searchParams.set("prompt", "consent");
  googleAuthUrl.searchParams.set("state", "admin_drive_link");

  return NextResponse.redirect(googleAuthUrl.toString());
}
