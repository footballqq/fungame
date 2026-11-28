(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SquaresTournamentEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const ARCHIVE_KEY = 'squares_tournament_archive_v1';
  const ACTIVE_KEY = 'squares_active_tournament_v1';

  // 15 组成对主题战队名（严格同主题配对：神兽对神兽、学科对学科、星际对星际、地域对地域，绝不串台！）
  const TEAM_NAME_PAIRS = [
    ['🐉 神龙战队', '🦄 独角兽战队'],
    ['🐼 熊猫战队', '🐯 猛虎战队'],
    ['🦁 雄狮战队', '🦅 苍鹰战队'],
    ['🦖 霸王龙队', '🦈 大白鲨队'],
    ['🦊 智狐战队', '🐺 雪狼战队'],
    ['⚔️ 青龙战队', '🛡️ 白虎战队'],
    ['🌊 深海蛟龙', '🌋 烈火凤凰'],
    ['📐 数学之王队', '⚛️ 物理大师队'],
    ['➕ 代数天团', '🔺 几何先锋'],
    ['🚀 星际舰队', '🛸 银河骑士'],
    ['☀️ 烈日战队', '🌙 皓月战队'],
    ['⚡ 闪电突击队', '🔥 烈焰先锋队'],
    ['🌏 亚洲战队', '🌍 欧洲战队'],
    ['🏯 东方学派', '🏛️ 西方学派'],
    ['🍎 红苹果战队', '🍉 大西瓜战队'],
  ];

  function pickTeamNamePair(excludeTeamA) {
    const candidates = TEAM_NAME_PAIRS.filter(function (pair) {
      return pair[0] !== excludeTeamA;
    });
    const pool = candidates.length > 0 ? candidates : TEAM_NAME_PAIRS;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    return Math.random() < 0.5 ? [picked[0], picked[1]] : [picked[1], picked[0]];
  }

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function nextPowerOfTwo(n) {
    let p = 2;
    while (p < n) p *= 2;
    return p;
  }

  function getRoundTitle(matchCountInRound) {
    if (matchCountInRound === 1) return '总决赛';
    if (matchCountInRound === 2) return '半决赛';
    if (matchCountInRound === 4) return '1/4 决赛';
    if (matchCountInRound === 8) return '1/8 决赛';
    return '淘汰赛';
  }

  /**
   * 创建单败淘汰赛（支持 3~16 人，非 2 的幂次自动均匀分配轮空 BYE 并自动晋级）
   */
  function createEliminationTournament(playerNames, config) {
    const cleaned = playerNames
      .map(function (s) {
        return String(s || '').trim();
      })
      .filter(Boolean);
    if (cleaned.length < 2) {
      throw new Error('至少需要 2 名选手才能开赛');
    }

    const shuffled = config && config.noShuffle ? cleaned.slice() : shuffle(cleaned);
    const bracketSize = nextPowerOfTwo(shuffled.length);
    const numByes = bracketSize - shuffled.length;
    const firstRoundMatches = bracketSize / 2;

    // 构造首轮槽位：将轮空均匀分散到不同场次的 B 槽，杜绝 BYE vs BYE
    const slots = new Array(bracketSize).fill(null);
    let idx = 0;
    // 先把每个场次的 A 槽填满真实选手
    for (let m = 0; m < firstRoundMatches; m++) {
      slots[m * 2] = shuffled[idx++];
    }
    // 再把剩余真实选手填入 B 槽（剩下的 B 槽保持 null 表示轮空 BYE）
    for (let m = 0; m < firstRoundMatches - numByes; m++) {
      slots[m * 2 + 1] = shuffled[idx++];
    }

    const rounds = [];
    let matchCount = firstRoundMatches;
    let roundIdx = 0;

    while (matchCount >= 1) {
      const matches = [];
      for (let m = 0; m < matchCount; m++) {
        const matchId = 'r' + roundIdx + '-m' + m;
        const playerA = roundIdx === 0 ? slots[m * 2] : null;
        const playerB = roundIdx === 0 ? slots[m * 2 + 1] : null;
        matches.push({
          id: matchId,
          roundIndex: roundIdx,
          matchIndex: m,
          roundTitle: getRoundTitle(matchCount),
          playerA: playerA,
          playerB: playerB,
          scoreA: 0,
          scoreB: 0,
          winner: null, // 获胜者姓名
          loser: null,
          isBye: false,
          status: 'pending', // 'pending' | 'ready' | 'done'
        });
      }
      rounds.push({
        roundIndex: roundIdx,
        title: getRoundTitle(matchCount),
        matches: matches,
      });
      matchCount = matchCount / 2;
      roundIdx += 1;
    }

    const tournament = {
      id: 'tour-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      format: 'elimination',
      createdAt: new Date().toISOString(),
      players: shuffled,
      config: config || {},
      rounds: rounds,
      status: 'active', // 'active' | 'finished'
      champion: null,
      runnerUp: null,
      rankings: [],
    };

    // 自动处理首轮轮空晋级，并更新 ready 状态
    resolveByesAndReadyStates(tournament);
    return tournament;
  }

  function advanceWinnerToNextRound(tournament, roundIdx, matchIdx, winnerName) {
    const nextRound = tournament.rounds[roundIdx + 1];
    if (!nextRound) return;
    const nextMatchIdx = Math.floor(matchIdx / 2);
    const nextMatch = nextRound.matches[nextMatchIdx];
    if (!nextMatch) return;
    if (matchIdx % 2 === 0) {
      nextMatch.playerA = winnerName;
    } else {
      nextMatch.playerB = winnerName;
    }
  }

  function resolveByesAndReadyStates(tournament) {
    if (tournament.format !== 'elimination') return;

    // 首轮：只要一方是 null（轮空），另一方自动胜出晋级
    const r0 = tournament.rounds[0];
    if (r0) {
      for (const m of r0.matches) {
        if (m.status !== 'done') {
          if (m.playerA && !m.playerB) {
            m.isBye = true;
            m.winner = m.playerA;
            m.status = 'done';
            advanceWinnerToNextRound(tournament, 0, m.matchIndex, m.playerA);
          } else if (!m.playerA && m.playerB) {
            m.isBye = true;
            m.winner = m.playerB;
            m.status = 'done';
            advanceWinnerToNextRound(tournament, 0, m.matchIndex, m.playerB);
          }
        }
      }
    }

    // 刷新所有未完成比赛的 ready 状态
    for (const round of tournament.rounds) {
      for (const m of round.matches) {
        if (m.status !== 'done') {
          m.status = m.playerA && m.playerB ? 'ready' : 'pending';
        }
      }
    }
  }

  /**
   * 创建循环赛（任意两人交手一次）
   */
  function createRoundRobinTournament(playerNames, config) {
    const cleaned = playerNames
      .map(function (s) {
        return String(s || '').trim();
      })
      .filter(Boolean);
    if (cleaned.length < 2) {
      throw new Error('至少需要 2 名选手才能开赛');
    }

    const shuffled = config && config.noShuffle ? cleaned.slice() : shuffle(cleaned);
    const matches = [];
    let idx = 0;
    for (let i = 0; i < shuffled.length; i++) {
      for (let j = i + 1; j < shuffled.length; j++) {
        matches.push({
          id: 'rr-m' + idx,
          roundIndex: 0,
          matchIndex: idx,
          roundTitle: '循环赛第 ' + (idx + 1) + ' 场',
          playerA: shuffled[i],
          playerB: shuffled[j],
          scoreA: 0,
          scoreB: 0,
          winner: null,
          loser: null,
          isBye: false,
          status: 'ready',
        });
        idx += 1;
      }
    }

    return {
      id: 'tour-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      format: 'round-robin',
      createdAt: new Date().toISOString(),
      players: shuffled,
      config: config || {},
      rounds: [{ roundIndex: 0, title: '单循环赛', matches: matches }],
      status: 'active',
      champion: null,
      runnerUp: null,
      rankings: [],
    };
  }

  /**
   * 创建组队擂台赛（中日擂台赛 / 车轮战模式）：
   * 随机平均分成蓝队与红队（奇数人如 7 人则 4 vs 3）；赢家守擂不动、输家淘汰由同队下一位登台，直到一方全灭！
   */
  function createTeamGauntletTournament(playerNames, config) {
    const cleaned = playerNames
      .map(function (s) {
        return String(s || '').trim();
      })
      .filter(Boolean);
    if (cleaned.length < 2) {
      throw new Error('至少需要 2 名选手才能开启组队擂台赛');
    }

    const shuffled = config && config.noShuffle ? cleaned.slice() : shuffle(cleaned);
    const splitAt = Math.ceil(shuffled.length / 2);
    const teamA = shuffled.slice(0, splitAt);
    const teamB = shuffled.slice(splitAt);

    const winsByPlayer = {};
    shuffled.forEach(function (name) {
      winsByPlayer[name] = 0;
    });

    const firstMatch = {
      id: 'g-m0',
      roundIndex: 0,
      matchIndex: 0,
      roundTitle: '擂台第 1 场',
      playerA: teamA[0],
      playerB: teamB[0],
      scoreA: 0,
      scoreB: 0,
      winner: null,
      loser: null,
      isBye: false,
      status: 'ready',
    };

    const teamPair =
      config && Array.isArray(config.teamNames) && config.teamNames.length === 2
        ? config.teamNames
        : pickTeamNamePair();

    return {
      id: 'tour-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      format: 'team-gauntlet',
      createdAt: new Date().toISOString(),
      config: config || {},
      players: shuffled,
      rounds: [{ title: '组队擂台战', matches: [firstMatch] }],
      gauntlet: {
        teamAName: teamPair[0],
        teamBName: teamPair[1],
        teamA: teamA,
        teamB: teamB,
        idxA: 0,
        idxB: 0,
        streakA: 0,
        streakB: 0,
        winsByPlayer: winsByPlayer,
      },
      status: 'ongoing',
      champion: null,
      runnerUp: null,
      mvp: null,
      rankings: [],
    };
  }

  function findMatchById(tournament, matchId) {
    for (const round of tournament.rounds) {
      for (const m of round.matches) {
        if (m.id === matchId) return m;
      }
    }
    return null;
  }

  function getNextReadyMatch(tournament) {
    if (!tournament || tournament.status === 'finished') return null;
    for (const round of tournament.rounds) {
      for (const m of round.matches) {
        if (m.status === 'ready') return m;
      }
    }
    return null;
  }

  function computeRoundRobinStandings(tournament) {
    const map = {};
    for (const name of tournament.players) {
      map[name] = { name: name, wins: 0, draws: 0, losses: 0, points: 0, scoreFor: 0 };
    }
    for (const m of tournament.rounds[0].matches) {
      if (m.status !== 'done') continue;
      const sA = map[m.playerA];
      const sB = map[m.playerB];
      if (!sA || !sB) continue;
      sA.scoreFor += m.scoreA;
      sB.scoreFor += m.scoreB;
      if (m.winner === m.playerA) {
        sA.wins += 1;
        sA.points += 3;
        sB.losses += 1;
      } else if (m.winner === m.playerB) {
        sB.wins += 1;
        sB.points += 3;
        sA.losses += 1;
      } else {
        sA.draws += 1;
        sB.draws += 1;
        sA.points += 1;
        sB.points += 1;
      }
    }
    return Object.values(map).sort(function (a, b) {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.scoreFor - a.scoreFor;
    });
  }

  function recordTournamentMatchResult(tournament, matchId, scoreA, scoreB, winnerSide) {
    const match = findMatchById(tournament, matchId);
    if (!match || match.status === 'done') return tournament;

    match.scoreA = scoreA;
    match.scoreB = scoreB;
    match.status = 'done';

    if (winnerSide === 'A') {
      match.winner = match.playerA;
      match.loser = match.playerB;
    } else if (winnerSide === 'B') {
      match.winner = match.playerB;
      match.loser = match.playerA;
    } else {
      match.winner = null;
      match.loser = null;
    }

    if (tournament.format === 'elimination') {
      const winnerName = match.winner || (scoreA >= scoreB ? match.playerA : match.playerB);
      match.winner = winnerName;
      match.loser = winnerName === match.playerA ? match.playerB : match.playerA;

      const isFinal = match.roundIndex === tournament.rounds.length - 1;
      if (isFinal) {
        tournament.status = 'finished';
        tournament.champion = match.winner;
        tournament.runnerUp = match.loser;
        tournament.rankings = buildEliminationRankings(tournament);
      } else {
        advanceWinnerToNextRound(tournament, match.roundIndex, match.matchIndex, winnerName);
        resolveByesAndReadyStates(tournament);
      }
    } else if (tournament.format === 'team-gauntlet' && tournament.gauntlet) {
      const g = tournament.gauntlet;
      const winnerName = match.winner || (scoreA >= scoreB ? match.playerA : match.playerB);
      match.winner = winnerName;
      match.loser = winnerName === match.playerA ? match.playerB : match.playerA;
      g.winsByPlayer[winnerName] = (g.winsByPlayer[winnerName] || 0) + 1;

      if (winnerName === match.playerA) {
        g.streakA += 1;
        g.streakB = 0;
        g.idxB += 1;
      } else {
        g.streakB += 1;
        g.streakA = 0;
        g.idxA += 1;
      }

      if (g.idxA >= g.teamA.length || g.idxB >= g.teamB.length) {
        tournament.status = 'finished';
        const blueWon = g.idxB >= g.teamB.length;
        const remainCount = blueWon ? g.teamA.length - g.idxA : g.teamB.length - g.idxB;
        tournament.champion = (blueWon ? g.teamAName : g.teamBName) + '（剩 ' + remainCount + ' 人）';
        tournament.runnerUp = blueWon ? g.teamBName : g.teamAName;

        const sortedPlayers = tournament.players
          .slice()
          .sort(function (a, b) {
            return (g.winsByPlayer[b] || 0) - (g.winsByPlayer[a] || 0);
          });
        const topPlayer = sortedPlayers[0];
        const topWins = topPlayer ? g.winsByPlayer[topPlayer] || 0 : 0;
        tournament.mvp = topPlayer ? topPlayer + '（' + topWins + ' 胜）' : null;
        tournament.rankings = sortedPlayers.map(function (name, i) {
          const teamTag = g.teamA.indexOf(name) >= 0 ? g.teamAName : g.teamBName;
          return {
            rank: i + 1,
            name: name,
            detail: teamTag + ' · ' + (g.winsByPlayer[name] || 0) + '胜',
          };
        });
      } else {
        const nextIndex = tournament.rounds[0].matches.length;
        tournament.rounds[0].matches.push({
          id: 'g-m' + nextIndex,
          roundIndex: 0,
          matchIndex: nextIndex,
          roundTitle: '擂台第 ' + (nextIndex + 1) + ' 场',
          playerA: g.teamA[g.idxA],
          playerB: g.teamB[g.idxB],
          scoreA: 0,
          scoreB: 0,
          winner: null,
          loser: null,
          isBye: false,
          status: 'ready',
        });
      }
    } else {
      // 循环赛：检查是否全部场次打完
      const allDone = tournament.rounds[0].matches.every(function (m) {
        return m.status === 'done';
      });
      if (allDone) {
        const standings = computeRoundRobinStandings(tournament);
        tournament.status = 'finished';
        tournament.champion = standings[0] ? standings[0].name : null;
        tournament.runnerUp = standings[1] ? standings[1].name : null;
        tournament.rankings = standings.map(function (s, i) {
          return { rank: i + 1, name: s.name, detail: s.points + '分 (' + s.wins + '胜)' };
        });
      }
    }

    return tournament;
  }

  function buildEliminationRankings(tournament) {
    const list = [];
    if (tournament.champion) list.push({ rank: 1, name: tournament.champion, detail: '👑 总冠军' });
    if (tournament.runnerUp) list.push({ rank: 2, name: tournament.runnerUp, detail: '🥈 亚军' });
    const seen = new Set(list.map(function (x) { return x.name; }));
    // 按淘汰轮次倒序记录其余选手（四强、八强等）
    for (let r = tournament.rounds.length - 2; r >= 0; r--) {
      const round = tournament.rounds[r];
      for (const m of round.matches) {
        if (m.loser && !seen.has(m.loser)) {
          seen.add(m.loser);
          list.push({
            rank: list.length + 1,
            name: m.loser,
            detail: round.title + '止步',
          });
        }
      }
    }
    return list;
  }

  /** 本地赛事档案存储服务（记录第 1 届、第 2 届…完整冠亚军与比赛流水） */
  function createTournamentStore(storage) {
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
      removeItem: function (k) {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(k);
        }
      },
    };

    function loadArchive() {
      try {
        const raw = adapter.getItem(ARCHIVE_KEY);
        if (!raw) return { version: 1, nextEdition: 1, items: [] };
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.items)) {
          return { version: 1, nextEdition: 1, items: [] };
        }
        return parsed;
      } catch {
        return { version: 1, nextEdition: 1, items: [] };
      }
    }

    function saveFinishedTournament(tournament) {
      const archive = loadArchive();
      const edition = archive.nextEdition;
      const summary = {
        edition: edition,
        id: tournament.id,
        format: tournament.format,
        finishedAt: new Date().toISOString(),
        playerCount: tournament.players.length,
        rangeLabel: tournament.config.rangeLabel || '',
        champion: tournament.champion,
        runnerUp: tournament.runnerUp,
        rankings: tournament.rankings,
        matches: tournament.rounds.reduce(function (acc, r) {
          return acc.concat(
            r.matches
              .filter(function (m) {
                return !m.isBye && m.status === 'done';
              })
              .map(function (m) {
                return {
                  roundTitle: m.roundTitle,
                  playerA: m.playerA,
                  playerB: m.playerB,
                  scoreA: m.scoreA,
                  scoreB: m.scoreB,
                  winner: m.winner,
                };
              })
          );
        }, []),
      };
      archive.items.unshift(summary);
      archive.items = archive.items.slice(0, 30);
      archive.nextEdition = edition + 1;
      try {
        adapter.setItem(ARCHIVE_KEY, JSON.stringify(archive));
      } catch {}
      return summary;
    }

    function clearArchive() {
      try {
        adapter.setItem(ARCHIVE_KEY, JSON.stringify({ version: 1, nextEdition: 1, items: [] }));
      } catch {}
    }

    function saveActiveTournament(tournament, lastMatchNotice) {
      if (!tournament || tournament.status === 'finished') {
        clearActiveTournament();
        return;
      }
      try {
        adapter.setItem(
          ACTIVE_KEY,
          JSON.stringify({
            version: 1,
            savedAt: new Date().toISOString(),
            tournament: tournament,
            lastMatchNotice: lastMatchNotice || '',
          })
        );
      } catch {}
    }

    function loadActiveTournament() {
      try {
        const raw = adapter.getItem(ACTIVE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.tournament || parsed.tournament.status === 'finished') {
          return null;
        }
        return parsed;
      } catch {
        return null;
      }
    }

    function clearActiveTournament() {
      try {
        if (typeof adapter.removeItem === 'function') {
          adapter.removeItem(ACTIVE_KEY);
        } else {
          adapter.setItem(ACTIVE_KEY, '');
        }
      } catch {}
    }

    return {
      loadArchive: loadArchive,
      saveFinishedTournament: saveFinishedTournament,
      clearArchive: clearArchive,
      saveActiveTournament: saveActiveTournament,
      loadActiveTournament: loadActiveTournament,
      clearActiveTournament: clearActiveTournament,
    };
  }

  return {
    TEAM_NAME_PAIRS: TEAM_NAME_PAIRS,
    pickTeamNamePair: pickTeamNamePair,
    createEliminationTournament: createEliminationTournament,
    createRoundRobinTournament: createRoundRobinTournament,
    createTeamGauntletTournament: createTeamGauntletTournament,
    getNextReadyMatch: getNextReadyMatch,
    recordTournamentMatchResult: recordTournamentMatchResult,
    computeRoundRobinStandings: computeRoundRobinStandings,
    createTournamentStore: createTournamentStore,
  };
});
