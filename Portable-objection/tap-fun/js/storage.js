// storage.js - 成绩存储模块
const Storage = {
    STORAGE_KEY: 'tapfun_records',
    
    getRecords() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : { '100m': [], '110m': [] };
        } catch (e) {
            console.warn('Failed to load records:', e);
            return { '100m': [], '110m': [] };
        }
    },

    saveRecord(mode, time, rank) {
        const records = this.getRecords();
        
        if (!records[mode]) {
            records[mode] = [];
        }
        
        records[mode].push({
            time: time,
            rank: rank,
            date: new Date().toISOString()
        });
        
        // 按时间排序，只保留前10名
        records[mode].sort((a, b) => a.time - b.time);
        records[mode] = records[mode].slice(0, 10);
        
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(records));
        } catch (e) {
            console.warn('Failed to save record:', e);
        }
        
        return this.isNewRecord(mode, time);
    },

    isNewRecord(mode, time) {
        const records = this.getRecords();
        const modeRecords = records[mode] || [];
        
        if (modeRecords.length === 0) return true;
        return time < modeRecords[0].time;
    },

    getBestTime(mode) {
        const records = this.getRecords();
        const modeRecords = records[mode] || [];
        
        if (modeRecords.length === 0) return null;
        return modeRecords[0].time;
    },

    formatTime(ms) {
        const totalSeconds = ms / 1000;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        const centiseconds = Math.floor((ms % 1000) / 10);
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    },

    formatDate(isoString) {
        const date = new Date(isoString);
        return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    },

    clearRecords() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        } catch (e) {
            console.warn('Failed to clear records:', e);
        }
    }
};
