// codex: 2026-08-09 Bridg-It statistics manager refactored to Blue vs Red
class BridgItStats {
    constructor() {
        this.storageKey = 'bridg_it_stats_v2';
        this.stats = this._loadStats();
    }

    _loadStats() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            console.warn('LocalStorage error:', e);
            return {};
        }
    }

    _saveStats() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.stats));
        } catch (e) {
            console.warn('LocalStorage save error:', e);
        }
    }

    /**
     * Check if a match configuration is exempt from stats calculation
     * @param {string} difficulty 'master'
     * @param {string} playerRole 'blue' | 'red'
     * @param {string} aiRole 'blue' | 'red'
     * @returns {boolean}
     */
    isExemptFromStats(difficulty, playerRole, aiRole) {
        // Exempt if difficulty is 'master' AND AI is first player ('blue')
        return (difficulty === 'master' && aiRole === 'blue');
    }

    /**
     * Record game result
     * @param {string} boardSize e.g. "3x4"
     * @param {string} difficulty 'beginner'|'normal'|'hard'|'master'
     * @param {string} playerRole 'blue'|'red'
     * @param {string} aiRole 'blue'|'red'
     * @param {string} winner 'player' | 'ai'
     */
    recordMatch(boardSize, difficulty, playerRole, aiRole, winner) {
        if (this.isExemptFromStats(difficulty, playerRole, aiRole)) {
            console.log('Match is exempt from standard stats (Master AI First-Player Forced Win Challenge)');
            return false;
        }

        const key = `${boardSize}_${difficulty}`;
        if (!this.stats[key]) {
            this.stats[key] = { played: 0, playerWins: 0, aiWins: 0 };
        }

        this.stats[key].played += 1;
        if (winner === 'player') {
            this.stats[key].playerWins += 1;
        } else {
            this.stats[key].aiWins += 1;
        }

        this._saveStats();
        return true;
    }

    /**
     * Get aggregate stats for a specific size and difficulty
     */
    getStatsFor(boardSize, difficulty) {
        const key = `${boardSize}_${difficulty}`;
        const item = this.stats[key] || { played: 0, playerWins: 0, aiWins: 0 };
        const winRate = item.played > 0 ? Math.round((item.playerWins / item.played) * 100) : 0;
        return {
            ...item,
            winRate
        };
    }

    /**
     * Get overall total stats
     */
    getOverallStats() {
        let totalPlayed = 0;
        let totalWins = 0;
        for (const key in this.stats) {
            totalPlayed += this.stats[key].played;
            totalWins += this.stats[key].playerWins;
        }
        const winRate = totalPlayed > 0 ? Math.round((totalWins / totalPlayed) * 100) : 0;
        return {
            played: totalPlayed,
            playerWins: totalWins,
            winRate
        };
    }

    clearStats() {
        this.stats = {};
        this._saveStats();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BridgItStats };
}
