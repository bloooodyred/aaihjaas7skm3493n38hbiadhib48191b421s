// src/context/AppContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/tmdbApi'; // For fetching API configuration
import { INITIAL_ACCOUNTS } from '../data/accounts';

export const AppContext = createContext();

const mergeInitialAccounts = (accounts = []) => {
  const map = new Map(
    INITIAL_ACCOUNTS.map((account) => [account.username.toLowerCase(), account])
  );

  accounts.forEach((account) => {
    if (account && account.username) {
      map.set(account.username.toLowerCase(), account);
    }
  });

  return Array.from(map.values());
};

const loadUsers = () => {
  try {
    const stored = localStorage.getItem('auth_users_db');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return mergeInitialAccounts(parsed);
      }
    }
  } catch (error) {
    console.error('Failed to parse auth_users_db from storage', error);
  }
  return mergeInitialAccounts();
};

const loadChatMessages = () => {
  try {
    const stored = localStorage.getItem('chat_messages');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to parse chat_messages from storage', error);
  }
  return [];
};

const loadChatLastRead = () => {
  try {
    const stored = localStorage.getItem('chat_last_read');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to parse chat_last_read from storage', error);
  }
  return {};
};

const loadHelpMessages = () => {
  try {
    const stored = localStorage.getItem('help_messages');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to parse help_messages from storage', error);
  }
  return [];
};

const loadInviteCodes = () => {
  try {
    const stored = localStorage.getItem('auth_invite_codes');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to parse auth_invite_codes from storage', error);
  }
  return [];
};

const loadStreamingLogins = () => {
  try {
    const stored = localStorage.getItem('streaming_logins');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to parse streaming_logins from storage', error);
  }
  return {};
};

