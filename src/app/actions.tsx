import { createAI, createStreamableValue, getAIState } from "ai/rsc";
import { getMutableAIState } from "ai/rsc";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { nanoid } from "nanoid";
import { getChatHistory, saveChatMessages } from "@/lib/server/ChatMessage";
import { ChatMessageRole, Conversation } from "@prisma/client";
import { upsertConversation } from "@/lib/server/Conversation";

export interface ServerMessage {
  role: "user" | "assistant" | "system";
  content: string;
  id: string;
}

export type ClientMessage = {
  content: string;
  id: string;
};

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

  const chatStream = createStreamableValue<string>("");

  const history = getMutableAIState();

  const existingHistory: AIState = history.get();

  // Add the user message to the chat history.
  const messages: ServerMessage[] = [
    ...existingHistory.messages,
    { role: "user", content: message, id: nanoid() },
  ];

  // Generate a response from the model using the chat history.
  streamText({
    model: openai("gpt-4o"),
    messages,
  }).then(async (result) => {
    let finalValue = "";
    try {
      for await (const value of result.textStream) {
        chatStream.append(value);
        finalValue += value;
      }
    } finally {
      chatStream.done();

      const finalMessages = [
        ...history.get().messages,
        { role: "assistant", content: finalValue, id: nanoid() },
      ];

      history.done({
        conversationId: existingHistory.conversationId,
        messages: finalMessages,
      });
    }
  });

  return {
    chatStream: chatStream.value,
  };
}

export function aiStateToUIState(aiState: AIState): UIState {
  return {
    conversationId: aiState.conversationId,
    messages: aiState.messages,
  };
}

// Create the AI provider with the initial states and allowed actions
export const AI = createAI({
  actions: {
    sendMessage,
  },
  initialAIState,
  initialUIState,

  // Retrieve the UI state from the DB if a conversationId is present; get it from AIState otherwise.
  onGetUIState: async () => {
    "use server";
    const currentAIState: AIState = getAIState();

    // This fallback is here mostly to make TS happy. The conversationId should always get
    //  created in the server page before this function is called.
    if (!currentAIState.conversationId) {
      return aiStateToUIState(currentAIState);
    }

    const messageHistory = await getChatHistory(currentAIState.conversationId);

    const newUIState: UIState = {
      conversationId: currentAIState.conversationId,
      messages: messageHistory,
    };

    return newUIState;
  },

  // When we update the AI state, save the conversation to the database.
  onSetAIState: async (event) => {
    "use server";
    const { state, done } = event;

    if (done) {
      if (!state.conversationId) {
        return;
      }

      await upsertConversation(state.conversationId);

      await saveChatMessages(
        state.conversationId,
        state.messages.map(({ role, content, id }) => ({
          role: role as ChatMessageRole,
          content,
          id,
        }))
      );
    }
  },
});
