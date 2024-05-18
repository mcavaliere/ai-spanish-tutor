"use client";

import React, { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { readStreamableValue, useActions, useUIState } from "ai/rsc";
import type { AI, ClientMessage } from "@/app/actions";
import { Bot, UserRound } from "lucide-react";
import { nanoid } from "nanoid";

export function MessageAvatar({ message }: { message: ClientMessage }) {
  let icon;
  if (message.role === "user") {
    icon = <UserRound size={24} />;
  } else if (message.role === "assistant") {
    icon = <Bot size={24} />;
  }

  return <span className="rounded-full mr-2 bg-gray-dark p-2">{icon}</span>;
}

export function InputForm() {
  const [conversation, setConversation] = useUIState<typeof AI>();
  const [currentChatResponse, setCurrentChatResponse] = useState("");
  const { sendMessage } = useActions<typeof AI>();
  const [formData, setFormData] = useState({
    input1: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await sendMessage(formData.input1);

    // Add the user message to the chat history.
    setConversation((conversation) => ({
      ...conversation,
      messages: [
        ...conversation.messages,
        { content: formData.input1, id: nanoid(), role: "user" },
      ],
    }));

    const chatStream = readStreamableValue(response.chatStream);

    // Track the message here as well as in state, since the updated state value won't be
    //  available before the function exits.
    let finalChatResponse = "";

    // Stream the AI response.
    for await (const value of chatStream) {
      setCurrentChatResponse(value as string);
      finalChatResponse = value as string;
    }

    // Add the AI response to the chat history.
    setConversation((conversation) => ({
      ...conversation,
      messages: [
        ...conversation.messages,
        // The ID is a placeholder; this will get replaced when saving to the server.
        { content: finalChatResponse, id: "ai", role: "assistant" },
      ],
    }));

    // Clear the chat response value so we don't show it twice.
    setCurrentChatResponse("");

    // Clear the input field.
    setFormData({ input1: "" });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        {conversation.messages?.length ? (
          <ul className="border border-black rounded-lg">
            {/* Show the conversation history. */}
            {conversation.messages.map(
              (message: ClientMessage, index: number) => (
                <li
                  key={index}
                  className="flex flex-row items-center border-b border-b-black last:border-b-0 p-2"
                >
                  <MessageAvatar message={message} />
                  <span>{message.content}</span>
                </li>
              )
            )}

            {/* Stream the current response. Once it's finished, the value will move from currentChatResponse to conversation.messages above. */}
            {currentChatResponse && <li>{currentChatResponse}</li>}
          </ul>
        ) : null}
        <div className="flex flex-row gap-2">
          <Input
            id="input1"
            name="input1"
            value={formData.input1}
            onChange={handleChange}
            placeholder="Say something, and I&#39;ll respond in Spanish."
          />
          <Button type="submit">Submit</Button>
        </div>
      </div>
    </form>
  );
}

export default InputForm;