const generateRandomCode = (length = 12) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const AppProvider = ({ children }) => {
  const [apiConfig, setApiConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [users, setUsers] = useState(loadUsers);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to read auth_user from storage', error);
      return null;
    }
  });
  const [chatMessages, setChatMessages] = useState(loadChatMessages);
  const [chatLastRead, setChatLastRead] = useState(loadChatLastRead);
  const [helpMessages, setHelpMessages] = useState(loadHelpMessages);
  const [inviteCodes, setInviteCodes] = useState(loadInviteCodes);
  const [streamingLogins, setStreamingLogins] = useState(loadStreamingLogins);
  const isAuthenticated = !!user;

  useEffect(() => {
    api
      .get('/configuration')
      .then((res) => {
        setApiConfig(res.data);
        setLoadingConfig(false);
      })
      .catch((err) => {
        console.error('Failed to fetch TMDB config:', err);
        // Fallback config (less ideal but good for dev if API fails)
        setApiConfig({
          images: {
            base_url: 'http://image.tmdb.org/t/p/',
            secure_base_url: 'https://image.tmdb.org/t/p/',
            backdrop_sizes: ['w300', 'w780', 'w1280', 'original'],
            poster_sizes: [
              'w92',
              'w154',
              'w185',
              'w342',
              'w500',
              'w780',
              'original',
            ],
            profile_sizes: ['w45', 'w185', 'h632', 'original'],
          },
        });
        setLoadingConfig(false);
      });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('auth_users_db', JSON.stringify(users));
    } catch (error) {
      console.error('Failed to persist auth_users_db', error);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem('chat_messages', JSON.stringify(chatMessages));
    } catch (error) {
      console.error('Failed to persist chat_messages', error);
    }
  }, [chatMessages]);

  useEffect(() => {
    try {
      localStorage.setItem('chat_last_read', JSON.stringify(chatLastRead));
    } catch (error) {
      console.error('Failed to persist chat_last_read', error);
    }
  }, [chatLastRead]);

  useEffect(() => {
    try {
      localStorage.setItem('help_messages', JSON.stringify(helpMessages));
    } catch (error) {
      console.error('Failed to persist help_messages', error);
    }
  }, [helpMessages]);

  useEffect(() => {
    try {
      localStorage.setItem('auth_invite_codes', JSON.stringify(inviteCodes));
    } catch (error) {
      console.error('Failed to persist auth_invite_codes', error);
    }
  }, [inviteCodes]);

  useEffect(() => {
    try {
      localStorage.setItem('streaming_logins', JSON.stringify(streamingLogins));
    } catch (error) {
      console.error('Failed to persist streaming_logins', error);
    }
  }, [streamingLogins]);

  const login = ({ username, password }) => {
    const usernameLower = username.trim().toLowerCase();
    const existingUser = users.find((u) => u.username.toLowerCase() === usernameLower);

    if (!existingUser) {
      throw new Error('Nie znaleziono konta o podanym loginie.');
    }

    if (existingUser.password !== password) {
      throw new Error('Nieprawidłowe hasło.');
    }

    const now = new Date();

    if (existingUser.blockedUntil) {
      const blockedUntilDate = new Date(existingUser.blockedUntil);
      if (!Number.isNaN(blockedUntilDate.getTime()) && blockedUntilDate > now) {
        throw new Error(`Konto zablokowane do ${blockedUntilDate.toLocaleString('pl-PL')}.`);
      }

      if (!Number.isNaN(blockedUntilDate.getTime()) && blockedUntilDate <= now) {
        setUsers((prev) =>
          prev.map((u) =>
            u.username.toLowerCase() === usernameLower
              ? { ...u, blockedUntil: null, blockedAt: null }
              : u
          )
        );
      }
    }

    const nextUser = {
      username: existingUser.username,
      role: existingUser.role || 'user',
    };
    setUser(nextUser);
    localStorage.setItem('auth_user', JSON.stringify(nextUser));

    setChatLastRead((prev) => {
      const latestMessage = chatMessages.at(-1);
      if (!latestMessage) {
        return prev;
      }
      return {
        ...prev,
        [nextUser.username]: latestMessage.createdAt,
      };
    });

    return nextUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  const consumeInviteCode = (code) => {
    const trimmed = code?.trim();
    if (!trimmed) {
      throw new Error('Podaj kod rejestracyjny.');
    }

    const existing = inviteCodes.find(
      (entry) => entry.code.toLowerCase() === trimmed.toLowerCase() && !entry.used
    );

    if (!existing) {
      throw new Error('Nieprawidłowy lub wykorzystany kod rejestracyjny.');
    }

    setInviteCodes((prev) =>
      prev.map((entry) =>
        entry.code === existing.code ? { ...entry, used: true, usedAt: new Date().toISOString() } : entry
      )
    );
  };

  const registerUser = ({ username, email, password, inviteCode }) => {
    const usernameLower = username.trim().toLowerCase();
    const emailLower = email.trim().toLowerCase();

    if (users.some((u) => u.username.toLowerCase() === usernameLower)) {
      throw new Error('Ten login jest już zajęty.');
    }

    if (users.some((u) => u.email?.toLowerCase() === emailLower)) {
      throw new Error('Ten email jest już używany.');
    }

    consumeInviteCode(inviteCode);

    const newUser = {
      username: username.trim(),
      email: email.trim(),
      password,
      role: 'user',
      blockedUntil: null,
      blockedAt: null,
      mutedUntil: null,
      mutedAt: null,
    };

    setUsers((prev) => [...prev, newUser]);
    return newUser;
  };

  const isProtectedAccount = (username) =>
    INITIAL_ACCOUNTS.some((account) => account.username.toLowerCase() === username.toLowerCase());

  const changePassword = ({ username, currentPassword, newPassword }) => {
    const normalized = username.trim().toLowerCase();

    if (!user || user.username.toLowerCase() !== normalized) {
      throw new Error('Nie możesz zmienić hasła innego użytkownika.');
    }

    const target = users.find((u) => u.username.toLowerCase() === normalized);

    if (!target) {
      throw new Error('Nie znaleziono konta.');
    }

    if (target.password !== currentPassword) {
      throw new Error('Nieprawidłowe aktualne hasło.');
    }

    if (newPassword.length < 6) {
      throw new Error('Nowe hasło musi mieć co najmniej 6 znaków.');
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.username.toLowerCase() === normalized ? { ...u, password: newPassword } : u
      )
    );
  };

  const adminResetPassword = ({ targetUsername, newPassword }) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Brak uprawnień do resetu hasła.');
    }

    if (!targetUsername?.trim()) {
      throw new Error('Podaj nazwę użytkownika.');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error('Nowe hasło musi mieć co najmniej 6 znaków.');
    }

    const normalized = targetUsername.trim().toLowerCase();
    const exists = users.some((u) => u.username.toLowerCase() === normalized);

    if (!exists) {
      throw new Error('Nie znaleziono użytkownika.');
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.username.toLowerCase() === normalized ? { ...u, password: newPassword } : u
      )
    );
  };

  const blockUserForDays = (username, days = 3) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Brak uprawnień do blokowania użytkowników.');
    }

    if (isProtectedAccount(username)) {
      throw new Error('Nie można zablokować konta administracyjnego.');
    }

    const blockedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const blockedAt = new Date().toISOString();

    setUsers((prev) =>
      prev.map((u) =>
        u.username.toLowerCase() === username.toLowerCase()
          ? { ...u, blockedUntil, blockedAt }
          : u
      )
    );

    addSystemChatMessage({
      text: `Użytkownik ${username} został zablokowany na ${days} dni przez administratora.`,
    });

    if (user?.username.toLowerCase() === username.toLowerCase()) {
      logout();
    }

    return blockedUntil;
  };

  const removeUserAccount = (username) => {
    if (isProtectedAccount(username)) {
      throw new Error('Nie można usunąć konta administracyjnego.');
    }

    setUsers((prev) => prev.filter((u) => u.username.toLowerCase() !== username.toLowerCase()));

    if (user?.username.toLowerCase() === username.toLowerCase()) {
      logout();
    }
  };

  const saveStreamingLogin = ({ serviceId, username, password, loginMode }) => {
    if (!serviceId) {
      throw new Error('Wybierz serwis.');
    }

    const nextData = {
      ...streamingLogins,
      [serviceId]: {
        mode: loginMode || 'account',
        username: (username || '').trim(),
        password: (password || '').trim(),
        updatedAt: new Date().toISOString(),
      },
    };
    setStreamingLogins(nextData);
    return nextData[serviceId];
  };

  const removeStreamingLogin = (serviceId) => {
    if (!serviceId) {
      return;
    }
    setStreamingLogins((prev) => {
      if (!prev || !prev[serviceId]) {
        return prev;
      }
      const next = { ...prev };
      delete next[serviceId];
      return next;
    });
  };

  const unblockUser = (username) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Brak uprawnień do odblokowania użytkowników.');
    }

    if (isProtectedAccount(username)) {
      throw new Error('Nie można odblokować konta administracyjnego.');
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.username.toLowerCase() === username.toLowerCase()
          ? { ...u, blockedUntil: null, blockedAt: null }
          : u
      )
    );
  };

  const addSystemChatMessage = ({ text }) => {
    const message = {
      id: `${Date.now()}-system`,
      author: 'System',
      text,
      createdAt: new Date().toISOString(),
      system: true,
    };
    setChatMessages((prev) => [...prev, message]);
  };

  const addChatMessage = ({ author, text }) => {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error('Wiadomość nie może być pusta.');
    }

    const authorUser = users.find((u) => u.username.trim().toLowerCase() === author.trim().toLowerCase());
    if (authorUser?.mutedUntil) {
      const mutedUntilDate = new Date(authorUser.mutedUntil);
      if (!Number.isNaN(mutedUntilDate.getTime()) && mutedUntilDate > new Date()) {
        throw new Error('Jesteś wyciszony. Spróbuj ponownie później.');
      }
      if (!Number.isNaN(mutedUntilDate.getTime()) && mutedUntilDate <= new Date()) {
        clearUserMute(authorUser.username);
      }
    }

    const message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      author,
      text: trimmed,
      createdAt: new Date().toISOString(),
      system: false,
    };

    setChatMessages((prev) => [...prev, message]);

    setChatLastRead((prev) => ({
      ...prev,
      [author]: message.createdAt,
    }));

    return message;
  };

  const muteUserForHours = (username, hours = 24) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Brak uprawnień do wyciszania użytkowników.');
    }

    if (isProtectedAccount(username)) {
      throw new Error('Nie można wyciszyć konta administracyjnego.');
    }

    const normalized = username.trim().toLowerCase();
    const exists = users.some((u) => u.username.toLowerCase() === normalized);
    if (!exists) {
      throw new Error('Nie znaleziono użytkownika.');
    }

    const mutedUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    const mutedAt = new Date().toISOString();

    setUsers((prev) =>
      prev.map((u) =>
        u.username.toLowerCase() === normalized
          ? { ...u, mutedUntil, mutedAt }
          : u
      )
    );

    addSystemChatMessage({
      text: `Użytkownik ${username} został wyciszony na ${hours}h przez administratora.`,
    });
  };

  const clearUserMute = (username) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.username.toLowerCase() === username.toLowerCase()
          ? { ...u, mutedUntil: null, mutedAt: null }
          : u
      )
    );

    addSystemChatMessage({ text: `Użytkownik ${username} został odciszony.` });
  };

  const markChatAsRead = (username) => {
    if (!username) return;
    const latestMessage = chatMessages.at(-1);
    if (!latestMessage) return;

    setChatLastRead((prev) => ({
      ...prev,
      [username]: latestMessage.createdAt,
    }));
  };

  const hasUnreadMessages = (username) => {
    if (!username || chatMessages.length === 0) {
      return false;
    }
    const latestMessage = chatMessages.at(-1);
    const lastRead = chatLastRead[username];
    if (!lastRead) {
      return true;
    }
    return new Date(lastRead).getTime() < new Date(latestMessage.createdAt).getTime();
  };

  const submitHelpMessage = ({ author, text }) => {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error('Wiadomość nie może być pusta.');
    }

    const message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      author,
      text: trimmed,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    setHelpMessages((prev) => [...prev, message]);
    return message;
  };

  const removeHelpMessage = (id) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Brak uprawnień do usuwania zgłoszeń.');
    }
    setHelpMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  const updateHelpMessageStatus = (id, status) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Brak uprawnień do aktualizacji zgłoszeń.');
    }
    setHelpMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, status } : msg))
    );
  };

  const createInviteCode = () => {
    if (!user || user.role !== 'admin') {
      throw new Error('Brak uprawnień do tworzenia kodów.');
    }

    let code;
    do {
      code = generateRandomCode(12);
    } while (inviteCodes.some((entry) => entry.code === code));

    const entry = {
      code,
      createdAt: new Date().toISOString(),
      createdBy: user.username,
      used: false,
      usedAt: null,
    };
    setInviteCodes((prev) => [...prev, entry]);
    return code;
  };

  const revokeInviteCode = (code) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Brak uprawnień do usuwania kodów.');
    }
    setInviteCodes((prev) => prev.filter((entry) => entry.code !== code));
  };

  const removeChatMessage = (id) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Brak uprawnień do usuwania wiadomości.');
    }
    setChatMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  const getImageUrl = (path, size = 'w500') => {
    if (!apiConfig || !path) {
      // Return a placeholder or null if config not loaded or path is missing
      return 'https://placehold.co/500x750';
    }
    // Ensure size is valid, otherwise use a default
    const SIZES = [
      ...(apiConfig.images.poster_sizes || []),
      ...(apiConfig.images.backdrop_sizes || []),
    ];
    const chosenSize = SIZES.includes(size) ? size : 'original';

    return `${apiConfig.images.secure_base_url}${chosenSize}${path}`;
  };

  return (
    <AppContext.Provider
      value={{
        apiConfig,
        loadingConfig,
        getImageUrl,
        users,
        user,
        isAuthenticated,
        login,
        logout,
        registerUser,
        blockUserForDays,
        removeUserAccount,
        isProtectedAccount,
        changePassword,
        adminResetPassword,
        chatMessages,
        addChatMessage,
        markChatAsRead,
        hasUnreadMessages,
        addSystemChatMessage,
        muteUserForHours,
        clearUserMute,
        helpMessages,
        submitHelpMessage,
        removeHelpMessage,
        updateHelpMessageStatus,
        inviteCodes,
        createInviteCode,
        revokeInviteCode,
        unblockUser,
        streamingLogins,
        saveStreamingLogin,
        removeStreamingLogin,
        removeChatMessage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
