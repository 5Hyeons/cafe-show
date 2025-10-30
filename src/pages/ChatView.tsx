import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Header } from '../components/common/Header';
import { TagButton } from '../components/common/TagButton';
import { ChatMessageItem } from '../components/chat/ChatMessageItem';
import { DetailContent } from '../components/DetailContent';
import { ChatMessage } from '../types';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onNextScreen?: (shouldInterrupt?: boolean) => void;
  onClearDetail?: (messageId: string) => void;
}

export function ChatView({ messages, onSendMessage, onNextScreen, onClearDetail }: ChatViewProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const tags = [
    '행사 정보',
    '티켓/예매',
    '입장 절차 및  규정',
    '대중교통 및 주차 안내',
    '주요 프로그램',
  ];

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleTagClick = (tag: string) => {
    onSendMessage(tag);
  };

  // Dynamic button handler: send message if text exists, otherwise switch to avatar mode
  const handleDynamicButton = () => {
    if (inputValue.trim()) {
      handleSend();
    } else if (onNextScreen) {
      onNextScreen(true);  // shouldInterrupt = true when switching without text input
    }
  };

  // Dynamic icon based on input state
  const buttonIcon = inputValue.trim()
    ? '/assets/icon-send-message-4x.png'
    : '/assets/icon-to-avatar.png';

  const buttonTitle = inputValue.trim()
    ? '메시지 전송'
    : '아바타 모드로 전환';

  const hasMessages = messages.length > 0;

  return (
    <div className="w-full max-w-mobile mx-auto bg-white h-screen flex flex-col relative">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-5 pt-10 pb-4 relative z-10 overflow-y-auto hide-scrollbar">
        {/* Greeting Text */}
        <div className="text-[23px] leading-[1.4] tracking-[-0.46px] mb-4">
          <p className="mb-0">안녕하세요.</p>
          <p className="mb-0">
            <span className="font-bold text-cafeshow-red">카페쇼 AI </span>입니다.
          </p>
          <p>무엇을 도와드릴까요?</p>
        </div>

        {/* Tag Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag) => (
            <TagButton key={tag} onClick={() => handleTagClick(tag)}>
              {tag}
            </TagButton>
          ))}
          <TagButton variant="white">+</TagButton>
        </div>

        {/* Chat Messages with Details (Screen 2 style) */}
        {hasMessages && (
          <div className="mb-4">
            {messages.map((msg) => (
              <div key={msg.id}>
                <ChatMessageItem message={msg} />

                {/* Detail Content if attached to this message */}
                {msg.detailTopic && (
                  <>
                    {/* Vector 3234 Divider */}
                    <div className="w-full h-px bg-gray-300 my-1" />

                    {/* Detail Content */}
                    <DetailContent
                      topic={msg.detailTopic}
                      onClose={() => onClearDetail?.(msg.id)}
                    />
                  </>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Avatar and Tooltip - Only show when no messages */}
        {!hasMessages && (
          <div className="flex flex-col mt-auto">
            {/* Avatar Image */}
            <div className="w-[134px] h-[130px] mb-[-8px] relative z-10 ml-auto">
              <img
                src="/assets/avatar-hand-wave.png"
                alt="카페쇼 AI"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Tooltip */}
            <div className="bg-cafeshow-gray-900 rounded-lg px-[10px] py-[10px] mb-[-8px] relative z-10 ml-auto">
              <p className="text-white text-sm font-medium text-center whitespace-nowrap">
                AI와 대화로 행사 정보를 알아보세요 !
              </p>
            </div>

            {/* Tooltip Pointer */}
            <div className="w-[107px] h-[21px] mb-[-8px] relative z-10 ml-[calc(100%-62px)]">
              <img src="/assets/tooltip-pointer.svg" alt="" className="w-full h-full" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Input Area */}
      <div className="px-5 pt-[10px] pb-[22px] flex flex-col gap-2 relative z-10">
        {/* Input Field */}
        <div className="bg-cafeshow-gray-100 border border-cafeshow-gray-200 rounded-full h-[54px] flex items-center px-4 gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="무엇이든 물어보세요"
            className="flex-1 bg-transparent outline-none text-base placeholder:text-cafeshow-gray-300"
          />

          {/* Dynamic Button: Send message or Switch to avatar mode */}
          <button
            onClick={handleDynamicButton}
            className="w-10 h-10 flex-shrink-0"
            title={buttonTitle}
          >
            <img src={buttonIcon} alt={buttonTitle} className="w-full h-full" />
          </button>
        </div>

        {/* Disclaimer Text */}
        <p className="text-cafeshow-gray-300 text-sm text-center whitespace-nowrap">
          AI 이기 때문에 실수할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
