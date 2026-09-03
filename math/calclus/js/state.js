// state.js?v=23
import { eventBus } from './eventBus.js?v=23';

const STORAGE_KEY = 'math_planet_users';
const CURRENT_VERSION = 1;

/**
 * 初始化一个新的用户状态对象
 */
function createNewUserState(id, nickname, avatarId) {
  return {
    id,
    nickname,
    avatarId,
    createdAt: new Date().toISOString(),
    lastVisit: new Date().toISOString(),
    totalXP: 0,
    streakDays: 0,
    achievements: [],
    glossaryViewed: [],
    activityHeatmap: {},
    chapters: {
      'chapter_0': { status: 'unlocked', sections: {}, exam: { passed: false, bestScore: 0, stars: 0, attempts: 0, lastAnswers: [] } },
      'chapter_1': { status: 'unlocked', sections: {}, exam: { passed: false, bestScore: 0, stars: 0, attempts: 0, lastAnswers: [] } }
    }
  };
}

export const Store = {
  data: {
    version: CURRENT_VERSION,
    users: {},
    currentUser: null
  },

  init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        let parsed = JSON.parse(stored);
        if (parsed.version && parsed.version < CURRENT_VERSION) {
          parsed = this.runMigrations(parsed);
        }
        this.data = parsed;
      }
    } catch (e) {
      console.error('Failed to load state from localStorage', e);
    }
  },

  runMigrations(oldData) {
    // Migration logic if version updates
    oldData.version = CURRENT_VERSION;
    return oldData;
  },

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  },

  getUsers() {
    return Object.values(this.data.users);
  },

  getCurrentUser() {
    if (!this.data.currentUser) return null;
    return this.data.users[this.data.currentUser] || null;
  },

  createUser(nickname, avatarId) {
    const id = Date.now().toString();
    const newUser = createNewUserState(id, nickname, avatarId);
    this.data.users[id] = newUser;
    this.data.currentUser = id;
    this.save();
    return newUser;
  },

  switchUser(userId) {
    if (this.data.users[userId]) {
      this.data.currentUser = userId;
      this.save();
    }
  },

  deleteUser(userId) {
    if (this.data.users[userId]) {
      delete this.data.users[userId];
      if (this.data.currentUser === userId) {
        const remaining = Object.keys(this.data.users);
        this.data.currentUser = remaining.length > 0 ? remaining[0] : null;
      }
      this.save();
    }
  },

  updateLastVisit() {
    const user = this.getCurrentUser();
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    const lastVisitStr = user.lastVisit.split('T')[0];
    
    if (today !== lastVisitStr) {
        // Simple streak logic
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (lastVisitStr === yesterday.toISOString().split('T')[0]) {
            user.streakDays += 1;
        } else {
            user.streakDays = 1;
        }
    }
    user.lastVisit = new Date().toISOString();
    this.save();
  },

  addXP(amount) {
    const user = this.getCurrentUser();
    if (!user) return;

    user.totalXP += amount;
    
    const today = new Date().toISOString().split('T')[0];
    user.activityHeatmap[today] = (user.activityHeatmap[today] || 0) + amount;
    
    this.save();
    eventBus.emit('SCORE_UPDATED', user.totalXP);
  },

  unlockAchievement(achievementId) {
    const user = this.getCurrentUser();
    if (!user) return false;

    if (!user.achievements.includes(achievementId)) {
      user.achievements.push(achievementId);
      this.save();
      eventBus.emit('ACHIEVEMENT_UNLOCKED', achievementId);
      return true;
    }
    return false;
  },

  getChapterState(chapterId) {
    const user = this.getCurrentUser();
    if (!user) return null;
    
    const isTest = user.nickname === 'test';

    if (!user.chapters[chapterId]) {
      // Default to locked if not found
      user.chapters[chapterId] = { status: isTest ? 'unlocked' : 'locked', sections: {}, exam: { passed: false, bestScore: 0, stars: 0, attempts: 0, lastAnswers: [] } };
      this.save();
    }
    
    if (isTest && user.chapters[chapterId].status === 'locked') {
      user.chapters[chapterId].status = 'unlocked';
      this.save();
    }
    
    return user.chapters[chapterId];
  },

  unlockChapter(chapterId) {
    const user = this.getCurrentUser();
    if (!user) return;
    const chapter = this.getChapterState(chapterId);
    if (chapter.status === 'locked') {
        chapter.status = 'unlocked';
        this.save();
        eventBus.emit('CHAPTER_UNLOCKED', chapterId);
    }
  },

  markSectionRead(chapterId, sectionId) {
    const chapter = this.getChapterState(chapterId);
    if (!chapter) return;
    if (!chapter.sections[sectionId]) {
        chapter.sections[sectionId] = { read: false, quizAnswers: {} };
    }
    chapter.sections[sectionId].read = true;
    this.save();
  },

  updateQuiz(chapterId, sectionId, quizId, answer, passed) {
      const chapter = this.getChapterState(chapterId);
      if (!chapter) return;
      if (!chapter.sections[sectionId]) {
          chapter.sections[sectionId] = { read: false, quizAnswers: {} };
      }
      
      const quiz = chapter.sections[sectionId].quizAnswers[quizId] || { answer: null, attempts: 0, passed: false };
      quiz.answer = answer;
      quiz.attempts += 1;
      quiz.passed = passed;
      chapter.sections[sectionId].quizAnswers[quizId] = quiz;
      this.save();
  },

  resetAll() {
    const user = this.getCurrentUser();
    if (!user) return;
    
    // 重新初始化基础章节
    user.chapters = {
      'chapter_0': { status: 'unlocked', sections: {}, exam: { passed: false, bestScore: 0, stars: 0, attempts: 0, lastAnswers: [] } },
      'chapter_1': { status: 'unlocked', sections: {}, exam: { passed: false, bestScore: 0, stars: 0, attempts: 0, lastAnswers: [] } }
    };
    user.totalXP = 0;
    user.achievements = [];
    user.activityHeatmap = {};
    this.save();
    window.location.hash = '#/';
    window.location.reload();
  },

  resetSection(chapterId, sectionId) {
    const chapter = this.getChapterState(chapterId);
    if (chapter && chapter.sections[sectionId]) {
      chapter.sections[sectionId] = { read: false, quizAnswers: {} };
      this.save();
      window.location.reload();
    }
  }
};

// Initialize on script load
Store.init();
