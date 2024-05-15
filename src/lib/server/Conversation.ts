import { prisma } from "./prismaClientInstance";

export async function createConversation() {
  return await prisma.conversation.create({
    data: {},
  });
}

export async function upsertConversation(id: string) {
  return await prisma.conversation.upsert({
    where: { id },
    create: {
      id,
    },
    update: { id },
  });
}
