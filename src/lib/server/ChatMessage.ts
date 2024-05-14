import { ChatMessage, Conversation } from "@prisma/client";
import { prisma } from "./prismaClientInstance";
import { Prisma } from "@prisma/client";
import { nanoid } from "nanoid";

export async function saveChatMessages(
  messages: Prisma.ChatMessageCreateManyInput[]
) {
  return await prisma.chatMessage.createMany({
    data: messages.map((m) => ({
      ...m,
    })),
  });
}

export async function getChatHistory() {
  return await prisma.chatMessage.findMany();
}
