(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SquaresRecords = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const STORAGE_KEY = 'squares_pk_records_v1';

  const MATHEMATICIANS = [
    '牛顿',
    '莱布尼茨',
    '高斯',
    '费马',
    '欧拉',
    '阿基米德',
    '毕达哥拉斯',
    '祖冲之',
    '华罗庚',
    '陈景润',
    '拉马努金',
    '笛卡尔',
    '帕斯卡',
    '黎曼',
  ];

  function pickRandomMathematician(excludeName) {
    const pool = MATHEMATICIANS.filter(function (name) {
      return name !== excludeName;
    });
    return pool[Math.floor(Math.random() * pool.length)] || '高斯';
  }

  function pickRandomPair() {
    const first = pickRandomMathematician();
    const second = pickRandomMathematician(first);
    return [first, second];
  }

  function getStarRank(stars) {
    if (stars >= 150) return '👑 数学传奇';
    if (stars >= 60) return '🏆 平方大师';
    if (stars >= 20) return '⚡ 速算小侦探';
    return '🌱 平方见习生';
  }

  function createEmptyState() {
    return {
      version: 1,
      lastSoloName: '',
      lastPkNames: { A: '', B: '' },
      soloStars: {}, // { [name]: { stars, totalCorrect, perfectRuns } }
      pkLeaderboard: {}, // { [name]: { wins, losses, draws, totalCorrect, totalWrong } }
      pkHistory: [], // 最近 20 场
    };
  }

  function createRecordsService(storage) {
    const adapter = storage || {
      getItem: function (k) {
        return typeof window !== 'undefined' && window.localStorage
          ? window.localStorage.getItem(k)
          : null;
      },
      setItem: function (k, v) {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(k, v);
        }
      },
    };

    function load() {
      try {
        const raw = adapter.getItem(STORAGE_KEY);
        if (!raw) return createEmptyState();
        const parsed = JSON.parse(raw);
        if (!parsed || parsed.version !== 1) return createEmptyState();
        return Object.assign(createEmptyState(), parsed);
      } catch {
        return createEmptyState();
      }
    }

    function save(state) {
      try {
        adapter.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {}
      return state;
    }

    function recordSoloStars(playerName, earnedCorrect, isPerfectRun) {
      const name = (playerName || '').trim() || '数学小达人';
      const state = load();
      const prev = state.soloStars[name] || { stars: 0, totalCorrect: 0, perfectRuns: 0 };
      const bonus = isPerfectRun && earnedCorrect > 0 ? 5 : 0;
      const gained = earnedCorrect + bonus;

      state.lastSoloName = name;
      state.soloStars[name] = {
        stars: prev.stars + gained,
        totalCorrect: prev.totalCorrect + earnedCorrect,
        perfectRuns: prev.perfectRuns + (bonus > 0 ? 1 : 0),
      };
      save(state);
      return {
        name: name,
        gained: gained,
        bonus: bonus,
        totalStars: state.soloStars[name].stars,
        rank: getStarRank(state.soloStars[name].stars),
      };
    }

    function getSoloProfile(playerName) {
      const name = (playerName || '').trim() || '数学小达人';
      const state = load();
      const rec = state.soloStars[name] || { stars: 0, totalCorrect: 0, perfectRuns: 0 };
      return {
        name: name,
        stars: rec.stars,
        totalCorrect: rec.totalCorrect,
        perfectRuns: rec.perfectRuns,
        rank: getStarRank(rec.stars),
      };
    }

    function recordPkMatchResult(entry) {
      // entry: { nameA, nameB, correctA, wrongA, correctB, wrongB, winner: 'A'|'B'|'draw', rangeLabel, totalRounds }
      const state = load();
      state.lastPkNames = { A: entry.nameA, B: entry.nameB };

      function ensureBoard(name) {
        if (!state.pkLeaderboard[name]) {
          state.pkLeaderboard[name] = {
            wins: 0,
            losses: 0,
            draws: 0,
            totalCorrect: 0,
            totalWrong: 0,
          };
        }
        return state.pkLeaderboard[name];
      }

      const statA = ensureBoard(entry.nameA);
      const statB = ensureBoard(entry.nameB);

      statA.totalCorrect += entry.correctA;
      statA.totalWrong += entry.wrongA;
      statB.totalCorrect += entry.correctB;
      statB.totalWrong += entry.wrongB;

      if (entry.winner === 'A') {
        statA.wins += 1;
        statB.losses += 1;
      } else if (entry.winner === 'B') {
        statB.wins += 1;
        statA.losses += 1;
      } else {
        statA.draws += 1;
        statB.draws += 1;
      }

      state.pkHistory.unshift({
        at: new Date().toISOString(),
        nameA: entry.nameA,
        nameB: entry.nameB,
        correctA: entry.correctA,
        correctB: entry.correctB,
        winner: entry.winner,
        rangeLabel: entry.rangeLabel || '',
        totalRounds: entry.totalRounds || 10,
      });
      state.pkHistory = state.pkHistory.slice(0, 20);

      save(state);
      return state;
    }

    function getPkLeaderboardSorted() {
      const state = load();
      return Object.keys(state.pkLeaderboard)
        .map(function (name) {
          const s = state.pkLeaderboard[name];
          const games = s.wins + s.losses + s.draws;
          return {
            name: name,
            wins: s.wins,
            losses: s.losses,
            draws: s.draws,
            games: games,
            winRate: games > 0 ? Math.round((s.wins / games) * 100) : 0,
            totalCorrect: s.totalCorrect,
          };
        })
        .sort(function (a, b) {
          if (b.wins !== a.wins) return b.wins - a.wins;
          return b.totalCorrect - a.totalCorrect;
        });
    }

    function clearPkRecords() {
      const state = load();
      state.pkLeaderboard = {};
      state.pkHistory = [];
      save(state);
    }

    function clearSoloStars() {
      const state = load();
      state.soloStars = {};
      save(state);
    }

    return {
      load: load,
      recordSoloStars: recordSoloStars,
      getSoloProfile: getSoloProfile,
      recordPkMatchResult: recordPkMatchResult,
      getPkLeaderboardSorted: getPkLeaderboardSorted,
      clearPkRecords: clearPkRecords,
      clearSoloStars: clearSoloStars,
    };
  }

  return {
    MATHEMATICIANS: MATHEMATICIANS,
    pickRandomMathematician: pickRandomMathematician,
    pickRandomPair: pickRandomPair,
    getStarRank: getStarRank,
    createRecordsService: createRecordsService,
  };
});
