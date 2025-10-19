import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

const ChangePasswordModal = ({ isOpen, onClose, onBack }) => {
  const { user, changePassword } = useAppContext();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen) {
    return null;
  }

  const validateInputs = () => {
    if (newPassword !== confirmPassword) {
      setError('Nowe hasła muszą być identyczne.');
      return false;
    }
    return true;
  };

  const performChange = () => {
    try {
      changePassword({
        username: user?.username,
        currentPassword,
        newPassword,
      });
      setSuccess('Hasło zostało zmienione.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowConfirm(false);
    } catch (err) {
      setError(err.message || 'Nie udało się zmienić hasła.');
      setShowConfirm(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateInputs()) {
      setShowConfirm(false);
      return;
    }

    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    performChange();
  };

  const handleConfirm = () => {
    setError('');
    setSuccess('');
    if (!validateInputs()) {
      setShowConfirm(false);
      return;
    }
    performChange();
  };

  const handleCancelConfirm = () => {
    setShowConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} role="presentation" />
      <div className="absolute right-4 top-16 w-[22rem] max-w-[calc(100vw-2rem)] bg-zinc-950/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl text-white flex flex-col">
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
          <button
            type="button"
            onClick={onBack || onClose}
            className="text-white/70 hover:text-white text-lg"
            aria-label="Powrót do panelu"
          >
            ←
          </button>
          <h2 className="text-lg font-semibold text-right flex-1">Zmień hasło</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span>Obecne hasło</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setShowConfirm(false);
              }}
              className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Nowe hasło</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setShowConfirm(false);
              }}
              minLength={6}
              className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Potwierdź nowe hasło</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setShowConfirm(false);
              }}
              minLength={6}
              className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </label>
          {error && <p className="text-xs text-red-400">{error}</p>}
          {success && <p className="text-xs text-green-400">{success}</p>}
          <div className="flex items-center justify-between gap-3">
            {showConfirm ? (
              <div className="flex items-center gap-2 text-xs text-white/80">
                <span>Potwierdzić zmianę hasła?</span>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white cursor-pointer"
                >
                  Tak
                </button>
                <button
                  type="button"
                  onClick={handleCancelConfirm}
                  className="px-2 py-1 rounded bg-zinc-600 hover:bg-zinc-500 text-white cursor-pointer"
                >
                  Nie
                </button>
              </div>
            ) : (
              <span className="text-xs text-white/40">&nbsp;</span>
            )}
            <button
              type="submit"
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                showConfirm
                  ? 'bg-zinc-800 text-zinc-400 cursor-default'
                  : 'bg-red-600 hover:bg-red-500 text-white cursor-pointer'
              }`}
              disabled={showConfirm}
            >
              Zapisz
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
