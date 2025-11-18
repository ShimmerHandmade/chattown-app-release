import { protectedProcedure } from "../../../create-context";
import { z } from "zod";
import { db } from "../../../../db";

export default protectedProcedure
  .input(z.object({ roomId: z.string() }))
  .query(async ({ input }) => {
    const members = await db.getRoomMembers(input.roomId);
    return members;
  });
