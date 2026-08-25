import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import axios from "axios";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    user?: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      studentId?: string;
      phone?: string;
      program?: string;
      role: string;
      isActive: boolean;
    };
  }
  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    studentId?: string;
    phone?: string;
    program?: string;
    role: string;
    isActive: boolean;
    accessToken: string;
    refreshToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    user?: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      studentId?: string;
      phone?: string;
      program?: string;
      role: string;
      isActive: boolean;
    };
  }
}

// Get API base URL for server side
const getServerApiBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3005/api";
};

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const res = await axios.post(`${getServerApiBaseUrl()}/auth/login`, {
            username: credentials?.username,
            password: credentials?.password,
          });

          if (res.data.success) {
            const { user, tokens } = res.data.data;
            return {
              ...user,
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
            };
          }
          return null;
        } catch (error) {
          console.error("Login error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1 day
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.user) {
        session.user = token.user as any;
        session.accessToken = token.accessToken;
        session.refreshToken = token.refreshToken;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
