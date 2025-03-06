import { NextAuthConfig } from 'next-auth';
import CredentialProvider from 'next-auth/providers/credentials';
import GithubProvider from 'next-auth/providers/github';

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || 'http://103.174.115.64:3000';

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
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true'
            }
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
    signIn: '/' //signin page
  },
  trustHost: true
} satisfies NextAuthConfig;

// Export config with base URL
export const authOptions = {
  ...authConfig,
  basePath: BASE_URL
};

export default authConfig;
