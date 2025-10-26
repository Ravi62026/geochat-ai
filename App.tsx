import React, { useState, useEffect, useRef } from 'react';
import { getGroundedResponse } from './services/geminiService';
import { Message, UserLocation } from './types';
import { ChatInput } from './components/ChatInput';
import { ChatMessage } from './components/ChatMessage';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const savedMessages = localStorage.getItem('geoChatHistory');
      return savedMessages ? JSON.parse(savedMessages) : [];
    } catch (error) {
      console.error("Could not parse chat history from localStorage", error);
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setError(null);
          // Only add the welcome message if the chat history is empty
          if (messages.length === 0) {
            setMessages([{ id: 'init', role: 'model', text: "Welcome to GeoChat AI! Your location is set. Ready to explore? Ask me anything about your surroundings, from the best local coffee shops to hidden gems." }]);
          }
        },
        (geoError) => {
          setError(`Location access is required to use this app. Please enable it in your browser settings. Error: ${geoError.message}`);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  }, []);

  useEffect(() => {
    // Save chat history to localStorage whenever it changes
    if (messages.length > 0) {
        localStorage.setItem('geoChatHistory', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    if (!userLocation) {
        setError("Cannot send message without your location.");
        return;
    }
    
    const userMessage: Message = { id: Date.now().toString(), role: 'user', text };
    const history = [...messages];

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const { text: modelText, groundingChunks } = await getGroundedResponse(text, userLocation, history);
      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: modelText,
        groundingChunks: groundingChunks,
      };
      setMessages(prev => [...prev, modelMessage]);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-brand-bg text-brand-text-primary font-sans">
      <header className="p-4 border-b border-brand-border bg-brand-surface/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">GeoChat AI</h1>
        <p className="text-center text-sm text-brand-text-secondary">Your AI-powered local guide</p>
      </header>
      
      <main className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
            {isLoading && (
              <div className="flex justify-start">
                  <div className="max-w-lg px-4 py-3 rounded-2xl bg-brand-surface rounded-bl-none border border-brand-border">
                      <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse"></div>
                      </div>
                  </div>
              </div>
            )}
            {error && (
              <div className="flex justify-center">
                  <div className="p-4 bg-brand-error/10 border border-brand-error/50 text-brand-error rounded-lg max-w-2xl text-center">
                      <p className="font-bold">Error</p>
                      <p>{error}</p>
                  </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} disabled={!userLocation} />
        </div>
      </main>
    </div>
  );
};

export default App;