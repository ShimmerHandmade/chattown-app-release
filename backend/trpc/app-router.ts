import { createTRPCRouter } from "./create-context";
import signupRoute from "./routes/auth/signup/route";
import loginRoute from "./routes/auth/login/route";
import logoutRoute from "./routes/auth/logout/route";
import deleteAccountRoute from "./routes/auth/delete-account/route";
import meRoute from "./routes/auth/me/route";
import createRoomRoute from "./routes/rooms/create/route";
import joinRoomRoute from "./routes/rooms/join/route";
import listRoomsRoute from "./routes/rooms/list/route";
import deleteRoomRoute from "./routes/rooms/delete/route";
import roomMembersRoute from "./routes/rooms/members/route";
import removeUserRoute from "./routes/rooms/remove-user/route";
import sendMessageRoute from "./routes/messages/send/route";
import listMessagesRoute from "./routes/messages/list/route";
import registerTokenRoute from "./routes/notifications/register-token/route";
import forgotPasswordRoute from "./routes/auth/forgot-password/route";
import resetPasswordRoute from "./routes/auth/reset-password/route";

export const appRouter = createTRPCRouter({
  auth: createTRPCRouter({
    signup: signupRoute,
    login: loginRoute,
    logout: logoutRoute,
    deleteAccount: deleteAccountRoute,
    me: meRoute,
    forgotPassword: forgotPasswordRoute,
    resetPassword: resetPasswordRoute,
  }),
  rooms: createTRPCRouter({
    create: createRoomRoute,
    join: joinRoomRoute,
    list: listRoomsRoute,
    delete: deleteRoomRoute,
    members: roomMembersRoute,
    removeUser: removeUserRoute,
  }),
  messages: createTRPCRouter({
    send: sendMessageRoute,
    list: listMessagesRoute,
  }),
  notifications: createTRPCRouter({
    registerToken: registerTokenRoute,
  }),
});

console.log("[App Router] Router initialized");
console.log("[App Router] forgotPassword route exists:", !!forgotPasswordRoute);
console.log("[App Router] All procedures:", Object.keys(appRouter._def.procedures));

export type AppRouter = typeof appRouter;
