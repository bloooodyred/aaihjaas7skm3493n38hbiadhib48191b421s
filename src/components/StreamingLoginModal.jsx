import React, { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../context/AppContext";

const STREAMING_SERVICES = [
  { id: "filman", name: "Filman.cc", allowGuest: false },
  { id: "obejrzyjto", name: "Oglądaj.TV", allowGuest: true },
];

const StreamingLoginModal = ({ isOpen, onClose, onBack }) => {
  const {
    streamingLogins = {},
    saveStreamingLogin,
    removeStreamingLogin,
  } = useAppContext();
  const [selectedService, setSelectedService] = useState(STREAMING_SERVICES[0].id);
  const [loginMode, setLoginMode] = useState("account");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const currentServiceConfig = useMemo(
    () => STREAMING_SERVICES.find((service) => service.id === selectedService),
    [selectedService]
  );

  useEffect(() => {
    const stored = streamingLogins[selectedService];
    if (stored) {
      setLoginMode(stored.mode || "account");
      setUsername(stored.username || "");
      setPassword(stored.password || "");
    } else {
      setLoginMode("account");
      setUsername("");
      setPassword("");
    }
    setStatus("");
    setError("");
  }, [selectedService, streamingLogins]);

  if (!isOpen) {
    return null;
  }

  const handleSave = (event) => {
    event.preventDefault();
    setStatus("");
    setError("");
    try {
      saveStreamingLogin({
        serviceId: selectedService,
        username: loginMode === "account" ? username : "",
        password: loginMode === "account" ? password : "",
        loginMode,
      });
      setStatus("Dane zostały zapisane lokalnie.");
    } catch (err) {
      setError(err.message || "Nie udało się zapisać danych.");
    }
  };

  const handleRemove = () => {
    setStatus("");
    setError("");
    removeStreamingLogin(selectedService);
    setUsername("");
    setPassword("");
    setLoginMode("account");
    setStatus("Dane logowania zostały usunięte.");
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        role="presentation"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg mx-4 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl text-white">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Logowanie do serwisów streamingowych</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-sm bg-white/10 hover:bg-white/20 rounded-lg px-3 py-1"
              onClick={onBack}
            >
              Wróć
            </button>
            <button
              type="button"
              className="text-xl text-white/60 hover:text-white"
              onClick={onClose}
              aria-label="Zamknij"
            >
              ×
            </button>
          </div>
        </div>
        <div className="px-5 py-4 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="bg-blue-500/10 border border-blue-500/40 rounded-lg p-3 text-sm text-blue-100">
            <p>
              Te dane są przechowywane wyłącznie w Twojej przeglądarce. Aby odtwarzać
              treści z Filman lub Oglądaj.TV, nadal potrzebna jest warstwa serwerowa,
              która zaloguje się w tle i przygotuje strumień dla aplikacji.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="stream-service" className="text-sm font-semibold">
                Serwis
              </label>
              <select
                id="stream-service"
                value={selectedService}
                onChange={(event) => setSelectedService(event.target.value)}
                className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {STREAMING_SERVICES.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold">Tryb logowania</span>
              <div className="flex gap-3 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    value="account"
                    checked={loginMode === "account"}
                    onChange={() => setLoginMode("account")}
                  />
                  <span>Z użyciem konta</span>
                </label>
                {currentServiceConfig?.allowGuest && (
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      value="guest"
                      checked={loginMode === "guest"}
                      onChange={() => setLoginMode("guest")}
                    />
                    <span>Gość (jeśli dostępne)</span>
                  </label>
                )}
              </div>
            </div>

            {loginMode === "account" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span>Nazwa użytkownika / e-mail</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span>Hasło</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                </label>
              </div>
            ) : (
              <div className="text-sm text-white/70">
                Logowanie jako gość nie wymaga uzupełniania danych. Zostanie zapisana
                jedynie informacja o wybranym trybie.
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg text-sm font-semibold"
              >
                Zapisz
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
              >
                Usuń dane
              </button>
            </div>
          </form>

          {(status || error) && (
            <div
              className={`text-sm rounded-lg px-3 py-2 border ${
                error
                  ? "border-red-500/60 bg-red-500/10 text-red-200"
                  : "border-green-500/60 bg-green-500/10 text-green-200"
              }`}
            >
              {error || status}
            </div>
          )}

          <div className="border border-white/10 rounded-lg p-3 text-sm text-white/80">
            <h3 className="text-base font-semibold mb-2">Zapisane ustawienia</h3>
            {STREAMING_SERVICES.map((service) => {
              const data = streamingLogins[service.id];
              return (
                <div
                  key={service.id}
                  className="flex flex-col gap-1 py-2 border-b border-white/5 last:border-b-0"
                >
                  <span className="font-semibold">{service.name}</span>
                  {data ? (
                    <>
                      <span>Tryb: {data.mode === "guest" ? "Gość" : "Konto"}</span>
                      {data.mode !== "guest" && (
                        <span>Użytkownik: {data.username || "(nieustawione)"}</span>
                      )}
                      <span>
                        Ostatnia aktualizacja: {new Date(data.updatedAt).toLocaleString("pl-PL")}
                      </span>
                    </>
                  ) : (
                    <span className="text-white/60">Brak zapisanych danych.</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamingLoginModal;
