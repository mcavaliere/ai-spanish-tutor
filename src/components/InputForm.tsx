"use client";

import React, { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { readStreamableValue, useActions, useUIState } from "ai/rsc";
import type { AI, ClientMessage } from "@/app/actions";
import { Bot, UserRound } from "lucide-react";
import { nanoid } from "nanoid";
import { cn } from "@/lib/utils";
import Markdown from "react-markdown";

export function MessageAvatar({ message }: { message: ClientMessage }) {
  let icon;
  if (message.role === "assistant") {
    icon = <Bot size={24} />;
  } else {
    icon = <UserRound size={24} />;
  }

  const classNames = cn(
    "rounded-full mr-2 bg-gray-dark p-2",
    message.role == "assistant" ? "bg-melon-light" : "bg-mint-light"
  );

  return <span className={classNames}>{icon}</span>;
}

export function MessageRow({ message }: { message: ClientMessage }) {
  const classNames = cn(
    "flex flex-row items-center border-b border-b-black last:border-b-0 p-2",
    message.role === "assistant" ? "bg-melon" : "bg-mint"
  );

  return (
    <li className={classNames}>
      <MessageAvatar message={message} />
      <div className="block [&>p]:mb-1 [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:mb-1 [&>ol]:list-disc [&>ol]:ml-4 [&>ol]:mb-1">
        <Markdown>{message.content}</Markdown>
      </div>
    </li>
  );
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
          <ul className="border border-black rounded-lg overflow-hidden">
            {/* Show the conversation history. */}
            {conversation.messages.map(
              (message: ClientMessage, index: number) => (
                <MessageRow key={index} message={message} />
              )
            )}

            {/* Stream the current response. Once it's finished, the value will move from
                 currentChatResponse to conversation.messages above. */}
            {currentChatResponse && (
              <MessageRow
                key="currentChatResponse"
                message={{
                  role: "assistant",
                  content: currentChatResponse,
                  id: "ai",
                }}
              />
            )}
          </ul>
        ) : null}
        <div className="flex flex-row gap-2">
          <Input
            id="input1"
            name="input1"
            value={formData.input1}
            onChange={handleChange}
            placeholder="Say something, or type 'help' for instructions."
          />
          <Button type="submit">Submit</Button>
        </div>
      </div>
    </form>
  );
}

export default InputForm;
