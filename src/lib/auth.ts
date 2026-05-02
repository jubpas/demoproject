import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";

// --- Sign-in attempt rate limiter (in-memory, replace with Redis in production) ---
const signInAttempts = new Map<string, { count: number; resetAt: number }>();
const SIGNIN_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const SIGNIN_RATE_LIMIT_MAX = 20; // 20 attempts per window

function checkSignInRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = signInAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    signInAttempts.set(ip, { count: 1, resetAt: now + SIGNIN_RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= SIGNIN_RATE_LIMIT_MAX) {
    return false;
  }

  entry.count += 1;
  signInAttempts.set(ip, entry);
  return true;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    // Session expires after 30 minutes of inactivity
    maxAge: 30 * 60,
  },
  cookies: {
    sessionToken: {
      name: "__Secure-authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        // IP-based rate limiting for brute-force protection
        const ip = request?.headers?.get("x-forwarded-for") ?? request?.headers?.get("x-real-ip") ?? "unknown";
        if (!checkSignInRateLimit(typeof ip === "string" ? ip : "unknown")) {
          return null;
        }

        const email = (credentials?.email as string | undefined)?.trim().toLowerCase();
        const password = credentials?.password as string | undefined;
        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email,
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
