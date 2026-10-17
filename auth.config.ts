import type { NextAuthConfig } from "next-auth";
import { parseOptionalUrl } from "@/lib/validation";

/**
 * auth.config.ts — Edge-safe config (không import Prisma).
 * Dùng cho proxy.ts (middleware) và được re-export vào auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
    error:  "/login",
  },
  session: { strategy: "jwt" as const },
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id        = user.id;
        token.role      = (user as { role: string }).role;
        token.avatarUrl = (user as { avatarUrl?: string }).avatarUrl;
      }
      // useSession().update({ name, avatarUrl }) — payload comes from the client,
      // so only these two display fields are copied; role/id are never taken from it.
      if (trigger === "update" && session && typeof session === "object") {
        const { name, avatarUrl } = session as { name?: unknown; avatarUrl?: unknown };
        if (typeof name === "string" && name.trim()) token.name = name.trim();
        if ("avatarUrl" in session) {
          const url = parseOptionalUrl(avatarUrl);
          if (url !== undefined) token.avatarUrl = url ?? undefined;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id        = token.id as string;
        session.user.role      = token.role as string;
        session.user.avatarUrl = token.avatarUrl as string | undefined;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
