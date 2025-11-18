import { protectedProcedure } from "../../../create-context";
import { z } from "zod";
import { db } from "../../../../db";

export default protectedProcedure
  .input(z.object({ roomId: z.string() }))
  .query(async ({ input }) => {
    const messages = await db.getMessagesByRoomId(input.roomId);
    return messages;
  });
