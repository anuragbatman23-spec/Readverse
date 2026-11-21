import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { saveAdminDriveConfig } from "@/lib/gdriveStorage";

const nextAuthHandler = NextAuth(authOptions);

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  // If this is the admin Google Drive connection callback
  if (url.pathname.includes("/callback/google") && url.searchParams.get("state") === "admin_drive_link") {
    const code = url.searchParams.get("code");
    if (!code) {
      return NextResponse.redirect(new URL("/profile?error=NoAuthCode", req.url));
    }

    try {
      const redirectUri = `${url.origin}/api/auth/callback/google`;
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID || "",
          client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error("[AdminDrive] Token exchange failed:", errText);
        return NextResponse.redirect(new URL(`/profile?error=TokenExchangeFailed`, req.url));
      }

      const tokenData = await tokenRes.json();
      const refreshToken = tokenData.refresh_token;

      if (refreshToken) {
        await saveAdminDriveConfig({
          refreshToken,
          folderId: "1fX2VjFzl1aP-pOHwsCk2FDU3Ksf-JzOz",
          email: "anurag.batman23@gmail.com",
        });
        console.log("[AdminDrive] Successfully linked admin Google Drive!");
        return NextResponse.redirect(new URL("/profile?drive_connected=true", req.url));
      } else {
        return NextResponse.redirect(new URL("/profile?drive_connected=already_linked", req.url));
      }
    } catch (err: any) {
      console.error("[AdminDrive] Error linking drive:", err);
      return NextResponse.redirect(new URL(`/profile?error=${encodeURIComponent(err.message)}`, req.url));
    }
  }

  // Standard NextAuth requests
  return nextAuthHandler(req as any, {} as any);
}

export async function POST(req: NextRequest) {
  return nextAuthHandler(req as any, {} as any);
}
