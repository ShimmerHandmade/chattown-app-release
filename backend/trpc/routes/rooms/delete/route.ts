import { protectedProcedure } from "../../../create-context";
import { z } from "zod";
import { db } from "../../../../db";

export default protectedProcedure
  .input(z.object({ roomId: z.string() }))
  .mutation(async ({ input }) => {
    await db.deleteRoom(input.roomId);
    return { success: true };
  });
