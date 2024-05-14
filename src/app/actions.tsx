import { createAI } from "ai/rsc";
import { ReactNode } from "react";

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

// Create the AI provider with the initial states and allowed actions
export const AI = createAI({
  initialAIState: [] as AIState,
  initialUIState: [] as UIState,
  actions: {
    sendMessage,
  },
});

async function sendMessage(message: string) {
  "use server";

  // Handle the message, covered in the following sections.
}
