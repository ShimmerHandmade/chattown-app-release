export interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
  roomId: string;
}

export interface Room {
  id: string;
  name: string;
  code: string;
  createdAt: number;
  messages: Message[];
}

export interface User {
  id: string;
  name: string;
  email?: string;
  bio?: string;
  avatarColor: string;
}
