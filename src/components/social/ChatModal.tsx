'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User, MessageCircle, Search } from 'lucide-react';

interface ChatUser {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
  statusText: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  recipientId: string;
  content: string;
  createdAt: string;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string;
  initialTargetUser?: any | null;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  initialTargetUser
}) => {
  const [contacts, setContacts] = useState<ChatUser[]>([]);
  const [selectedContact, setSelectedContact] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync initialTargetUser when modal opens or target changes
  useEffect(() => {
    if (initialTargetUser && initialTargetUser.id) {
      const formatted: ChatUser = {
        id: initialTargetUser.id,
        name: initialTargetUser.name || 'Reader',
        avatar: initialTargetUser.avatar || '/community/avatar-pegasus.jpg',
        online: Boolean(initialTargetUser.online ?? initialTargetUser.isOnline ?? true),
        statusText: initialTargetUser.statusText || initialTargetUser.title || 'Verified Reader ✨'
      };
      setSelectedContact(formatted);
      setContacts(prev => {
        if (!prev.some(c => c.id === formatted.id)) {
          return [formatted, ...prev];
        }
        return prev;
      });
    }
  }, [initialTargetUser]);

  // Fetch all community contacts when modal is opened
  useEffect(() => {
    if (!isOpen) return;

    fetch(`/api/community/users?user=${encodeURIComponent(currentUserId)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.users)) {
          const list: ChatUser[] = data.users
            .filter((u: any) => u.id !== currentUserId && u.email !== currentUserId)
            .map((u: any) => ({
              id: u.id,
              name: u.name,
              avatar: u.avatar || '/community/avatar-pegasus.jpg',
              online: Boolean(u.isOnline),
              statusText: u.title || 'Verified Reader ✨'
            }));

          setContacts(prev => {
            // Keep any currently selected contact at the top if present
            const combined = [...list];
            if (initialTargetUser && !combined.some(c => c.id === initialTargetUser.id)) {
              combined.unshift({
                id: initialTargetUser.id,
                name: initialTargetUser.name || 'Reader',
                avatar: initialTargetUser.avatar || '/community/avatar-pegasus.jpg',
                online: true,
                statusText: initialTargetUser.title || 'Verified Reader ✨'
              });
            }
            return combined;
          });

          if (!initialTargetUser && !selectedContact && list.length > 0) {
            setSelectedContact(list[0]);
          }
        }
      })
      .catch(console.error);
  }, [isOpen, currentUserId, initialTargetUser]);

  // Auto-fetch & refresh messages for active conversation
  useEffect(() => {
    if (!isOpen || !selectedContact) return;

    let isMounted = true;
    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `/api/community/messages?with=${encodeURIComponent(selectedContact.id)}&me=${encodeURIComponent(currentUserId)}`
        );
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, selectedContact, currentUserId]);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedContact) return;

    const content = inputText.trim();
    setInputText('');

    // Optimistic message
    const tempMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      senderId: currentUserId,
      senderName: currentUserName,
      senderAvatar: currentUserAvatar,
      recipientId: selectedContact.id,
      content,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await fetch('/api/community/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUserId,
          senderName: currentUserName,
          senderAvatar: currentUserAvatar,
          recipientId: selectedContact.id,
          content
        })
      });
      const data = await res.json();
      if (data.success && data.message) {
        setMessages(prev => prev.map(m => (m.id === tempMsg.id ? data.message : m)));
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in select-none">
      <div className="relative w-full max-w-2xl h-[560px] max-h-[90vh] rounded-3xl border border-white/10 bg-[#0d0f18] shadow-2xl flex overflow-hidden">
        
        {/* Left Contacts Sidebar */}
        <div className="w-1/3 min-w-[130px] border-r border-white/10 flex flex-col bg-[#0a0b12]">
          <div className="p-3 border-b border-white/10 flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 flex-1">
              <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-white placeholder:text-zinc-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04] no-scrollbar">
            {filteredContacts.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-500">
                No users found.
              </div>
            ) : (
              filteredContacts.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`w-full p-2.5 sm:p-3 flex items-center gap-2.5 sm:gap-3 text-left transition-colors ${
                    selectedContact?.id === contact.id ? 'bg-white/[0.08]' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-white/10 bg-zinc-900">
                      <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
                    </div>
                    {contact.online && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0a0b12]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 hidden sm:block">
                    <div className="font-bold text-xs text-white truncate">{contact.name}</div>
                    <div className="text-[10px] text-zinc-400 truncate">{contact.statusText}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Active Chat Window */}
        <div className="flex-1 flex flex-col bg-[#0f111c] min-w-0">
          {selectedContact ? (
            <>
              {/* Header */}
              <div className="p-3 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-white/10 shrink-0 bg-zinc-900">
                    <img src={selectedContact.avatar} alt={selectedContact.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs sm:text-sm text-white truncate">{selectedContact.name}</div>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{selectedContact.online ? 'Online' : 'Active'}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-2.5 no-scrollbar">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 text-xs">
                    <MessageCircle className="w-8 h-8 mb-2 opacity-40 text-cyan-400" />
                    <p>Say hello to {selectedContact.name}!</p>
                    <p className="text-[10px] text-zinc-600 mt-1">Direct messages are private and persistent.</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.recipientId === selectedContact.id ||
                                 msg.senderId === currentUserId ||
                                 (msg.senderName && msg.senderName === currentUserName);
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-sm ${
                            isMe
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-semibold rounded-br-none'
                              : 'bg-[#1b1d2c] text-zinc-100 border border-white/10 rounded-bl-none'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Message ${selectedContact.name}...`}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-full bg-[#181a26] border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-400/50"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-zinc-950 flex items-center justify-center transition-all disabled:opacity-40 shrink-0 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-500 relative">
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white flex items-center justify-center transition-colors absolute top-3 right-3"
              >
                <X className="w-4 h-4" />
              </button>
              <MessageCircle className="w-10 h-10 mb-3 opacity-30 text-amber-400" />
              <p className="text-sm text-zinc-300 font-semibold">No Conversation Selected</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                Select a reader from the contacts on the left or search for other users to start chatting.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
