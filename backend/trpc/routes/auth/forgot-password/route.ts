import { publicProcedure } from "../../../create-context";
import { z } from "zod";
import { db } from "../../../../db";
import { TRPCError } from "@trpc/server";

const forgotPasswordProcedure = publicProcedure
  .input(
    z.object({
      email: z.string().email(),
    })
  )
  .mutation(async ({ input }) => {
    try {
      console.log("[forgotPassword] Starting - Email:", input.email);
      
      const user = await db.findUserByEmail(input.email);
      
      if (!user) {
        console.log("[forgotPassword] User not found for email:", input.email);
        return { 
          success: true, 
          message: "If this email is registered, you will receive password reset instructions." 
        };
      }

      await db.createResetToken(user.id);
      
      console.log("\n=== Password Reset Email ===");
      console.log(`To: ${user.email}`);
      console.log(`Subject: Password Reset Request`);
      console.log(`\nHello,\n`);
      console.log(`You requested a password reset for your account.`);
      console.log(`\nYour current login credentials are:`);
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.passwordHash}`);
      console.log(`\nIf you didn't request this, please ignore this email.`);
      console.log("=============================\n");

      console.log("[forgotPassword] Success");
      return { 
        success: true, 
        message: "Password reset instructions have been sent to your email.",
      };
    } catch (error) {
      console.error("[forgotPassword] Error:", error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to process password reset request",
      });
    }
  });

export default forgotPasswordProcedure;
