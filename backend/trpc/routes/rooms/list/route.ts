import { protectedProcedure } from "../../../create-context";
import { db } from "../../../../db";

export default protectedProcedure.query(async ({ ctx }) => {
  const rooms = await db.getRoomsByUserId(ctx.user.id);
  return rooms;
});
