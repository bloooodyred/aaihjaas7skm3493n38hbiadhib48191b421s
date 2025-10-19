import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppContext } from '../context/AppContext';

const AccountDrawer = ({
  isOpen,
  onClose,
  onOpenChat,
  onOpenChangePassword,
  onOpenHelp,
  onOpenStreamingLogins,
}) => {
  const {
    user,
    users,
    logout,
    blockUserForDays,
    removeUserAccount,
    isProtectedAccount,
    adminResetPassword,
    muteUserForHours,
    clearUserMute,
    inviteCodes,
    createInviteCode,
    revokeInviteCode,
    unblockUser,
  } = useAppContext();
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const otherUsers = useMemo(() => users.filter((u) => u.username !== user?.username), [users, user]);
  const availableCodes = useMemo(() => inviteCodes.filter((code) => !code.used), [inviteCodes]);
  const usedCodes = useMemo(() => inviteCodes.filter((code) => code.used), [inviteCodes]);
  const [showAdminUsers, setShowAdminUsers] = useState(true);
  const [showInviteCodes, setShowInviteCodes] = useState(false);
  const [confirmRemoveUser, setConfirmRemoveUser] = useState(null);
  const [confirmResetUser, setConfirmResetUser] = useState(null);

  if (!isOpen) {
    return null;
  }

  const handleLogout = () => {
    logout();
    onClose?.();
  };

  const handleBlock = (username) => {
    setStatusMessage('');
    setErrorMessage('');
    try {
      const blockedUntil = blockUserForDays(username, 3);
      setStatusMessage(`Użytkownik ${username} został zablokowany do ${new Date(blockedUntil).toLocaleString('pl-PL')}.`);
    } catch (error) {
      setStatusMessage(error.message || 'Nie udało się zablokować użytkownika.');
    }
  };

  const handleRemove = (username) => {
    setStatusMessage('');
    setErrorMessage('');
    try {
      removeUserAccount(username);
      setStatusMessage(`Użytkownik ${username} został usunięty.`);
      setConfirmRemoveUser(null);
    } catch (error) {
      setStatusMessage(error.message || 'Nie udało się usunąć użytkownika.');
    }
  };

  const handleMute = (username) => {
    setStatusMessage('');
    setErrorMessage('');
    try {
      muteUserForHours(username, 24);
      setStatusMessage(`Użytkownik ${username} został wyciszony na 24h.`);
    } catch (error) {
      setErrorMessage(error.message || 'Nie udało się wyciszyć użytkownika.');
    }
  };

  const handleUnmute = (username) => {
    setStatusMessage('');
    setErrorMessage('');
    try {
      clearUserMute(username);
      setStatusMessage(`Wyciszenie użytkownika ${username} zostało usunięte.`);
    } catch (error) {
      setErrorMessage(error.message || 'Nie udało się usunąć wyciszenia.');
    }
  };

  const handleResetPasswordSubmit = (e) => {
    e.preventDefault();
    if (!resetTarget) return;
    setStatusMessage('');
    setErrorMessage('');

    if (confirmResetUser !== resetTarget) {
      setConfirmResetUser(resetTarget);
      return;
    }

    finalizePasswordReset();
  };

  const finalizePasswordReset = () => {
    if (!resetTarget) return;
    try {
      adminResetPassword({ targetUsername: resetTarget, newPassword: resetPassword });
      setStatusMessage(`Hasło użytkownika ${resetTarget} zostało zresetowane.`);
      setResetTarget(null);
      setResetPassword('');
      setConfirmResetUser(null);
    } catch (error) {
      setErrorMessage(error.message || 'Nie udało się zresetować hasła.');
      setConfirmResetUser(null);
    }
  };

  const handleCreateInviteCode = () => {
    setStatusMessage('');
    setErrorMessage('');
    try {
      const code = createInviteCode();
      setStatusMessage(`Utworzono kod: ${code}`);
    } catch (error) {
      setErrorMessage(error.message || 'Nie udało się utworzyć kodu.');
    }
  };

  const handleRevokeCode = (code) => {
    setStatusMessage('');
    setErrorMessage('');
    try {
      revokeInviteCode(code);
      setStatusMessage(`Kod ${code} został usunięty.`);
    } catch (error) {
      setErrorMessage(error.message || 'Nie udało się usunąć kodu.');
    }
  };

  const handleUnblock = (username) => {
    setStatusMessage('');
    setErrorMessage('');
    try {
      unblockUser(username);
      setStatusMessage(`Odblokowano użytkownika ${username}.`);
    } catch (error) {
      setErrorMessage(error.message || 'Nie udało się odblokować użytkownika.');
    }
  };

  const formatTimeDifference = (from) => {
    if (!from) return null;
    const fromDate = new Date(from);
    if (Number.isNaN(fromDate.getTime())) return null;
    let diffMs = Date.now() - fromDate.getTime();
    if (diffMs < 0) diffMs = 0;
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const formatTimeLeft = (until) => {
    if (!until) return null;
    const untilDate = new Date(until);
    if (Number.isNaN(untilDate.getTime())) return null;
    let diffMs = untilDate.getTime() - Date.now();
    if (diffMs <= 0) return '0m';
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        role="presentation"
      />
      <aside className="absolute right-4 top-16 w-[20rem] max-w-[calc(100vw-2rem)] max-h-[65vh] bg-zinc-950/95 backdrop-blur-xl border border-white/10 text-white shadow-2xl rounded-2xl flex flex-col">
        <div className="px-4 py-3 border-b border-white/10 flex items-start justify-between">
          <div>
            <p className="text-sm text-white/60">Zalogowano jako</p>
            <p className="text-base font-semibold">{user?.username}</p>
            <p className="text-xs text-white/50 uppercase tracking-wide">{user?.role || 'user'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white text-xl"
            aria-label="Zamknij panel"
          >
            ×
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3 overflow-y-auto">
          <div className="border border-white/10 rounded-lg p-3">
            <h2 className="text-sm font-semibold mb-2">Opcje konta</h2>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full bg-red-600 hover:bg-red-500 transition-colors rounded-lg py-1.5 text-xs font-semibold cursor-pointer"
              >
                Wyloguj się
              </button>
              <button
                type="button"
                onClick={onOpenChangePassword}
                className="w-full bg-white/10 hover:bg-white/20 transition-colors rounded-lg py-1.5 text-xs cursor-pointer"
              >
                Zmień hasło
              </button>
              <button
                type="button"
                onClick={onOpenChat}
                className="w-full bg-white/10 hover:bg-white/20 transition-colors rounded-lg py-1.5 text-xs cursor-pointer"
              >
                Otwórz czat grupowy
              </button>
              <button
                type="button"
                onClick={onOpenHelp}
                className="w-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors rounded-lg py-1.5 text-xs font-semibold text-black cursor-pointer"
              >
                Pomoc
              </button>
              <button
                type="button"
                onClick={onOpenStreamingLogins}
                className="w-full bg-green-500/80 hover:bg-green-500 transition-colors rounded-lg py-1.5 text-xs font-semibold text-black cursor-pointer"
              >
                Logowanie do serwisów
              </button>
            </div>
          </div>

          {user?.role === 'admin' && (
            <div className="border border-white/10 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold">Panel administratora</h2>
                <button
                  type="button"
                  onClick={() => setShowAdminUsers((prev) => !prev)}
                  className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 cursor-pointer"
                >
                  {showAdminUsers ? 'Ukryj' : 'Pokaż'}
                </button>
              </div>
              {showAdminUsers && (
                otherUsers.length === 0 ? (
                  <p className="text-sm text-white/60">Brak innych kont użytkowników.</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
                    {otherUsers.map((item) => {
                      const isBlocked = item.blockedUntil && new Date(item.blockedUntil) > new Date();
                      const isMuted = item.mutedUntil && new Date(item.mutedUntil) > new Date();
                      const blockedFor = item.blockedAt ? formatTimeDifference(item.blockedAt) : null;
                      const muteFor = item.mutedAt ? formatTimeDifference(item.mutedAt) : null;
                      const blockLeft = isBlocked ? formatTimeLeft(item.blockedUntil) : null;
                      const muteLeft = isMuted ? formatTimeLeft(item.mutedUntil) : null;
                      return (
                        <div
                          key={item.username}
                          className="border border-white/10 rounded-md p-2 bg-white/5"
                        >
                          <div className="flex flex-col gap-0.5">
                            <p className="text-sm font-semibold">{item.username}</p>
                            <p className="text-[11px] text-white/60">{item.email}</p>
                            <p className="text-[11px] text-white/60 uppercase tracking-wide">{item.role || 'user'}</p>
                            {isBlocked && (
                              <div className="text-[11px] text-amber-300">
                                <p>Zablokowane do {new Date(item.blockedUntil).toLocaleString('pl-PL')}</p>
                                <p>Blokada trwa: {blockedFor || '–'} | Pozostało: {blockLeft || '0m'}</p>
                              </div>
                            )}
                            {isMuted && (
                              <div className="text-[11px] text-orange-200">
                                <p>Wyciszenie do {new Date(item.mutedUntil).toLocaleString('pl-PL')}</p>
                                <p>Wyciszone od: {muteFor || '–'} | Pozostało: {muteLeft || '0m'}</p>
                              </div>
                            )}
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-md"
                              onClick={() => handleBlock(item.username)}
                              disabled={isProtectedAccount(item.username)}
                            >
                              Zablokuj (3 dni)
                            </button>
                            {isBlocked && (
                              <button
                                type="button"
                                className="bg-amber-500/20 hover:bg-amber-500/40 border border-amber-300/40 text-amber-100 text-[11px] font-semibold px-2.5 py-0.5 rounded-md"
                                onClick={() => handleUnblock(item.username)}
                              >
                                Odblokuj
                              </button>
                            )}
                            <button
                              type="button"
                              className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-md"
                              onClick={() => {
                                if (confirmRemoveUser === item.username) {
                                  handleRemove(item.username);
                                } else {
                                  setConfirmRemoveUser(item.username);
                                }
                              }}
                              disabled={isProtectedAccount(item.username)}
                            >
                              {confirmRemoveUser === item.username ? 'Potwierdź' : 'Usuń konto'}
                            </button>
                            <button
                              type="button"
                              className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/40 text-blue-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-md"
                              onClick={() => setResetTarget(item.username)}
                            >
                              Resetuj hasło
                            </button>
                            {isMuted ? (
                              <button
                                type="button"
                                className="bg-green-500/20 hover:bg-green-500/30 border border-green-400/40 text-green-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-md"
                                onClick={() => handleUnmute(item.username)}
                              >
                                Usuń wyciszenie
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="bg-orange-500/20 hover:bg-orange-500/30 border border-orange-400/40 text-orange-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-md"
                                onClick={() => handleMute(item.username)}
                                disabled={isProtectedAccount(item.username)}
                              >
                                Wycisz (24h)
                              </button>
                            )}
                          </div>
                          {resetTarget === item.username && (
                            <form onSubmit={handleResetPasswordSubmit} className="mt-1.5 space-y-2 bg-black/30 border border-white/10 rounded-md p-2">
                              <label className="flex flex-col gap-1 text-xs">
                                <span>Nowe hasło dla {item.username}</span>
                                <input
                                  type="password"
                                  value={resetPassword}
                                  onChange={(e) => setResetPassword(e.target.value)}
                                  minLength={6}
                                  className="bg-black/60 border border-white/10 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                  required
                                />
                              </label>
                              <div className="flex gap-1.5 justify-end">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setResetTarget(null);
                                    setResetPassword('');
                                    setConfirmResetUser(null);
                                  }}
                                  className="px-2 py-0.5 text-[11px] rounded-md bg-white/10 hover:bg-white/20"
                                >
                                  Anuluj
                                </button>
                                <button
                                  type="submit"
                                  className="px-2 py-0.5 text-[11px] rounded-md bg-blue-500 hover:bg-blue-400 text-white font-semibold"
                                >
                                  Zapisz
                                </button>
                              </div>
                              {confirmResetUser === item.username && (
                                <div className="flex items-center gap-1.5 text-[11px] text-white/70">
                                  <span>Potwierdzić reset?</span>
                                  <button
                                    type="button"
                                    className="px-2 py-0.5 rounded bg-blue-500 hover:bg-blue-400 text-white"
                                    onClick={finalizePasswordReset}
                                  >
                                    Tak
                                  </button>
                                  <button
                                    type="button"
                                    className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20"
                                    onClick={() => setConfirmResetUser(null)}
                                  >
                                    Nie
                                  </button>
                                </div>
                              )}
                            </form>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              )}
              <div className="mt-3 border-t border-white/10 pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Kody rejestracyjne</h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowInviteCodes((prev) => !prev)}
                      className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 cursor-pointer"
                    >
                      {showInviteCodes ? 'Ukryj' : 'Pokaż'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateInviteCode}
                      className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer"
                    >
                      Generuj
                    </button>
                  </div>
                </div>
                {showInviteCodes && (
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-white/60 uppercase mb-1">Aktywne</p>
                      {availableCodes.length === 0 ? (
                        <p className="text-xs text-white/50">Brak aktywnych kodów.</p>
                      ) : (
                        <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                          {availableCodes.map((code) => (
                            <div
                              key={code.code}
                              className="flex items-center justify-between text-xs bg-white/5 border border-white/10 rounded px-2 py-1"
                            >
                              <span className="font-mono text-sm text-white/90">{code.code}</span>
                              <button
                                type="button"
                                onClick={() => handleRevokeCode(code.code)}
                                className="text-red-400 hover:text-red-300 font-semibold"
                              >
                                Usuń
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-white/60 uppercase mb-1">Wykorzystane</p>
                      {usedCodes.length === 0 ? (
                        <p className="text-xs text-white/50">Brak wykorzystanych kodów.</p>
                      ) : (
                        <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                          {usedCodes.map((code) => (
                            <div
                              key={code.code}
                              className="flex items-center justify-between text-xs bg-green-600/10 border border-green-500/20 rounded px-2 py-1"
                            >
                              <span className="font-mono text-sm text-green-200">{code.code}</span>
                              <span className="text-[10px] text-green-300">
                                {code.usedAt ? new Date(code.usedAt).toLocaleString('pl-PL') : 'Wykorzystany'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {statusMessage && (
            <div className="text-xs text-white/80 bg-white/5 border border-white/10 rounded-md p-3">
              {statusMessage}
            </div>
          )}
          {errorMessage && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/40 rounded-md p-3">
              {errorMessage}
            </div>
          )}
        </div>
      </aside>
    </div>,
    document.body
  );
};

export default AccountDrawer;
