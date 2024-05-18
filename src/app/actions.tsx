import { createAI, createStreamableValue, getAIState } from "ai/rsc";
import { getMutableAIState } from "ai/rsc";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { nanoid } from "nanoid";
import { ChatMessageRole, Conversation } from "@prisma/client";

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

const systemPromptString = `
  You're a Spanish language teacher. I'll be talking to you to improve my Spanish speaking skills.

  By default, you can ask me a question in Spanish.

  When you ask me a question, I will either attempt to answer it in Spanish or ask you a follow-up question in English. Things I may ask include asking you to translate the sentence to English, asking you to explain each word, or asking you to explain a single word or phrase.

  If I respond in Spanish, correct me if I make a mistake. Then continue the conversation as you would with a student.

  If I ask you for help, or ask you anything about the system, list out (in English) the things you can do as listed above.

  If I input anything that I have not described above, list out (in English) the things you can do as listed above.
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
        { role: ChatMessageRole.assistant, content: finalValue, id: nanoid() },
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
  // onGetUIState: async () => {
  //   "use server";
  //   const currentAIState: AIState = getAIState();

  //   // This fallback is here mostly to make TS happy. The conversationId should always get
  //   //  created in the server page before this function is called.
  //   if (!currentAIState.conversationId) {
  //     return aiStateToUIState(currentAIState);
  //   }

  //   const messageHistory = await getChatHistory(currentAIState.conversationId);

  //   const newUIState: UIState = {
  //     conversationId: currentAIState.conversationId,
  //     messages: messageHistory,
  //   };

  //   return newUIState;
  // },

  // // When we update the AI state, save the conversation to the database.
  // onSetAIState: async (event) => {
  //   "use server";
  //   const { state, done } = event;

  //   if (done) {
  //     if (!state.conversationId) {
  //       return;
  //     }

  //     await upsertConversation(state.conversationId);

  //     await saveChatMessages(
  //       state.conversationId,
  //       state.messages.map(({ role, content, id }) => ({
  //         role: role as ChatMessageRole,
  //         content,
  //         id,
  //       }))
  //     );
  //   }
  // },
});
