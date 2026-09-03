import { create } from 'zustand'

const STORAGE_KEY = 'factor_planet_state';

const loadState = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const saveState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Save state failed', e);
  }
};

const useUserStore = create((set) => ({
  users: [],
  currentUserId: null,
  currentUser: null,
  xp: 0,
  
  initStore: () => {
    const saved = loadState();
    if (saved) {
      set({
        users: saved.users || [],
        currentUserId: saved.currentUserId || null,
        currentUser: saved.users?.find(u => u.id === saved.currentUserId) || null,
        xp: saved.users?.find(u => u.id === saved.currentUserId)?.xp || 0
      });
    }
  },

  createUser: (name) => {
    const newUser = {
      id: Date.now().toString(),
      name,
      xp: 0,
      createdAt: new Date().toISOString(),
      chapters: {
        '0': { status: 'unlocked', progress: 0 }
      },
      mistakes: [],
      completedChapters: [],
      completedQuizzes: []
    };
    
    set((state) => {
      const users = [...state.users, newUser];
      const newState = { 
        users, 
        currentUserId: newUser.id, 
        currentUser: newUser,
        xp: 0
      };
      saveState({ users, currentUserId: newUser.id });
      return newState;
    });
  },

  switchUser: (id) => {
    set((state) => {
      const user = state.users.find(u => u.id === id);
      if (!user) return state;
      const newState = {
        currentUserId: id,
        currentUser: user,
        xp: user.xp
      };
      saveState({ users: state.users, currentUserId: id });
      return newState;
    });
  },

  addXP: (amount) => {
    set((state) => {
      if (!state.currentUserId) return state;
      const updatedUsers = state.users.map(u => {
        if (u.id === state.currentUserId) {
          return { ...u, xp: u.xp + amount };
        }
        return u;
      });
      const newXp = state.xp + amount;
      saveState({ users: updatedUsers, currentUserId: state.currentUserId });
      return { users: updatedUsers, xp: newXp, currentUser: updatedUsers.find(u => u.id === state.currentUserId) };
    });
  },

  completeChapter: (chapterId, reward = 50) => {
    set((state) => {
      if (!state.currentUserId) return state;
      let isFirstTime = false;
      const updatedUsers = state.users.map(u => {
        if (u.id === state.currentUserId) {
          const completed = u.completedChapters || [];
          if (!completed.includes(chapterId)) {
            isFirstTime = true;
            return { ...u, completedChapters: [...completed, chapterId], xp: u.xp + reward };
          }
        }
        return u;
      });
      if (isFirstTime) {
        saveState({ users: updatedUsers, currentUserId: state.currentUserId });
        const newXp = state.xp + reward;
        return { users: updatedUsers, xp: newXp, currentUser: updatedUsers.find(u => u.id === state.currentUserId) };
      }
      return state;
    });
  },

  recordQuizSuccess: (quizQuestion) => {
    set((state) => {
      if (!state.currentUserId) return state;
      let isFirstTime = false;
      const updatedUsers = state.users.map(u => {
        if (u.id === state.currentUserId) {
          const completedQ = u.completedQuizzes || [];
          if (!completedQ.includes(quizQuestion)) {
            isFirstTime = true;
            return { ...u, completedQuizzes: [...completedQ, quizQuestion], xp: u.xp + 10 };
          }
        }
        return u;
      });
      if (isFirstTime) {
        saveState({ users: updatedUsers, currentUserId: state.currentUserId });
        const newXp = state.xp + 10;
        return { users: updatedUsers, xp: newXp, currentUser: updatedUsers.find(u => u.id === state.currentUserId) };
      }
      return state;
    });
  },

  recordMistake: (questionObj) => {
    set((state) => {
      if (!state.currentUserId) return state;
      const updatedUsers = state.users.map(u => {
        if (u.id === state.currentUserId) {
          const mistakes = u.mistakes || [];
          // Avoid duplicates
          if (!mistakes.find(m => m.question === questionObj.question)) {
            return { ...u, mistakes: [...mistakes, questionObj] };
          }
        }
        return u;
      });
      saveState({ users: updatedUsers, currentUserId: state.currentUserId });
      return { users: updatedUsers, currentUser: updatedUsers.find(u => u.id === state.currentUserId) };
    });
  },

  removeMistake: (questionText) => {
    set((state) => {
      if (!state.currentUserId) return state;
      const updatedUsers = state.users.map(u => {
        if (u.id === state.currentUserId) {
          const mistakes = u.mistakes || [];
          return { ...u, mistakes: mistakes.filter(m => m.question !== questionText) };
        }
        return u;
      });
      saveState({ users: updatedUsers, currentUserId: state.currentUserId });
      return { users: updatedUsers, currentUser: updatedUsers.find(u => u.id === state.currentUserId) };
    });
  },

  unlockChapter: (chapterId) => {
    set((state) => {
      if (!state.currentUserId) return state;
      const updatedUsers = state.users.map(u => {
        if (u.id === state.currentUserId) {
          return {
            ...u,
            chapters: {
              ...u.chapters,
              [chapterId]: { ...u.chapters[chapterId], status: 'unlocked' }
            }
          };
        }
        return u;
      });
      saveState({ users: updatedUsers, currentUserId: state.currentUserId });
      return { users: updatedUsers, currentUser: updatedUsers.find(u => u.id === state.currentUserId) };
    });
  }
}));

export default useUserStore;
