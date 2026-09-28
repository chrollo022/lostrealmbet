import React, { useState, useRef, useEffect } from 'react';
import { X, Send, User, MessageSquare } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { sound } from '../../utils/audio';

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  time: string;
}

export const ChatDrawer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { user, chatMessages, sendChatMessage } = useGame();
  const [inputVal, setInputVal] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Display only real player chat - no system tips, crash, or bot server messages
  const filteredMessages = chatMessages.filter(
    (m) =>
      !m.isSystem &&
      !m.text.startsWith('💸') &&
      !m.text.toLowerCase().includes('tipped') &&
      !m.text.toLowerCase().includes('crash')
  );

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, filteredMessages]);

  const handleSend = () => {
    if (!inputVal.trim()) return;
    sendChatMessage(inputVal.trim());
    setInputVal('');
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed top-16 right-0 bottom-0 z-30 w-80 bg-[#0a0e16] border-l border-[#16202f] flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-[#16202f] flex items-center justify-between bg-[#0c111c]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="text-xs font-extrabold text-white">Supreme Live Chat</h3>
          <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-black uppercase">
            Players
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#162133] transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-3.5 overflow-y-auto flex flex-col gap-3">
        {filteredMessages.length === 0 ? (
          <div className="my-auto flex flex-col items-center justify-center text-center p-4 gap-2 text-slate-500">
            <MessageSquare className="w-8 h-8 text-slate-600" />
            <span className="text-xs font-semibold">No messages yet</span>
            <p className="text-[11px] text-slate-600">Be the first to say hello!</p>
          </div>
        ) : (
          filteredMessages.map((m) => (
            <div
              key={m.id}
              className={`p-2.5 rounded-xl border text-xs leading-relaxed ${
                m.isSystem
                  ? 'bg-gradient-to-r from-amber-950/40 to-indigo-950/40 border-amber-500/40 text-amber-200'
                  : 'bg-[#0e1422] border-[#182438] text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <User className={`w-3.5 h-3.5 ${m.isSystem ? 'text-amber-400' : 'text-[#38bdf8]'}`} />
                  <span className={`font-extrabold text-[11px] ${m.isSystem ? 'text-amber-300' : 'text-white'}`}>
                    {m.user}
                  </span>
                  {m.isSystem && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.5 rounded font-black uppercase">
                      Server
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{m.time}</span>
              </div>
              <p className="text-[12px] text-slate-200 break-words leading-relaxed pl-5 font-medium">
                {m.text}
              </p>
            </div>
          ))
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Input bar */}
      <div className="p-3 border-t border-[#16202f] bg-[#0c111c] flex items-center gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Send a message..."
          className="flex-1 bg-[#101725] border border-[#1b273b] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0074e4] transition"
        />
        <button
          onClick={handleSend}
          className="p-2 rounded-xl bg-[#0074e4] hover:bg-[#0085ff] text-white shadow-md shadow-[#0074e4]/30 transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
