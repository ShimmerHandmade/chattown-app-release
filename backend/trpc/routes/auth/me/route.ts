import { protectedProcedure } from "../../../create-context";

export default protectedProcedure.query(async ({ ctx }) => {
  return ctx.user;
});
