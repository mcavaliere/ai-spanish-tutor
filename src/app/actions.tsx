import { createAI, getAIState } from "ai/rsc";
import { ReactNode } from "react";
import { getMutableAIState } from "ai/rsc";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { nanoid } from "nanoid";
import { saveChatMessages } from "@/lib/server/ChatMessage";
import { ChatMessageRole } from "@prisma/client";
import { upsertConversation } from "@/lib/server/Conversation";

export interface ServerMessage {
  role: "user" | "assistant" | "function";
  content: string;
}

export interface ClientMessage {
  id: string;
  role: "user" | "assistant" | "function";
  display: ReactNode;
}

// Define the AI state and UI state types
export type AIState = Array<{
  role: "user" | "assistant";
  content: string;
}>;

export type UIState = Array<{
  id: string;
  role: "user" | "assistant";
  display: ReactNode;
}>;

const initialAIState: {
  role: "user" | "assistant" | "system" | "function";
  content: string;
  id?: string;
  name?: string;
}[] = [];

// The initial UI state that the client will keep track of.
const initialUIState: {
  id: number;
  display: React.ReactNode;
}[] = [];

async function sendMessage(message: string) {
  "use server";

  const history = getMutableAIState();

  const messages = [...history.get(), { role: "user", content: message }];

  console.log(`---------------- sendMessage -> history:  `, history.get());

  // Update the AI state with the new user message.
  history.update([...history.get(), { role: "user", content: message }]);

  console.log(`---------------- sendMessage -> new history:  `, history.get());

  const response = await generateText({
    model: openai("gpt-3.5-turbo"),
    messages: history.get(),
  });

  // console.log(`---------------- response:  `, response);

  // Update the AI state again with the response from the model.
  history.done([
    ...history.get(),
    { role: "assistant", content: response.text },
  ]);

  // console.log(`---------------- history:  `, history.get());

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

    console.log(`---------------- onSetAIState:  `, state);

    if (done) {
      const conversationId = nanoid();

      await upsertConversation(conversationId);

      await saveChatMessages(
        state.map(({ role, content }) => ({
          role: role as ChatMessageRole,
          content,
          conversationId,
        }))
      );
    }
  },
  onGetUIState: async () => {
    "use server";

    const history: ServerMessage[] = getAIState();

    console.log(`---------------- onGetUIState history:  `, history);

    return history.map(({ role, content }) => ({
      id: nanoid(),
      role,
    }));
  },
});
