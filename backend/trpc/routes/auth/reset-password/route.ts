import { publicProcedure } from "../../../create-context";
import { z } from "zod";
import { db } from "../../../../db";
import { TRPCError } from "@trpc/server";

const resetPasswordProcedure = publicProcedure
  .input(
    z.object({
      token: z.string(),
      newPassword: z.string().min(6),
    })
  )
  .mutation(async ({ input }) => {
    try {
      console.log("Password reset attempt with token");
      
      const userId = await db.validateResetToken(input.token);
      
      if (!userId) {
        console.log("Invalid or expired reset token");
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired reset token",
        });
      }

      await db.updatePassword(userId, input.newPassword);
      await db.deleteResetToken(input.token);
      
      console.log("Password reset successful for user:", userId);

      return { 
        success: true, 
        message: "Password has been reset successfully" 
      };
    } catch (error) {
      console.error("Reset password error:", error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to reset password",
      });
    }
  });

export default resetPasswordProcedure;
