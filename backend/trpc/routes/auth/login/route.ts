import { publicProcedure } from "../../../create-context";
import { z } from "zod";
import { db } from "../../../../db";
import { TRPCError } from "@trpc/server";

export default publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    try {
      console.log("Login attempt for email:", input.email);
      
      const user = await db.findUserByEmail(input.email);
      
      if (!user || user.passwordHash !== input.password) {
        console.log("Invalid credentials for:", input.email);
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      const { passwordHash, ...userWithoutPassword } = user;
      const sessionId = await db.createSession(user.id);
      
      console.log("Login successful for user:", user.id);

      return {
        user: userWithoutPassword,
        sessionId,
      };
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to login",
      });
    }
  });
