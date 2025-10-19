import React, { useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { useAppContext } from '../context/AppContext';

const LoginPage = () => {
  const { login, isAuthenticated } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [basicCaptchaChecked, setBasicCaptchaChecked] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [formMessage, setFormMessage] = useState('');

  const [isResetMode, setIsResetMode] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCaptchaToken, setResetCaptchaToken] = useState(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const captchaRef = useRef(null);
  const resetCaptchaRef = useRef(null);

  if (isAuthenticated) {
    const redirectTo = location.state?.from?.pathname || '/';
    navigate(redirectTo, { replace: true });
    return null;
  }

  const validateUsername = (value) => /^[A-Za-z0-9]{1,15}$/.test(value);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormMessage('');

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setFormMessage('Podaj login.');
      return;
    }
    if (!validateUsername(trimmedUsername)) {
      setFormMessage('Login może zawierać maksymalnie 15 liter/cyfr (bez spacji i znaków specjalnych).');
      return;
    }
    if (password.length < 6) {
      setFormMessage('Hasło musi mieć co najmniej 6 znaków.');
      return;
    }
    if (!basicCaptchaChecked) {
      setFormMessage('Potwierdź podstawową reCAPTCHA.');
      return;
    }
    if (recaptchaSiteKey && !captchaToken) {
      setFormMessage('Potwierdź reCAPTCHA.');
      return;
    }

    try {
      login({ username: trimmedUsername, password });
      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo, { replace: true });
      if (recaptchaSiteKey) {
        captchaRef.current?.reset();
        setCaptchaToken(null);
      }
      setBasicCaptchaChecked(false);
    } catch (error) {
      setFormMessage(error.message || 'Nie udało się zalogować.');
    }
  };

  const resetState = () => {
    setResetStep(1);
    setResetEmail('');
    setResetCaptchaToken(null);
    setGeneratedCode('');
    setEnteredCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setResetMessage('');
    resetCaptchaRef.current?.reset();
  };

  const handleSendResetCode = () => {
    setResetMessage('');
    if (!resetEmail.trim()) {
      setResetMessage('Podaj adres email.');
      return;
    }
    if (!resetCaptchaToken) {
      setResetMessage('Potwierdź reCAPTCHA przed wysłaniem kodu.');
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setResetStep(2);
    setResetMessage(`Kod potwierdzający został wysłany na ${resetEmail}. (Demo: ${code})`);
    resetCaptchaRef.current?.reset();
    setResetCaptchaToken(null);
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    setResetMessage('');

    if (enteredCode.trim() !== generatedCode) {
      setResetMessage('Nieprawidłowy kod potwierdzający.');
      return;
    }
    if (newPassword.length < 6) {
      setResetMessage('Nowe hasło musi mieć co najmniej 6 znaków.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setResetMessage('Hasła muszą być identyczne.');
      return;
    }

    setResetMessage('Hasło zostało zresetowane (tryb demo). Możesz się teraz zalogować.');
    resetState();
    setIsResetMode(false);
  };

  return (
    <div className="min-h-[80vh] bg-brand-bg text-white flex items-center justify-center px-4 md:px-6 lg:px-8">
      <div className="w-full max-w-md pt-[calc(64px+env(safe-area-inset-top))] pb-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Zaloguj się</h1>
        {!isResetMode ? (
          <form onSubmit={handleSubmit} className="bg-black/50 border border-white/10 rounded-2xl p-4 md:p-6 backdrop-blur-sm">
            <div className="mb-4">
              <label className="block text-sm mb-1" htmlFor="username">Login</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={15}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm mb-1" htmlFor="password">Hasło</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-xs"
                >
                  {showPassword ? 'Ukryj' : 'Pokaż'}
                </button>
              </div>
            </div>
            <div className="mb-3 flex items-center gap-2 bg-zinc-800/70 border border-zinc-700 rounded-lg px-3 py-2">
              <input
                id="basic-captcha-login"
                type="checkbox"
                checked={basicCaptchaChecked}
                onChange={(e) => setBasicCaptchaChecked(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="basic-captcha-login" className="text-xs text-white/70">
                Potwierdź, że jesteś człowiekiem (podstawowa reCAPTCHA).
              </label>
            </div>
            <div className="mb-4">
              {recaptchaSiteKey ? (
                <ReCAPTCHA
                  ref={captchaRef}
                  sitekey={recaptchaSiteKey}
                  onChange={setCaptchaToken}
                  onExpired={() => setCaptchaToken(null)}
                  theme="dark"
                />
              ) : (
                <p className="text-xs text-white/70">
                  Korzystasz z uproszczonej reCAPTCHA — zaznacz pole powyżej, aby kontynuować.
                </p>
              )}
            </div>
            {formMessage && (
              <div className="text-sm text-red-400 mb-3">{formMessage}</div>
            )}
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-500 transition-colors font-semibold rounded-lg px-4 py-2"
            >
              Zaloguj się
            </button>
            <div className="mt-4 text-sm text-white/70">
              <div className="flex items-center justify-between gap-3">
                <span>Nie masz konta? <Link to="/register" className="font-semibold text-white hover:underline">Stwórz</Link> je teraz.</span>
                <div className="flex items-center gap-1 text-white/80">
                  <span>Nie pamiętasz hasła?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetMode(true);
                      resetState();
                    }}
                    className="text-white hover:underline"
                  >
                    Resetuj hasło
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="bg-black/50 border border-white/10 rounded-2xl p-4 md:p-6 backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-4 text-center">Reset hasła</h2>
            {resetMessage && (
              <div className="text-sm mb-3 text-white/80">{resetMessage}</div>
            )}
            {resetStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1" htmlFor="reset-email">Email</label>
                  <input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    placeholder="twoj@email.com"
                    required
                  />
                </div>
                <div>
                  {recaptchaSiteKey ? (
                    <ReCAPTCHA
                      ref={resetCaptchaRef}
                      sitekey={recaptchaSiteKey}
                      onChange={setResetCaptchaToken}
                      onExpired={() => setResetCaptchaToken(null)}
                      theme="dark"
                    />
                  ) : (
                    <p className="text-xs text-red-400">
                      Skonfiguruj zmienną środowiskową `VITE_RECAPTCHA_SITE_KEY`, aby włączyć reCAPTCHA.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSendResetCode}
                  className="w-full bg-red-600 hover:bg-red-500 transition-colors font-semibold rounded-lg px-4 py-2"
                >
                  Wyślij kod
                </button>
              </div>
            )}
            {resetStep === 2 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm mb-1" htmlFor="reset-code">Kod potwierdzający</label>
                  <input
                    id="reset-code"
                    type="text"
                    value={enteredCode}
                    onChange={(e) => setEnteredCode(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    placeholder="Wpisz otrzymany kod"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" htmlFor="new-password">Nowe hasło</label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" htmlFor="confirm-new-password">Potwierdź nowe hasło</label>
                  <input
                    id="confirm-new-password"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-500 transition-colors font-semibold rounded-lg px-4 py-2"
                  >
                    Ustaw nowe hasło
                  </button>
                  <button
                    type="button"
                    onClick={resetState}
                    className="text-left text-white/70 hover:underline"
                  >
                    Wyślij kod ponownie
                  </button>
                </div>
              </form>
            )}
            <button
              type="button"
              onClick={() => {
                setIsResetMode(false);
                resetState();
              }}
              className="mt-4 text-white hover:underline"
            >
              Powrót do logowania
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
