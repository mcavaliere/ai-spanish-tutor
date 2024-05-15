import { createAI, getAIState } from "ai/rsc";
import { ReactNode } from "react";
import { getMutableAIState } from "ai/rsc";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { nanoid } from "nanoid";
import { saveChatMessages } from "@/lib/server/ChatMessage";
import { ChatMessageRole, Conversation } from "@prisma/client";
import { upsertConversation } from "@/lib/server/Conversation";

export interface ServerMessage {
  role: "user" | "assistant" | "function" | "system";
  content: string;
}

export interface ClientMessage {
  id: string;
  role: "user" | "assistant" | "function";
  display: ReactNode;
}

// Define the AI state and UI state types
export type AIState = {
  conversationId?: Conversation["id"];
  messages: ServerMessage[];
};

// export type UIState = Array<{
//   id: string;
//   role: "user" | "assistant";
//   display: ReactNode;
// }>;

const initialAIState: AIState = {
  messages: [],
};

// The initial UI state that the client will keep track of.
const initialUIState: {
  id: number;
  display: React.ReactNode;
}[] = [];

async function sendMessage(message: string) {
  "use server";

  const history = getMutableAIState();

  console.log(`---------------- history.get: `, history.get());

  const existingHistory = history.get();

  // Add the user message to the chat history.
  const messages = [
    ...existingHistory.messages,
    { role: "user", content: message },
  ];

  console.log(`---------------- 1 `);

  // Update the AI state with the new user message.
  history.update({
    messages,
  });

  // Generate a response from the model using the chat history.
  const response = await generateText({
    model: openai("gpt-3.5-turbo"),
    messages: history.get().messages,
  });

  // Update the AI state again with the response from the model.
  history.done({
    conversationId: existingHistory.conversationId,
    messages: [
      ...history.get().messages,
      { role: "assistant", content: response.text },
    ],
  });

  return history.get();
}

// Create the AI provider with the initial states and allowed actions
export const AI = createAI({
  actions: {
    sendMessage,
  },
  initialAIState,
  initialUIState,
  onSetAIState: async ({ state, done }) => {
    "use server";

    console.log(`---------------- onSetAIState state:  `, state);

    if (done) {
      if (!state.conversationId) {
        console.log(`---------------- onSetAIState no conversationId found.`);
        return;
      }

      await upsertConversation(state.conversationId);

      await saveChatMessages(
        state.conversationId,
        state.messages.map(({ role, content }) => ({
          role: role as ChatMessageRole,
          content,
        }))
      );
    }
  },
  onGetUIState: async () => {
    "use server";

    const history: ServerMessage[] = getAIState();

    console.log(`---------------- onGetUIState history:  `, history);

    return history;
  },
});
