import type { NextApiRequest, NextApiResponse } from "next";
import NextAuth, { type DefaultSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";

declare module "next-auth" {
  interface User {
    firstName?: string;
    lastName?: string;
    studentId?: string;
    phone?: string;
    program?: string;
    role?: string;
    isActive?: boolean;
    backendSessionCookie?: string;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      firstName?: string;
      lastName?: string;
      studentId?: string;
      phone?: string;
      program?: string;
      role?: string;
      isActive?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user?: {
      id: string;
      email?: string | null;
      firstName?: string;
      lastName?: string;
      studentId?: string;
      phone?: string;
      program?: string;
      role?: string;
      isActive?: boolean;
    };
    backendSessionCookie?: string;
  }
}

const createCredentialsProvider =
  typeof CredentialsProvider === "function"
    ? CredentialsProvider
    : ((CredentialsProvider as any)?.default as typeof CredentialsProvider);

export const authOptions: NextAuthOptions = {
  providers: [
    createCredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email or student ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const email = credentials.email.trim();
        const password = credentials.password;

        // Vercel app authenticates against Supabase only (no Railway/Prisma login).
        const supabaseUrl =
          process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey =
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
          process.env.SUPABASE_ANON_KEY ||
          process.env.SUPABASE_PUBLISHABLE_KEY;

        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          });

          const { data: sbData, error: sbError } =
            await supabase.auth.signInWithPassword({ email, password });

          if (sbError) {
            const msg = sbError.message?.toLowerCase() ?? "";
            if (msg.includes("email not confirmed") || msg.includes("email_not_confirmed")) {
              // Surface this so the login page shows the right message
              throw new Error(
                "Email not confirmed. Please check your inbox and verify your email before logging in."
              );
            }
            // Wrong password / user not found — return null for generic "login failed"
            console.error("[NextAuth] Supabase signIn error:", sbError.message);
            return null;
          }

          if (sbData?.user) {
            const sbUser = sbData.user;
            return {
              id: String(sbUser.id),
              email: sbUser.email || email,
              firstName: sbUser.user_metadata?.firstName || "Student",
              lastName: sbUser.user_metadata?.lastName || "",
              studentId: sbUser.user_metadata?.studentId,
              phone: sbUser.user_metadata?.phone,
              program: sbUser.user_metadata?.program,
              role:
                sbUser.app_metadata?.role ||
                sbUser.user_metadata?.role ||
                "STUDENT",
              isActive: true,
              backendSessionCookie:
                sbData.session?.access_token || "supabase-session",
            };
          }
        } else {
          console.error("[NextAuth] Supabase env vars not configured.");
        }

        return null;
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          studentId: user.studentId,
          phone: user.phone,
          program: user.program,
          role: user.role,
          isActive: user.isActive,
        };
        token.backendSessionCookie = user.backendSessionCookie;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.user) {
        session.user = { ...session.user, ...token.user };
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

const nextAuthFactory =
  typeof NextAuth === "function"
    ? NextAuth
    : ((NextAuth as any)?.default as typeof NextAuth);

const nextAuthHandler = nextAuthFactory(authOptions);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Intercept any GET request directed to the NextAuth callback route (e.g., Supabase email confirmations
  // or legacy email verification links pointing to /api/auth/callback or /api/auth/callback/credentials).
  // NextAuth credentials provider only accepts POST submissions and will throw:
  // "Callback for provider type credentials not supported".
  // We forward these to the application's dedicated client-side callback page (/auth/callback).
  if (req.method === "GET") {
    const nextauth = req.query.nextauth;
    const isCallback = Array.isArray(nextauth)
      ? nextauth[0] === "callback"
      : nextauth === "callback";

    if (isCallback) {
      const queryString = req.url && req.url.includes("?")
        ? req.url.slice(req.url.indexOf("?"))
        : "";
      return res.redirect(307, `/auth/callback${queryString}`);
    }
  }

  try {
    return await nextAuthHandler(req, res);
  } catch (error: any) {
    if (
      error?.message?.includes("Callback for provider type credentials not supported") ||
      String(error).includes("credentials not supported")
    ) {
      const queryString = req.url && req.url.includes("?")
        ? req.url.slice(req.url.indexOf("?"))
        : "";
      return res.redirect(307, `/auth/callback${queryString}`);
    }
    throw error;
  }
}
