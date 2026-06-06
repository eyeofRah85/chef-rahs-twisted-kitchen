import type { DefaultSession } from "next-auth";
import type { UserRoleValue } from "@/lib/prisma-enums";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      role?: UserRoleValue;
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRoleValue;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRoleValue;
  }
}
