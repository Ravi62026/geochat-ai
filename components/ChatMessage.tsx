import React from 'react';
import { Message, GroundingChunk, SearchGroundingChunk, MapsGroundingChunk } from '../types';

interface ChatMessageProps {
  message: Message;
}

const parseInlineMarkdown = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

const renderMarkdown = (text: string) => {
    // Gracefully handle cases where text might be undefined or not a string.
    if (typeof text !== 'string' || !text) {
        return <p></p>; // Return an empty paragraph to avoid rendering issues.
    }
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-2 pl-4">
                    {listItems.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            );
            listItems = [];
        }
    };

    lines.forEach((line) => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
            listItems.push(parseInlineMarkdown(trimmedLine.substring(2)));
        } else {
            flushList();
            if (line.length > 0) {
                 elements.push(<p key={`p-${elements.length}`} className="my-1">{parseInlineMarkdown(line)}</p>);
            }
        }
    });
    
    flushList();

    if (elements.length === 0 && listItems.length === 0) {
        return <p>{parseInlineMarkdown(text)}</p>;
    }

    return <>{elements}</>;
};


const GroundingLink: React.FC<{ chunk: GroundingChunk }> = ({ chunk }) => {
    const isMaps = 'maps' in chunk;
    const source = isMaps ? (chunk as MapsGroundingChunk).maps : (chunk as SearchGroundingChunk).web;

    if (!source || !source.uri || !source.title) {
        return null;
    }

    const icon = isMaps ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-brand-secondary flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
    ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-brand-accent flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
        </svg>
    );

    return (
        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-start bg-brand-bg hover:bg-brand-border/60 p-2 rounded-lg text-sm transition-colors duration-200">
            {icon}
            <span className="truncate text-brand-text-secondary hover:text-brand-text-primary">{source.title}</span>
        </a>
    );
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUserModel = message.role === 'model';
  const hasGrounding = message.groundingChunks && message.groundingChunks.length > 0;

  return (
    <div className={`flex ${isUserModel ? 'justify-start' : 'justify-end'} mb-4`}>
      <div className={`max-w-xl lg:max-w-2xl px-4 py-3 rounded-2xl shadow-sm ${isUserModel ? 'bg-brand-surface text-brand-text-primary rounded-bl-none border border-brand-border' : 'bg-brand-primary text-white rounded-br-none'}`}>
        <div>
          {isUserModel ? renderMarkdown(message.text) : <p className="whitespace-pre-wrap">{message.text}</p>}
        </div>
        {hasGrounding && (
          <div className="mt-4 border-t border-brand-border/70 pt-3">
            <h4 className="text-xs font-semibold text-brand-text-secondary uppercase mb-2">Sources</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {message.groundingChunks?.map((chunk, index) => (
                <GroundingLink key={index} chunk={chunk} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};