import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { findUserByEmail, findUserByEmailAsync, verifyPassword, createUser } from "./userDb";

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
      }
      return true;
    },
    async session({ session, token }) {
      if (session?.user && token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "readverse-development-secret-key-321",
};
