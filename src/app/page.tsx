import InputForm from "@/components/InputForm";
import { AI, ServerMessage } from "./actions";
import { getChatHistory } from "@/lib/server/ChatMessage";
import { createConversation } from "@/lib/server/Conversation";

export default async function Home() {
  const conversation = await createConversation();
  const history: ServerMessage[] = await getChatHistory(conversation.id);

  console.log(`---------------- history in page:  `, history);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <AI initialAIState={history}>
        <InputForm conversationId={conversation.id} />
      </AI>
    </main>
  );
}
