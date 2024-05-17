import { ChatMessage, Conversation } from "@prisma/client";
import { prisma } from "./prismaClientInstance";
import { Prisma } from "@prisma/client";

export async function saveChatMessages(
  conversationId: Conversation["id"],
  messages: Prisma.AtLeast<Prisma.ChatMessageCreateManyInput, "id">[]
) {
  return await prisma.chatMessage.createMany({
    data: messages.map((m) => ({
      ...m,
      conversationId,
    })),
    skipDuplicates: true,
  });
}

export async function getChatHistory(conversationId: Conversation["id"]) {
  return (await prisma.chatMessage.findMany({
    where: {
      conversationId,
    },
  })) as ChatMessage[];
}
