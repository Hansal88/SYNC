import React from 'react';
import ChatBot from '../components/ChatBot';
import Navbar from '../components/Navbar';

const ChatBotPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">AI Chat Assistant</h1>
        <div className="max-w-2xl mx-auto">
          <ChatBot />
        </div>
      </div>
    </div>
  );
};

export default ChatBotPage;