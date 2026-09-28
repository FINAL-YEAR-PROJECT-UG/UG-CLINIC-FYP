import axios from "axios";
import NextAuth, { type DefaultSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

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

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email or student ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!apiBaseUrl || !credentials?.email || !credentials.password) {
          return null;
        }

        try {
          const response = await axios.post(`${apiBaseUrl}/auth/login`, {
            username: credentials.email,
            password: credentials.password,
          });
          const user = response.data?.data?.user ?? response.data?.user;
          const setCookies = response.headers["set-cookie"];
          const backendSessionCookie = Array.isArray(setCookies)
            ? setCookies.map((cookie) => cookie.split(";", 1)[0]).join("; ")
            : undefined;

          if (!response.data?.success || !user?.id || !backendSessionCookie) {
            return null;
          }

          return {
            ...user,
            id: String(user.id),
            backendSessionCookie,
          };
        } catch {
          return null;
        }
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

export default NextAuth(authOptions);
