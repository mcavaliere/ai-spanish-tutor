"use client";

import React, { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { useActions } from "ai/rsc";
import type { AI } from "@/app/actions";

export const InputForm: React.FC = () => {
  const [formData, setFormData] = useState({
    input1: "",
    input2: "",
  });

  const { sendMessage } = useActions<typeof AI>();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`---------------- handleSubmit: `, formData.input2);

    const response = await sendMessage(formData.input2);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="input2">
          Say something, and I'll respond in Spanish.{" "}
        </Label>
        <div className="flex flex-row gap-2">
          <Input
            id="input2"
            name="input2"
            value={formData.input2}
            onChange={handleChange}
          />
          <Button type="submit">Submit</Button>
        </div>
      </div>
    </form>
  );
};

export default InputForm;
