import React, { useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { useAppContext } from '../context/AppContext';

const RegisterPage = () => {
  const { isAuthenticated, registerUser, login } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [basicCaptchaChecked, setBasicCaptchaChecked] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [formMessage, setFormMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validateUsername = (value) => /^[A-Za-z0-9]{1,15}$/.test(value);

  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const captchaRef = useRef(null);

  if (isAuthenticated) {
    const redirectTo = location.state?.from?.pathname || '/';
    navigate(redirectTo, { replace: true });
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormMessage('');
    setSuccessMessage('');

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
    if (password !== confirmPassword) {
      setFormMessage('Hasła muszą być takie same.');
      return;
    }
    if (!inviteCode.trim()) {
      setFormMessage('Podaj kod rejestracyjny otrzymany od administratora.');
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
      registerUser({ username: trimmedUsername, email: email.trim(), password, inviteCode });
      setSuccessMessage('Konto zostało utworzone. Możesz się teraz zalogować.');
      if (recaptchaSiteKey) {
        captchaRef.current?.reset();
        setCaptchaToken(null);
      }
      setBasicCaptchaChecked(false);
      setInviteCode('');
    } catch (error) {
      setFormMessage(error.message || 'Nie udało się utworzyć konta.');
    }
  };

  return (
    <div className="min-h-[80vh] bg-brand-bg text-white flex items-center justify-center px-4 md:px-6 lg:px-8">
      <div className="w-full max-w-md pt-[calc(64px+env(safe-area-inset-top))] pb-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Zarejestruj się</h1>
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
              placeholder="np. ChillUser"
              required
            />
            <p className="text-xs text-white/60 mt-1">Maksymalnie 15 znaków (litery/cyfry).</p>
          </div>
          <div className="mb-4">
            <label className="block text-sm mb-1" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
              placeholder="twoj@email.com"
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
                placeholder="••••••••"
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
            <p className="text-xs text-white/60 mt-1">Minimum 6 znaków.</p>
          </div>
          <div className="mb-5">
            <label className="block text-sm mb-1" htmlFor="confirmPassword">Potwierdź hasło</label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>
          <div className="mb-3 flex items-center gap-2 bg-zinc-800/70 border border-zinc-700 rounded-lg px-3 py-2">
            <input
              id="basic-captcha-register"
              type="checkbox"
              checked={basicCaptchaChecked}
              onChange={(e) => setBasicCaptchaChecked(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="basic-captcha-register" className="text-xs text-white/70">
              Potwierdź, że jesteś człowiekiem (podstawowa reCAPTCHA).
            </label>
          </div>
          <div className="mb-4">
            <label className="block text-sm mb-1" htmlFor="inviteCode">Kod rejestracyjny</label>
            <input
              id="inviteCode"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
              placeholder="Wprowadź kod od administratora"
              required
            />
            <p className="text-xs text-white/60 mt-1">Kod dostępu generowany przez administratora jest wymagany, aby założyć konto.</p>
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
            Stwórz konto
          </button>
          <div className="mt-4 text-sm text-white/70 text-left">
            Masz już konto? <Link to="/login" className="font-semibold text-white hover:underline">Zaloguj się</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
