import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            /** The user's unique identifier */
            id: string
            /** Whether the user has admin privileges */
            isAdmin: boolean
            telegramChatId?: string | null
        } & DefaultSession["user"]
    }

    interface User {
        id: string
        passwordHash?: string
        isAdmin: boolean
        telegramChatId?: string | null
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        /** OpenID ID Token */
        idToken?: string
        /** Whether the user has admin privileges */
        isAdmin?: boolean
        telegramChatId?: string | null
        sub?: string
    }
}
