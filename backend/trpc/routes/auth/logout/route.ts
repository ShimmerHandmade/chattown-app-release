import { protectedProcedure } from "../../../create-context";
import { db } from "../../../../db";

export default protectedProcedure.mutation(async ({ ctx }) => {
  await db.deleteSession(ctx.sessionId);
  return { success: true };
});
