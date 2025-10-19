import React, { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';

const HelpModal = ({ isOpen, onClose, onBack }) => {
  const {
    user,
    helpMessages,
    submitHelpMessage,
    removeHelpMessage,
    updateHelpMessageStatus,
    muteUserForHours,
    isProtectedAccount,
  } = useAppContext();
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const sortedMessages = useMemo(
    () => [...helpMessages].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [helpMessages]
  );

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setFeedback('');
    setError('');

    try {
      submitHelpMessage({ author: user?.username || 'Anonimowy', text: message });
      setMessage('');
      setFeedback('Wysłano informację do admina. Dziękujemy za pomoc.');
    } catch (err) {
      setError(err.message || 'Nie udało się wysłać wiadomości.');
    }
  };

  const handleRemove = (id) => {
    setFeedback('');
    removeHelpMessage(id);
    setFeedback('Zgłoszenie zostało usunięte.');
  };

  const handleMute = (username) => {
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
          <h2 className="text-lg font-semibold text-right flex-1">Pomoc</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {!isAdmin ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="flex flex-col gap-1 text-sm">
                <span>Opisz problem</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Napisz wiadomość do administratora"
                  required
                />
              </label>
              {error && <p className="text-xs text-red-400">{error}</p>}
              {feedback && <p className="text-xs text-green-400">{feedback}</p>}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-yellow-500 hover:bg-yellow-400 text-black"
                >
                  Wyślij
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {sortedMessages.length === 0 ? (
                <p className="text-sm text-white/60">Brak zgłoszeń od użytkowników.</p>
              ) : (
                sortedMessages.map((msg) => {
                  return (
                    <div
                      key={msg.id}
                      className={`border rounded-md p-3 space-y-2 ${
                        msg.status === 'done'
                          ? 'border-green-500/50 bg-green-500/10'
                          : msg.status === 'rejected'
                          ? 'border-red-500/50 bg-red-500/10'
                          : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">{msg.author}</p>
                          <p className="text-xs text-white/60">{new Date(msg.createdAt).toLocaleString('pl-PL')}</p>
                        </div>
                        <span className="text-[11px] uppercase tracking-wide text-white/60">
                          {msg.status === 'done'
                            ? 'Zatwierdzone'
                            : msg.status === 'rejected'
                            ? 'Odrzucone'
                            : 'Oczekujące'}
                        </span>
                      </div>
                      <p className="text-sm text-white/80 whitespace-pre-wrap">{msg.text}</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="px-3 py-1 text-xs rounded-md bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-200 font-semibold"
                          onClick={() => handleRemove(msg.id)}
                        >
                          Usuń
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1 text-xs rounded-md bg-green-600/20 hover:bg-green-600/30 border border-green-500/40 text-green-200 font-semibold cursor-pointer"
                          onClick={() => updateHelpMessageStatus(msg.id, 'done')}
                        >
                          Zatwierdź
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1 text-xs rounded-md bg-zinc-600/30 hover:bg-zinc-600/40 border border-zinc-500/40 text-zinc-200 font-semibold cursor-pointer"
                          onClick={() => updateHelpMessageStatus(msg.id, 'pending')}
                        >
                          Oczekuje
                        </button>
                        {msg.author && !isProtectedAccount(msg.author) && (
                          <button
                            type="button"
                            className="px-3 py-1 text-xs rounded-md bg-orange-500/20 hover:bg-orange-500/30 border border-orange-400/40 text-orange-200 font-semibold"
                            onClick={() => handleMute(msg.author)}
                          >
                            Wycisz autora (24h)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              {error && <p className="text-xs text-red-400">{error}</p>}
              {feedback && <p className="text-xs text-green-400">{feedback}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
