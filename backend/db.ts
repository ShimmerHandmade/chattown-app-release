import { User, Room, Message } from "../types/chat";

interface RoomMember {
  roomId: string;
  userId: string;
  joinedAt: number;
}

export class Database {
  private users: Map<string, User & { passwordHash: string }> = new Map();
  private rooms: Map<string, Room> = new Map();
  private messages: Map<string, Message[]> = new Map();
  private roomMembers: Map<string, RoomMember[]> = new Map();
  private userSessions: Map<string, string> = new Map();
  private pushTokens: Map<string, string[]> = new Map();
  private resetTokens: Map<string, { userId: string; expiresAt: number }> = new Map();

  generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2, 9);
  }

  generateCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  generateAvatarColor(): string {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#FFA07A",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E2",
      "#F8B88B",
      "#A8E6CF",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  async createUser(
    email: string,
    passwordHash: string,
    name: string
  ): Promise<User> {
    const userId = this.generateId();
    const user: User = {
      id: userId,
      email,
      name,
      bio: "",
      avatarColor: this.generateAvatarColor(),
    };

    this.users.set(userId, { ...user, passwordHash });
    return user;
  }

  async findUserByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async findUserById(id: string): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;
    
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async deleteUser(userId: string): Promise<void> {
    this.users.delete(userId);
    this.userSessions.delete(userId);
  }

  async createSession(userId: string): Promise<string> {
    const sessionId = this.generateId();
    this.userSessions.set(sessionId, userId);
    return sessionId;
  }

  async getUserBySession(sessionId: string): Promise<User | null> {
    const userId = this.userSessions.get(sessionId);
    if (!userId) return null;
    return this.findUserById(userId);
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.userSessions.delete(sessionId);
  }

  async createRoom(name: string, creatorId: string): Promise<Room> {
    const roomId = this.generateId();
    const room: Room = {
      id: roomId,
      name,
      code: this.generateCode(),
      createdAt: Date.now(),
      messages: [],
    };

    this.rooms.set(roomId, room);
    this.messages.set(roomId, []);
    this.roomMembers.set(roomId, [
      { roomId, userId: creatorId, joinedAt: Date.now() },
    ]);

    return room;
  }

  async findRoomByCode(code: string): Promise<Room | null> {
    for (const room of this.rooms.values()) {
      if (room.code.toLowerCase() === code.toLowerCase()) {
        return room;
      }
    }
    return null;
  }

  async findRoomById(id: string): Promise<Room | null> {
    return this.rooms.get(id) || null;
  }

  async joinRoom(roomId: string, userId: string): Promise<void> {
    const members = this.roomMembers.get(roomId) || [];
    const alreadyMember = members.some((m) => m.userId === userId);
    
    if (!alreadyMember) {
      members.push({ roomId, userId, joinedAt: Date.now() });
      this.roomMembers.set(roomId, members);
    }
  }

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    const members = this.roomMembers.get(roomId) || [];
    const updatedMembers = members.filter((m) => m.userId !== userId);
    this.roomMembers.set(roomId, updatedMembers);
  }

  async getRoomsByUserId(userId: string): Promise<Room[]> {
    const userRooms: Room[] = [];
    
    for (const [roomId, members] of this.roomMembers.entries()) {
      if (members.some((m) => m.userId === userId)) {
        const room = this.rooms.get(roomId);
        if (room) {
          const messages = this.messages.get(roomId) || [];
          userRooms.push({ ...room, messages });
        }
      }
    }

    return userRooms;
  }

  async deleteRoom(roomId: string): Promise<void> {
    this.rooms.delete(roomId);
    this.messages.delete(roomId);
    this.roomMembers.delete(roomId);
  }

  async sendMessage(
    roomId: string,
    userId: string,
    text: string
  ): Promise<Message> {
    const user = await this.findUserById(userId);
    if (!user) throw new Error("User not found");

    const message: Message = {
      id: this.generateId(),
      text,
      sender: user.name,
      timestamp: Date.now(),
      roomId,
    };

    const messages = this.messages.get(roomId) || [];
    messages.push(message);
    this.messages.set(roomId, messages);

    return message;
  }

  async getMessagesByRoomId(roomId: string): Promise<Message[]> {
    return this.messages.get(roomId) || [];
  }

  async getRoomMembers(roomId: string): Promise<User[]> {
    const members = this.roomMembers.get(roomId) || [];
    const users: User[] = [];

    for (const member of members) {
      const user = await this.findUserById(member.userId);
      if (user) {
        users.push(user);
      }
    }

    return users;
  }

  async removeUserFromRoom(roomId: string, userId: string): Promise<void> {
    await this.leaveRoom(roomId, userId);
  }

  async savePushToken(userId: string, token: string): Promise<void> {
    const tokens = this.pushTokens.get(userId) || [];
    if (!tokens.includes(token)) {
      tokens.push(token);
      this.pushTokens.set(userId, tokens);
    }
  }

  async getPushTokens(userId: string): Promise<string[]> {
    return this.pushTokens.get(userId) || [];
  }

  async removePushToken(userId: string, token: string): Promise<void> {
    const tokens = this.pushTokens.get(userId) || [];
    const filtered = tokens.filter(t => t !== token);
    this.pushTokens.set(userId, filtered);
  }

  async createResetToken(userId: string): Promise<string> {
    const token = this.generateId() + this.generateId();
    const expiresAt = Date.now() + 60 * 60 * 1000;
    this.resetTokens.set(token, { userId, expiresAt });
    return token;
  }

  async validateResetToken(token: string): Promise<string | null> {
    const tokenData = this.resetTokens.get(token);
    if (!tokenData) return null;
    
    if (tokenData.expiresAt < Date.now()) {
      this.resetTokens.delete(token);
      return null;
    }
    
    return tokenData.userId;
  }

  async deleteResetToken(token: string): Promise<void> {
    this.resetTokens.delete(token);
  }

  async updatePassword(userId: string, newPasswordHash: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.passwordHash = newPasswordHash;
      this.users.set(userId, user);
    }
  }
}

export const db = new Database();
