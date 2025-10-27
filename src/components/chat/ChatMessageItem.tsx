import { ChatMessage } from '../../types';

interface ChatMessageItemProps {
  message: ChatMessage;
}

export function ChatMessageItem({ message }: ChatMessageItemProps) {
  if (message.isUser) {
    // User message: white box with border (Figma Screen 2 style)
    return (
      <div className="flex justify-end mb-4 px-5">
        <div className="bg-white border-2 border-cafeshow-gray-200 rounded-2xl px-4 py-3 max-w-[70%] shadow-sm">
          <p className="text-base text-black">{message.message}</p>
        </div>
      </div>
    );
  }

  // Agent message: no border, just text (Figma Screen 2 style)
  return (
    <div className="flex justify-start mb-4 px-5">
      <div className="max-w-[70%]">
        {message.sender && message.sender !== 'Agent' && (
          <p className="text-xs text-cafeshow-gray-300 mb-1">{message.sender}</p>
        )}
        <p className="text-base text-black">{message.message}</p>
      </div>
    </div>
  );
}
