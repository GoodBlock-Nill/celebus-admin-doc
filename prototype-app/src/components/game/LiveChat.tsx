'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  id: string;
  nickname: string;
  text: string;
  isSystem?: boolean;
}

const MOCK_MESSAGES: ChatMessage[] = [
  { id: '1', nickname: 'kpopfan99', text: '이거 너무 어렵다 ㅠㅠ' },
  { id: '2', nickname: 'starlight22', text: '1번 아닌가요??' },
  { id: '3', nickname: 'blink_4ever', text: '파이팅!! 할수있어요!!' },
  { id: '4', nickname: 'armytime', text: '맞았다!! 예스!!', isSystem: false },
];

interface LiveChatProps {
  isKeyboardMode?: boolean;
  onKeyboardToggle?: (open: boolean) => void;
}

export default function LiveChat({ onKeyboardToggle }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate incoming messages
  useEffect(() => {
    const mockIncoming = [
      { nickname: 'twice_official', text: '이번에 진짜 어렵네요' },
      { nickname: 'skz_stay', text: '화이팅 모두!!' },
      { nickname: 'newjeans_fan', text: '나 탈락했어요 ㅜ' },
      { nickname: 'exo_fan', text: '정답은 3번!!' },
      { nickname: 'lesserafim_fan', text: '맞았다!!!' },
    ];

    let idx = 0;
    const interval = setInterval(() => {
      if (idx < mockIncoming.length) {
        const msg = mockIncoming[idx];
        setMessages(prev => [
          ...prev,
          {
            id: `incoming-${idx}`,
            nickname: msg.nickname,
            text: msg.text,
          },
        ]);
        idx++;
      } else {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  function handleChatOpen() {
    setShowInput(true);
    onKeyboardToggle?.(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function handleSend() {
    if (!inputText.trim()) return;

    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        nickname: '나',
        text: inputText.trim(),
      },
    ]);
    setInputText('');
    setShowInput(false);
    onKeyboardToggle?.(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSend();
    }
    if (e.key === 'Escape') {
      setShowInput(false);
      onKeyboardToggle?.(false);
    }
  }

  return (
    <div className="relative">
      {/* Chat messages */}
      <div className="h-20 overflow-y-auto flex flex-col gap-1 mb-2">
        {messages.slice(-5).map(msg => (
          <div key={msg.id} className="flex items-baseline gap-2">
            <span className="text-blue-400 text-xs font-semibold flex-shrink-0">
              {msg.nickname}
            </span>
            <span className="text-gray-300 text-xs">{msg.text}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat input */}
      {showInput ? (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value.slice(0, 100))}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              setShowInput(false);
              onKeyboardToggle?.(false);
            }}
            placeholder="메시지 입력..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSend}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            ▶
          </button>
        </div>
      ) : (
        /* Chat open button */
        <div className="flex justify-end">
          <button
            onClick={handleChatOpen}
            className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors text-lg"
          >
            💬
          </button>
        </div>
      )}
    </div>
  );
}
