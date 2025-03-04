import { NextAuthConfig } from 'next-auth';
import CredentialProvider from 'next-auth/providers/credentials';
import GithubProvider from 'next-auth/providers/github';

const authConfig = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID ?? '',
      clientSecret: process.env.GITHUB_SECRET ?? ''
    }),
    CredentialProvider({
      credentials: {
        email: {
          type: 'email'
        },
        password: {
          type: 'password'
        }
      },
      async authorize(credentials, req) {
        const response = await fetch(
          `${process.env.AUTH_URL_DEV}/api/v1/auth/login`,
          {
            method: 'POST',
            body: JSON.stringify(credentials),
            headers: { 'Content-Type': 'application/json' }
          }
        );

        const data = await response.json();

        if (response.ok && data) {
          return {
            ...data.data.user,
            accessToken: data.data.accessToken,
            refreshToken: data.data.refreshToken
          };
        } else {
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = token.user as any;

      return session;
    }
  },
  pages: {
    signIn: '/' //sigin page
  },
  trustHost: true
} satisfies NextAuthConfig;

export default authConfig;
