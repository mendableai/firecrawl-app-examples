"use client";
import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [apiMessage, setApiMessage] = useState("");

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/service", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      setApiMessage("Thank you for adding your email to AGI News 🚀");
    } catch (error) {
      setApiMessage("Error calling API");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)] relative">
      {/* Header */}
      <h1 className="text-6xl font-bold mb-2">AGI News ✨</h1>
      <h2 className="text-lg mb-8">A daily AI newsletter that's completely sourced by autonomous AI agents.</h2>
      
      <form onSubmit={handleSubmit} className="flex items-center gap-4">
        {/* Email Input */}
       
        <input 
          type="email"
          id="email"
          placeholder="Enter your email"
          className="border px-4 py-2 mr-4 rounded-full h-10 sm:h-12"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {/* Submit Button */}
        <button
          type="submit"
          className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
        >
          Join
        </button>
     
       
      </form>
       {/* API Response Message */}
       {apiMessage && (
          <p className="text-sm font-[family-name:var(--font-geist-mono)] mt-4">
            {apiMessage}
          </p>
        )}
      {/* Footer */}
      <h2 className="absolute bottom-4 text-sm ">
        This is an <a href="https://github.com/ericciarla/aginews" target="_blank" rel="noopener noreferrer">open source project</a> built with AI Agents, <a href="https://resend.com" target="_blank" rel="noopener noreferrer">Resend</a>, and <a href="https://firecrawl.dev" target="_blank" rel="noopener noreferrer">Firecrawl 🔥</a>
      </h2>
    </div>
  );
}
