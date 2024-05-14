"use client";
import React, { useState } from "react";

export const InputForm: React.FC = () => {
  const [formData, setFormData] = useState({
    input1: "",
    input2: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form Data:", formData);
    // Perform form submission actions here
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="input1">Input 1:</label>
        <input
          type="text"
          id="input1"
          name="input1"
          value={formData.input1}
          onChange={handleChange}
        />
      </div>
      <div>
        <label htmlFor="input2">Input 2:</label>
        <input
          type="text"
          id="input2"
          name="input2"
          value={formData.input2}
          onChange={handleChange}
        />
      </div>
      <button type="submit">Submit</button>
    </form>
  );
};

export default InputForm;
