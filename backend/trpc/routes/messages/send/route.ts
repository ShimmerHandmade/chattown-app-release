import { protectedProcedure } from "../../../create-context";
import { z } from "zod";
import { db } from "../../../../db";
import { sendPushNotification } from "../../../../utils/send-push-notification";

export default protectedProcedure
  .input(z.object({ roomId: z.string(), text: z.string().min(1) }))
  .mutation(async ({ ctx, input }) => {
    const message = await db.sendMessage(input.roomId, ctx.user.id, input.text);
    
    const room = await db.findRoomById(input.roomId);
    const members = await db.getRoomMembers(input.roomId);
    
    const notificationPromises = members
      .filter(member => member.id !== ctx.user.id)
      .map(member => 
        sendPushNotification(
          member.id,
          room?.name || "New Message",
          `${ctx.user.name}: ${input.text}`,
          {
            roomId: input.roomId,
            type: "new_message"
          }
        )
      );
    
    await Promise.allSettled(notificationPromises);
    
    return message;
  });
