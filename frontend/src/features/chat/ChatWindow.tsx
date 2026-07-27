import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { realtimeSocket } from '../../services/websocket.service';
import { ChatMessage, ChatThread } from '../../types';
import { Bot, Send, Mic, MicOff, Volume2, CheckCheck, Paperclip, Plus, Sparkles, User, MessageSquare, Loader2 } from 'lucide-react';

export const ChatWindow: React.FC = () => {
  const { user, token } = useAuth();

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Fetch threads on load
  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      const res = await api.get('/chat/threads');
      const list = res.data || [];
      setThreads(list);
      if (list.length > 0) {
        setActiveThread(list[0]);
      } else {
        createNewThread('AI_BOT');
      }
    } catch {
      setThreads([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewThread = async (channelType: string = 'AI_BOT') => {
    try {
      const res = await api.post('/chat/threads', {
        title: channelType === 'AI_BOT' ? 'AI Assistant Chat' : 'Live Agent Support',
        channel_type: channelType
      });
      setThreads((prev) => [res.data, ...prev]);
      setActiveThread(res.data);
    } catch {
      alert('Failed to create chat thread.');
    }
  };

  // Connect WebSocket when activeThread changes
  useEffect(() => {
    if (!activeThread || !token) return;

    // Load initial messages
    api.get(`/chat/threads/${activeThread.id}/messages`)
      .then((res) => setMessages(res.data || []))
      .catch(() => setMessages([]));

    // Connect WebSocket
    realtimeSocket.connect(activeThread.id, token);

    // Listen to real-time events
    realtimeSocket.on('NEW_MESSAGE', (msgData: any) => {
      const newMsg: ChatMessage = {
        id: msgData.id,
        thread_id: msgData.thread_id,
        org_id: activeThread.org_id,
        sender_id: msgData.sender_id,
        sender_type: msgData.sender_type,
        content: msgData.content,
        is_read: msgData.is_read || false,
        created_at: msgData.created_at
      };
      setMessages((prev) => [...prev, newMsg]);
      setOtherUserTyping(false);
    });

    realtimeSocket.on('TYPING_INDICATOR', (typingData: any) => {
      if (typingData.user_id !== user?.id) {
        setOtherUserTyping(typingData.is_typing);
      }
    });

    return () => {
      realtimeSocket.disconnect();
    };
  }, [activeThread, token, user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherUserTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      realtimeSocket.sendTyping(true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      realtimeSocket.sendTyping(false);
    }, 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeThread) return;

    realtimeSocket.sendMessage(inputText);
    setInputText('');
    setIsTyping(false);
    realtimeSocket.sendTyping(false);
  };

  // Web Speech API - Dictation
  const toggleRecording = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    if (!isRecording) {
      setIsRecording(true);
      recognition.start();

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => prev + ' ' + transcript);
        setIsRecording(false);
      };

      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
    } else {
      setIsRecording(false);
    }
  };

  // Text to Speech Synthesis
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex overflow-hidden">
      {/* Left Thread List Panel */}
      <div className="w-80 border-r border-slate-800 bg-slate-950 flex flex-col justify-between hidden md:flex">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            <span className="font-bold font-heading text-white text-sm">Conversations</span>
          </div>
          <button
            onClick={() => createNewThread('AI_BOT')}
            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            title="New AI Chat"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Thread List */}
        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          {threads.map((t) => (
            <div
              key={t.id}
              onClick={() => setActiveThread(t)}
              className={`p-3 rounded-2xl cursor-pointer transition-all ${
                activeThread?.id === t.id
                  ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                  : 'bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-slate-200 truncate">{t.title}</span>
                <span className="text-[10px] font-mono text-indigo-400 uppercase bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
                  {t.channel_type}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {t.messages && t.messages.length > 0 ? t.messages[t.messages.length - 1].content : 'Tap to start conversation'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Main Chat Window */}
      <div className="flex-1 flex flex-col justify-between bg-slate-900 relative">
        {/* Top Chat Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 backdrop-blur-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold font-heading text-white text-sm">
                {activeThread ? activeThread.title : 'ServiceHub AI Chat'}
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-semibold">Real-Time WebSocket Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((m) => {
            const isMe = m.sender_id === user?.id || m.sender_type === 'USER';
            return (
              <div
                key={m.id}
                className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isMe ? 'bg-indigo-600 text-white' : 'bg-purple-600 text-white'
                  }`}
                >
                  {isMe ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`space-y-1 max-w-lg ${isMe ? 'text-right' : 'text-left'}`}>
                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed shadow-lg inline-block text-left ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    {m.content}
                  </div>

                  <div className={`flex items-center gap-2 text-[10px] text-slate-500 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isMe && <CheckCheck className="w-3.5 h-3.5 text-indigo-400" />}
                    {!isMe && (
                      <button
                        onClick={() => speakText(m.content)}
                        className="text-slate-400 hover:text-white transition-colors"
                        title="Read Aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator Banner */}
          {otherUserTyping && (
            <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 w-fit animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Participant is typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Controls Footer */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-950 flex items-center gap-3">
          <button
            type="button"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Attach File"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={toggleRecording}
            className={`p-2.5 rounded-xl border transition-colors ${
              isRecording ? 'bg-rose-600 text-white border-rose-500 animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Speech Dictation"
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder={isRecording ? 'Listening to voice...' : 'Type message...'}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />

          <button
            type="submit"
            className="p-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold shadow-lg shadow-indigo-500/25 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
