"use client";

import React, { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { readStreamableValue, useActions, useUIState } from "ai/rsc";
import type { AI, ClientMessage } from "@/app/actions";

export function InputForm() {
  const [conversation, setConversation] = useUIState();
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
    const chatStream = readStreamableValue(response.chatStream);

    (async () => {
      for await (const value of chatStream) {
        setCurrentChatResponse(() => value as string);
        // setConversation((conversation) => ({
        //   ...conversation,
        //   messages: [...conversation.messages, value],
        // }));
      }
    })();

    // setConversation(response);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="input1">
          Say something, and I'll respond in Spanish.{" "}
        </Label>
        <div className="flex flex-row gap-2">
          <Input
            id="input1"
            name="input1"
            value={formData.input1}
            onChange={handleChange}
          />
          <Button type="submit">Submit</Button>
        </div>
        <ul className="bg-slate-200 rounded-lg p-4">
          {conversation.messages.map(
            (message: ClientMessage, index: number) => (
              <li key={index}>{message}</li>
            )
          )}

          {currentChatResponse && <li>{currentChatResponse}</li>}
        </ul>
      </div>
    </form>
  );
}

export default InputForm;
