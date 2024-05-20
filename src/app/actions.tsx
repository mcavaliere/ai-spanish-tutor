import { createAI, createStreamableValue, getAIState } from "ai/rsc";
import { getMutableAIState } from "ai/rsc";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { nanoid } from "nanoid";

export interface ServerMessage {
  role: "user" | "assistant" | "system";
  content: string;
  id: string;
}

export type ClientMessage = {
  content: string;
  id: string;
  role: "user" | "assistant" | "system";
};

// Define the AI state and UI state types
export type AIState = {
  conversationId?: string;
  messages: ServerMessage[];
};

export type UIState = {
  conversationId?: string;
  messages: ClientMessage[];
};

const initialAIState: AIState = {
  messages: [],
};

// The initial UI state that the client will keep track of.
const initialUIState: UIState = {
  messages: [],
};

const systemPromptString = `
  You're a Spanish language teacher. I'll be talking to you to improve my Spanish speaking skills.

  By default, you can ask me a question in Spanish.

  When you ask me a question, I will either attempt to answer it in Spanish or ask you a follow-up question in English. Things I may ask include asking you to translate the sentence to English, asking you to explain each word, or asking you to explain a single word or phrase. In all of these cases, respond in English.

  At any time, correct me (in English) if I make a mistake in my Spanish. Then continue the conversation.

  If I ask you for help (in English), or ask you anything about the system, list out (in English) the things you can do as listed above.

  If I input anything that I have not described above, respond in English with a list of the things you can do as described above.
`;

async function sendMessage(message: string) {
  "use server";

  const chatStream = createStreamableValue<string>("");

  const history = getMutableAIState<typeof AI>();

  const existingHistory: AIState = history.get();

  // Add the user message to the chat history.
  const messages: ServerMessage[] = [
    ...existingHistory.messages,
    { role: "user", content: message, id: nanoid() },
  ];

  // Make sure we start with the system prompt.
  if (
    !existingHistory.messages?.length ||
    existingHistory.messages[0].role !== "system"
  ) {
    messages.unshift({
      role: "system",
      content: systemPromptString,
      id: nanoid(),
    });
  }

  history.update({ messages });

  // Generate a response from the model using the chat history.
  streamText({
    model: openai("gpt-4o"),
    messages,
  }).then(async (result) => {
    // Track the value of the response as it comes in. We'll save this
    //  to the database when done streaming.
    // Note that we can grab this from chatStream.value.curr as well, but
    //  this approach is discouraged by the Vercel SDK.
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
        {
          role: "assistant",
          content: finalValue,
          id: nanoid(),
        } as ServerMessage,
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

// Create the AI provider with the initial states and allowed actions
export const AI = createAI({
  actions: {
    sendMessage,
  },
  initialAIState,
  initialUIState,
});
