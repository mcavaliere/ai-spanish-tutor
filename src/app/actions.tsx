import { createAI, createStreamableValue, getAIState } from "ai/rsc";
import { ReactNode } from "react";
import { getMutableAIState } from "ai/rsc";
import { generateText, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { nanoid } from "nanoid";
import { saveChatMessages } from "@/lib/server/ChatMessage";
import { ChatMessageRole, Conversation } from "@prisma/client";
import { upsertConversation } from "@/lib/server/Conversation";

export interface ServerMessage {
  role: "user" | "assistant" | "function" | "system";
  content: string;
}

export type ClientMessage = string;

// Define the AI state and UI state types
export type AIState = {
  conversationId?: Conversation["id"];
  messages: ServerMessage[];
};

export type UIState = {
  conversationId?: Conversation["id"];
  messages: ClientMessage[];
};

const initialAIState: AIState = {
  messages: [],
};

// The initial UI state that the client will keep track of.
const initialUIState: UIState = {
  messages: [],
};

async function sendMessage(message: string) {
  "use server";

  const chatStream = createStreamableValue("");

  const history = getMutableAIState();

  const existingHistory: AIState = history.get();

  // Add the user message to the chat history.
  const messages = [
    ...existingHistory.messages,
    { role: "user", content: message },
  ];

  console.log(`---------------- updating history:  `, messages);

  // Update the AI state with the new user message.
  history.update({
    messages,
  });

  // Generate a response from the model using the chat history.
  streamText({
    model: openai("gpt-4o"),
    messages: history.get().messages,
  }).then(async (result) => {
    try {
      for await (const value of result.textStream) {
        chatStream.append(value);
      }
    } finally {
      chatStream.done();

      const messages = [
        ...history.get().messages,
        { role: "assistant", content: chatStream.value.curr },
      ];

      console.log(`---------------- final history:  `, messages);

      history.done({
        conversationId: existingHistory.conversationId,
        messages,
      });
    }
  });

  return {
    chatStream: chatStream.value,
  };
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
});
