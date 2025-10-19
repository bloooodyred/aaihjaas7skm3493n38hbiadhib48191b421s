import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';

const ChatPanel = ({ isOpen, onClose, onBack }) => {
  const {
    user,
    chatMessages,
    addChatMessage,
    markChatAsRead,
    removeChatMessage,
    muteUserForHours,
    isProtectedAccount,
    users,
  } = useAppContext();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [muteInfo, setMuteInfo] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const messagesEndRef = useRef(null);

  const sortedMessages = useMemo(
    () =>
      [...chatMessages].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    [chatMessages]
  );

  useEffect(() => {
    if (isOpen && user) {
      markChatAsRead(user.username);
    }
  }, [isOpen, markChatAsRead, user, chatMessages]);

  useEffect(() => {
    if (!user) {
      setMuteInfo(null);
      return;
    }
    const current = users?.find((u) => u.username === user.username);
    if (current?.mutedUntil) {
      const mutedDate = new Date(current.mutedUntil);
      if (!Number.isNaN(mutedDate.getTime()) && mutedDate > new Date()) {
        setMuteInfo(`Masz wyciszony czat do ${mutedDate.toLocaleString('pl-PL')}.`);
        return;
      }
    }
    setMuteInfo(null);
  }, [users, user]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sortedMessages, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      setError('Musisz być zalogowany, aby wysłać wiadomość.');
      return;
    }

    if (message.trim().length > 50) {
      setError('Wiadomość może mieć maksymalnie 50 znaków.');
      setFeedback('');
      return;
    }

    try {
      addChatMessage({ author: user.username, text: message });
      setMessage('');
      setError('');
      setFeedback('');
    } catch (err) {
      setError(err.message || 'Nie udało się wysłać wiadomości.');
      if (err.message?.toLowerCase().includes('wyciszony')) {
        setMuteInfo(err.message);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      setMessage((prev) => `${prev}\n`);
    }
  };

  const handleRemoveMessage = (id) => {
    setFeedback('');
    setError('');
    removeChatMessage(id);
    setFeedback('Wiadomość została usunięta.');
    setPendingDeleteId(null);
  };

  const handleMuteAuthor = (username) => {
    setFeedback('');
    setError('');
    try {
      muteUserForHours(username, 24);
      setFeedback(`Użytkownik ${username} został wyciszony na 24h.`);
    } catch (err) {
      setError(err.message || 'Nie udało się wyciszyć użytkownika.');
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} role="presentation" />
      <div className="absolute right-4 top-16 w-[22rem] max-w-[calc(100vw-2rem)] max-h-[70vh] bg-zinc-950/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl text-white flex flex-col">
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
          <button
            type="button"
            onClick={onBack || onClose}
            className="text-white/70 hover:text-white text-lg"
            aria-label="Powrót do panelu"
          >
            ←
          </button>
          <h2 className="text-lg font-semibold text-right flex-1">Czat grupowy</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {muteInfo && (
            <div className="text-xs text-orange-300 bg-orange-500/10 border border-orange-500/30 rounded-md p-2">
              {muteInfo}
            </div>
          )}
          {sortedMessages.length === 0 ? (
            <p className="text-sm text-white/60">Brak wiadomości. Rozpocznij konwersację!</p>
          ) : (
            sortedMessages.map((msg) => {
              const isOwn = msg.author === user?.username;
              const isSystem = msg.system;
              const showDelete = isAdmin && !isSystem;
              const isAdminAuthor = msg.author && users?.find((u) => u.username === msg.author)?.role === 'admin';
              return (
                <div key={msg.id} className="flex flex-col gap-1">
                  <div
                    className={`flex items-start gap-2 ${
                      isOwn ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {showDelete && isOwn && (
                      <div className="flex flex-col items-end gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setPendingDeleteId((prev) => (prev === msg.id ? null : msg.id))
                          }
                          className="text-white/60 hover:text-red-400 text-sm"
                          aria-label="Usuń wiadomość"
                        >
                          ×
                        </button>
                        {pendingDeleteId === msg.id && (
                          <div className="flex items-center gap-1 text-[10px] text-white/70">
                            Potwierdzić?
                            <button
                              type="button"
                              className="px-1 py-[2px] rounded bg-red-600 text-white"
                              onClick={() => handleRemoveMessage(msg.id)}
                            >
                              Tak
                            </button>
                            <button
                              type="button"
                              className="px-1 py-[2px] rounded bg-white/10"
                              onClick={() => setPendingDeleteId(null)}
                            >
                              Nie
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <div
                      className={`max-w-[55%] rounded-lg px-2 py-1 text-[12px] leading-snug ${
                        isSystem
                          ? 'bg-blue-500/20 text-blue-100 border border-blue-400/30'
                          : isOwn
                          ? 'bg-red-500/70 text-white'
                          : isAdminAuthor
                          ? 'bg-purple-600/30 text-purple-100 border border-purple-400/40'
                          : 'bg-zinc-700/80 text-white/90 border border-white/5'
                      }`}
                    >
                      <p className="text-[10px] uppercase tracking-wide text-white/60 mb-1 flex items-center gap-2">
                        {msg.author}
                        {isAdminAuthor && (
                          <span className="px-2 py-[2px] text-[9px] rounded-full bg-purple-500 text-white uppercase tracking-wider">
                            Admin
                          </span>
                        )}
                      </p>
                      <p className="text-[12px] whitespace-pre-wrap">{msg.text}</p>
                      <p className="text-[9px] text-white/50 mt-1">
                        {new Date(msg.createdAt).toLocaleString('pl-PL')}
                      </p>
                    </div>
                    {showDelete && !isOwn && (
                      <div className="flex flex-col items-start gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setPendingDeleteId((prev) => (prev === msg.id ? null : msg.id))
                          }
                          className="text-white/60 hover:text-red-400 text-sm"
                          aria-label="Usuń wiadomość"
                        >
                          ×
                        </button>
                        {pendingDeleteId === msg.id && (
                          <div className="flex items-center gap-1 text-[10px] text-white/70">
                            Potwierdzić?
                            <button
                              type="button"
                              className="px-1 py-[2px] rounded bg-red-600 text-white"
                              onClick={() => handleRemoveMessage(msg.id)}
                            >
                              Tak
                            </button>
                            <button
                              type="button"
                              className="px-1 py-[2px] rounded bg-white/10"
                              onClick={() => setPendingDeleteId(null)}
                            >
                              Nie
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {isAdmin && !isSystem && (
                    <div className="flex gap-2 justify-end">
                      {msg.author && !isProtectedAccount(msg.author) && (
                        <button
                          type="button"
                          className="text-xs px-2 py-1 rounded bg-orange-500/20 hover:bg-orange-500/30 border border-orange-400/40 text-orange-200"
                          onClick={() => handleMuteAuthor(msg.author)}
                        >
                          Wycisz autora (24h)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="border-t border-white/10 p-3 flex flex-col gap-2">
          <div className="flex items-end gap-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              placeholder="Napisz wiadomość"
              onKeyDown={handleKeyDown}
            />
            <button
              type="submit"
              className="flex items-center justify-center h-10 w-10 rounded-full bg-red-600 hover:bg-red-500 text-white transition-colors"
              aria-label="Wyślij wiadomość"
            >
              ➤
            </button>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          {feedback && <p className="text-xs text-green-400">{feedback}</p>}
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;
