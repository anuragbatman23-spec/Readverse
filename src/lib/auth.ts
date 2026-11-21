import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { findUserByEmail, findUserByEmailAsync, verifyPassword, createUser } from "./userDb";
import { saveAdminDriveConfig } from "./gdriveStorage";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password.");
        }

        const user = await findUserByEmailAsync(credentials.email);
        if (!user) {
          throw new Error("No account found with this email. Please sign up.");
        }

        if (!user.passwordHash) {
          throw new Error("This account was created with Google. Please use Continue with Google.");
        }

        const isValid = await verifyPassword(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Invalid password. Please check your credentials.");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image || null,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        // Upsert Google user into local database if not exists
        const existing = findUserByEmail(user.email);
        if (!existing) {
          createUser({
            name: user.name || "Reader",
            email: user.email,
            image: user.image || "",
            provider: "google",
          });
        }

        // Automatically capture and persist admin Google Drive refresh token for central storage
        if (account.refresh_token) {
          const adminEmails = [
            'anurag.batman23@gmail.com',
            'anurag.batman5@gmail.com',
            'admin@readverse.io'
          ];
          const isCandidateAdmin =
            adminEmails.includes(user.email.toLowerCase()) ||
            user.email.toLowerCase().includes('anurag.batman') ||
            user.email.toLowerCase().startsWith('admin');

          if (isCandidateAdmin) {
            try {
              await saveAdminDriveConfig({
                refreshToken: account.refresh_token,
                folderId: '1fX2VjFzl1aP-pOHwsCk2FDU3Ksf-JzOz',
                email: user.email
              });
              console.log(`[NextAuth] Admin Google Drive successfully linked for ${user.email}`);
            } catch (err) {
              console.warn('[NextAuth] Could not auto-save admin Drive config:', err);
            }
          }
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session?.user && token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "readverse-development-secret-key-321",
};
