import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authConfig } from "@/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email:    { label: "Email",      type: "email" },
        password: { label: "Mật khẩu",  type: "password" },
      },
      async authorize(credentials) {
        if (typeof credentials?.email !== "string" || typeof credentials?.password !== "string") return null;
        if (!credentials.email || !credentials.password) return null;

        const user = await prisma.user.findUnique({
          // Register lưu email đã lowercase + trim — chuẩn hoá giống vậy khi đăng nhập
          where: { email: credentials.email.toLowerCase().trim() },
          select: {
            id: true, email: true, name: true,
            passwordHash: true, role: true, avatarUrl: true,
          },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id:        user.id,
          email:     user.email,
          name:      user.name,
          role:      user.role,
          avatarUrl: user.avatarUrl ?? undefined,
        };
      },
    }),
  ],
});
