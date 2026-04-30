import { useState, useRef, useEffect } from 'react';
import api from '../utils/api';
import { FiX, FiSend, FiMessageCircle, FiZap } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';

const QUICK_ACTIONS = [
  { label: '🪪 Check Voter ID', message: 'How can I check if my Voter ID (EPIC) is valid and what documents do I need?' },
  { label: '📋 Polling Process', message: 'Explain the step-by-step polling process at an Indian polling booth.' },
  { label: '⚖️ My Rights', message: 'What are my fundamental rights as a voter in India?' },
  { label: '🗳️ EVM Guide', message: 'How does the EVM machine work? How do I use VVPAT to verify my vote?' },
  { label: '📝 File Complaint', message: 'How do I file a complaint about electoral malpractice or booth irregularities?' },
  { label: '📮 Postal Ballot', message: 'Who is eligible for postal ballot voting and how do I apply?' }
];

function TypewriterText({ text, speed = 25, onComplete }) {
  const [displayedText, setDisplayedText] = useState('');
  const words = useRef(text.split(' '));
  const index = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (index.current < words.current.length) {
        setDisplayedText(prev => prev + (index.current === 0 ? '' : ' ') + words.current[index.current]);
        index.current++;
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return <ReactMarkdown>{displayedText}</ReactMarkdown>;
}

export default function ChatBot({ onClose }) {
  const [messages, setMessages] = useState([
    { role: 'model', text: 'Namaste! 🙏 I\'m VOTE-पथ AI, your non-partisan election guide. I can help you with voter ID verification, polling procedures, your rights as a voter, and more.\n\nHow can I assist you today?', isTyping: false }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEnd = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', text: text.trim(), isTyping: false };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const res = await api.post('/chat', { message: text.trim(), history });
      setMessages(prev => [...prev, { role: 'model', text: res.data.reply, isTyping: true }]);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to get response. Please try again.';
      setMessages(prev => [...prev, { role: 'model', text: `⚠️ ${errMsg}`, isTyping: false }]);
    }

    setLoading(false);
  };

  const handleTypingComplete = (index) => {
    setMessages(prev => {
      const newMessages = [...prev];
      if (newMessages[index]) {
        newMessages[index].isTyping = false;
      }
      return newMessages;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 border-l border-slate-200">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-saffron flex items-center justify-center shadow-sm">
            <FiMessageCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary">VOTE-पथ AI</h2>
            <p className="text-[10px] text-text-muted">Active Hub ● India</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          aria-label="Close Chat"
          className="p-2 rounded-lg hover:bg-component-hover cursor-pointer transition-colors"
        >
          <FiX className="w-5 h-5 text-text-muted" aria-hidden="true" />
        </button>
      </div>

      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
              msg.role === 'user'
                ? 'bg-gradient-to-r from-saffron to-orange-500 text-white rounded-br-md'
                : 'bg-white border border-slate-100 text-text-secondary rounded-bl-md'
            }`}>
              <div className="text-[11px] leading-relaxed prose prose-slate max-w-none">
                {msg.isTyping ? (
                  <TypewriterText 
                    text={msg.text} 
                    onComplete={() => handleTypingComplete(i)} 
                  />
                ) : (
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 bg-saffron rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-india-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-india-green rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEnd} />
      </div>

      <div className="bg-white p-4 border-t border-slate-200">
        {messages.length <= 1 && (
          <div className="pb-3 overflow-x-auto whitespace-nowrap hide-scrollbar">
            <p className="text-[10px] text-text-muted mb-2 flex items-center gap-1 font-bold uppercase tracking-widest">
              <FiZap className="w-3 h-3 text-saffron" /> Quick Guides
            </p>
            <div className="flex gap-2">
              {QUICK_ACTIONS.map((qa, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(qa.message)}
                  className="text-[10px] px-3 py-1.5 rounded-full border border-slate-100 bg-slate-50 text-text-secondary hover:border-saffron hover:text-saffron transition-all cursor-pointer shrink-0"
                >
                  {qa.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your question..."
              aria-label="Message VOTE-पथ AI"
              className="input-glass flex-1 text-xs"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Send message"
              className="btn-primary px-4 disabled:opacity-30 disabled:grayscale"
            >
              <FiSend className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
