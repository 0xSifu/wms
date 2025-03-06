// Protecting routes with next-auth
// https://next-auth.js.org/configuration/nextjs#middleware
// https://nextjs.org/docs/app/building-your-application/routing/middleware

import NextAuth from 'next-auth';
import authConfig from './auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const BASE_URL =
    process.env.NEXT_PUBLIC_BASE_URL || 'http://103.174.115.64:3000';

  if (!isLoggedIn) {
    const signInUrl = new URL('/', BASE_URL);
    return Response.redirect(signInUrl);
  }
});

export const config = { matcher: ['/dashboard/:path*'] };
