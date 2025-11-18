import { protectedProcedure } from "../../../create-context";
import { z } from "zod";
import { db } from "../../../../db";

export default protectedProcedure
  .input(z.object({ roomId: z.string(), userId: z.string() }))
  .mutation(async ({ input }) => {
    await db.removeUserFromRoom(input.roomId, input.userId);
    return { success: true };
  });
