import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { db } from "./db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as never,
  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 minutes — token expires after inactivity
    updateAge: 5 * 60, // refresh the token at most every 5 minutes of activity
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.hashedPassword) return null;

        const isValid = await bcrypt.compare(credentials.password, user.hashedPassword);
        if (!isValid) return null;

        // Require a verified email before allowing password login.
        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          plan: user.plan,
          role: user.role,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    ...(process.env.GITHUB_CLIENT_ID
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.plan = (user as { plan?: string }).plan ?? "FREE";
        token.role = (user as { role?: string }).role ?? "USER";
      }
      // OAuth logins don't pass `plan`/`role` on `user`; backfill from DB once.
      if (token.id && !token.role) {
        const dbUser = await db.user.findUnique({ where: { id: token.id as string } });
        token.plan = dbUser?.plan ?? "FREE";
        token.role = dbUser?.role ?? "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.plan = token.plan as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  events: {
    // New OAuth (Google) users: email is already verified by the provider,
    // and they need a preferences row like credential signups get.
    async createUser({ user }) {
      await db.userPreferences.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
      });
      // OAuth provider already verified the email — mark it so login isn't blocked.
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      plan: string;
      role: string;
    };
  }
}
