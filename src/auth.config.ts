import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (token?.sub && session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).image = token.picture;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as any).role;
        token.picture = (user as any).image;
      }
      return token;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminRoute = nextUrl.pathname.startsWith('/admin');

      if (isAdminRoute) {
        if (!isLoggedIn) {
          // Not logged in — redirect to login
          return Response.redirect(new URL('/auth/login', nextUrl));
        }
        const role = ((auth.user as any).role || '').toLowerCase();
        return role === 'admin'; // accepts 'admin', 'ADMIN', etc.
      }
      return true;
    },
  },
  providers: [], // Providers are added in the main auth.ts to keep this file edge-safe if needed
} satisfies NextAuthConfig;
