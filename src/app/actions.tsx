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

  console.log(`---------------- received message:  `, message);

  // Handle the message, covered in the following sections.
}

// Create the AI provider with the initial states and allowed actions
export const AI = createAI({
  actions: {
    sendMessage,
  },
  initialAIState,
  initialUIState,
});
