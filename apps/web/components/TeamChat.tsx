'use client';

import React, { useState, useEffect, useRef } from 'react';
// NOTE: Local TS modules within the same package do not need the explicit .js extension (only cross-package ESM imports do)
import { Message, MessageChannel, messagingService } from '../lib/messaging';
import { formatDistanceToNow } from 'date-fns';

interface TeamChatProps {
  orgId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
}

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

function ChatInput({ onSend, disabled = false, placeholder = "Type a message..." }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t border-gray-200 bg-white">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          style={{ minHeight: '40px', maxHeight: '120px' }}
        />
      </div>
      <button
        type="submit"
        disabled={disabled || !message.trim()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        Send
      </button>
    </form>
  );
}

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  canEdit?: boolean;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
}

function MessageItem({ message, isOwn, canEdit = false, onEdit, onDelete }: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const handleEdit = () => {
    if (onEdit && editContent.trim() !== message.content) {
      onEdit(message.id!, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (onDelete && confirm('Are you sure you want to delete this message?')) {
      onDelete(message.id!);
    }
  };

  const formatTimestamp = (timestamp: any) => {
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Just now';
    }
  };

  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-4">
        <div className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-1' : ''}`}>
        {!isOwn && (
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
              {message.senderName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-700">{message.senderName}</span>
            <span className="text-xs text-gray-500">{formatTimestamp(message.timestamp)}</span>
          </div>
        )}
        
        <div
          className={`px-4 py-2 rounded-lg ${
            isOwn
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-2 py-1 text-gray-900 bg-white border border-gray-300 rounded resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(message.content);
                  }}
                  className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
              {message.edited && (
                <span className={`text-xs ${isOwn ? 'text-blue-200' : 'text-gray-500'}`}>
                  (edited)
                </span>
              )}
            </>
          )}
        </div>

        {isOwn && (
          <div className="flex justify-end gap-1 mt-1">
            <span className="text-xs text-gray-500">{formatTimestamp(message.timestamp)}</span>
            {canEdit && !isEditing && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-gray-500 hover:text-gray-700 px-1"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="text-xs text-red-500 hover:text-red-700 px-1"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TeamChat({ orgId, userId, userName, userEmail, userRole }: TeamChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [channels, setChannels] = useState<MessageChannel[]>([]);
  const [currentChannel, setCurrentChannel] = useState('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [showNewChannel, setShowNewChannel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize messaging and request permissions
  useEffect(() => {
    const initializeMessaging = async () => {
      try {
        await messagingService.initialize();
        const token = await messagingService.requestPermission();
        if (token) {
          console.log('Push notifications enabled');
        }

        // Listen for foreground messages
        messagingService.onMessage((payload) => {
          console.log('Received foreground message:', payload);
          // You could show a toast notification here
        });
      } catch (error) {
        console.error('Failed to initialize messaging:', error);
      }
    };

    initializeMessaging();
  }, []);

  // Subscribe to channels
  useEffect(() => {
    const unsubscribe = messagingService.subscribeToChannels(orgId, userId, (channelList) => {
      setChannels(channelList);
      
      // Ensure general channel exists
      const hasGeneral = channelList.some(ch => ch.id === 'general' || ch.name === 'General');
      if (!hasGeneral && channelList.length === 0) {
        // Create general channel
        messagingService.createChannel(orgId, userId, 'General', 'Main team discussion', 'general');
      }
    });

    return unsubscribe;
  }, [orgId, userId]);

  // Subscribe to messages for current channel
  useEffect(() => {
    const unsubscribe = messagingService.subscribeToMessages(orgId, currentChannel, (messageList) => {
      setMessages(messageList);
      setIsLoading(false);
      
      // Scroll to bottom when new messages arrive
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return unsubscribe;
  }, [orgId, currentChannel]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isSending) return;

    setIsSending(true);
    try {
      await messagingService.sendMessage(orgId, userId, userName, userEmail, content, currentChannel);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      await messagingService.editMessage(messageId, newContent);
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await messagingService.deleteMessage(messageId);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;

    try {
      const channelId = await messagingService.createChannel(orgId, userId, newChannelName, '', 'team');
      if (channelId) {
        setNewChannelName('');
        setShowNewChannel(false);
        setCurrentChannel(channelId);
      }
    } catch (error) {
      console.error('Failed to create channel:', error);
    }
  };

  const canEditMessages = ['admin', 'owner'].includes(userRole.toLowerCase());

  return (
    <div className="flex h-96 bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Channel Sidebar */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Team Chat</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Channels
            </div>
            
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setCurrentChannel(channel.id!)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm mb-1 transition-colors ${
                  currentChannel === channel.id
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                # {channel.name}
              </button>
            ))}
            
            {/* Default general channel if no channels exist */}
            {channels.length === 0 && (
              <button
                onClick={() => setCurrentChannel('general')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm mb-1 transition-colors ${
                  currentChannel === 'general'
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                # general
              </button>
            )}

            {showNewChannel ? (
              <div className="mt-2 space-y-2">
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="Channel name"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateChannel()}
                />
                <div className="flex gap-1">
                  <button
                    onClick={handleCreateChannel}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowNewChannel(false);
                      setNewChannelName('');
                    }}
                    className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNewChannel(true)}
                className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-500 hover:bg-gray-100 transition-colors"
              >
                + Add Channel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  isOwn={message.senderId === userId}
                  canEdit={canEditMessages || message.senderId === userId}
                  onEdit={handleEditMessage}
                  onDelete={handleDeleteMessage}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Chat Input */}
        <ChatInput
          onSend={handleSendMessage}
          disabled={isSending}
          placeholder={`Message #${channels.find(ch => ch.id === currentChannel)?.name || 'general'}`}
        />
      </div>
    </div>
  );
}