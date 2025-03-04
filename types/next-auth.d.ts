import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User {
    id: string;
    username: string;
    email: string;
    lastLogin: string;
    isActive: boolean;
    isDelete: boolean;
    ipAddress: string | null;
    log: any[];
    isAccountAdmin: boolean;
    isAdmin: boolean;
    userStatus: string;
    userLanguage: string;
  }

  type UserSession = DefaultSession['user'];
  interface Session {
    accessToken: string;
    refreshToken: string;
    user: User;
    expires: string;
  }

  interface CredentialsInputs {
    email: string;
    password: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    idToken?: string;
    user: User;
  }
}
