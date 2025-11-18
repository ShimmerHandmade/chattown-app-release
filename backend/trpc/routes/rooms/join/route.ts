import { protectedProcedure } from "../../../create-context";
import { z } from "zod";
import { db } from "../../../../db";
import { TRPCError } from "@trpc/server";

export default protectedProcedure
  .input(z.object({ code: z.string().min(1) }))
  .mutation(async ({ ctx, input }) => {
    let room = await db.findRoomByCode(input.code);

    if (!room) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Room not found",
      });
    }

    await db.joinRoom(room.id, ctx.user.id);
    
    const messages = await db.getMessagesByRoomId(room.id);
    return { ...room, messages };
  });
