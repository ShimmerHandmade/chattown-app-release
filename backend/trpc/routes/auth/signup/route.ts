import { publicProcedure } from "../../../create-context";
import { z } from "zod";
import { db } from "../../../../db";
import { TRPCError } from "@trpc/server";

export default publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().min(1),
    })
  )
  .mutation(async ({ input }) => {
    try {
      console.log("Signup attempt for email:", input.email);
      
      const existingUser = await db.findUserByEmail(input.email);
      
      if (existingUser) {
        console.log("Email already exists:", input.email);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email already in use",
        });
      }

      const user = await db.createUser(input.email, input.password, input.name);
      const sessionId = await db.createSession(user.id);
      
      console.log("Signup successful for user:", user.id);

      return {
        user,
        sessionId,
      };
    } catch (error) {
      console.error("Signup error:", error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create account",
      });
    }
  });
