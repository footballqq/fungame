// 铁道机车调度问题最优解算法
// 使用BFS（广度优先搜索）找到最短步数解决方案

class TrainSolver {
    constructor() {
        // 轨道连接关系 - A在正下方，逆时针BCDEFGH
        this.railConnections = {
            'A': ['B', 'H', 'O'],
            'B': ['A', 'C'],
            'C': ['B', 'D', 'O'],
            'D': ['C', 'E'],
            'E': ['D', 'F', 'O'],
            'F': ['E', 'G'],
            'G': ['F', 'H', 'O'],
            'H': ['G', 'A'],
            'O': ['A', 'C', 'E', 'G']
        };
        
        // 外圈车站顺序
        this.counterClockwiseStations = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        this.clockwiseStations = ['A', 'H', 'G', 'F', 'E', 'D', 'C', 'B'];
    }
    
    // 将状态转换为字符串（用于哈希）
    stateToString(state) {
        const stations = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'O'];
        return stations.map(s => state[s] || 0).join(',');
    }
    
    // 检查是否为目标状态
    isGoalState(state) {
        // O站必须为空
        if (state['O'] !== null) return false;
        
        // 检查逆时针或顺时针方向的连续1-8排列
        return this.checkDirection(state, this.counterClockwiseStations) || 
               this.checkDirection(state, this.clockwiseStations);
    }
    
    // 检查特定方向的连续排列
    checkDirection(state, stations) {
        for (let startIndex = 0; startIndex < stations.length; startIndex++) {
            let isValidSequence = true;
            
            for (let i = 0; i < 8; i++) {
                const stationIndex = (startIndex + i) % 8;
                const station = stations[stationIndex];
                const expectedNumber = i + 1;
                
                if (state[station] !== expectedNumber) {
                    isValidSequence = false;
                    break;
                }
            }
            
            if (isValidSequence) return true;
        }
        return false;
    }
    
    // 获取所有可能的移动
    getPossibleMoves(state) {
        const moves = [];
        
        // 找到空车站
        const emptyStation = Object.keys(state).find(station => state[station] === null);
        
        // 检查能移动到空车站的车辆
        for (const station of Object.keys(state)) {
            if (state[station] !== null) {
                if (this.canMoveTo(state, station, emptyStation)) {
                    moves.push({
                        from: station,
                        to: emptyStation,
                        train: state[station]
                    });
                }
            }
        }
        
        return moves;
    }
    
    // 检查是否可以从起点移动到终点
    canMoveTo(state, fromStation, toStation) {
        // 检查直接连接
        if (this.railConnections[fromStation].includes(toStation)) {
            return true;
        }
        
        // 使用BFS检查是否有路径（只能通过空车站）
        const visited = new Set([fromStation]);
        const queue = [fromStation];
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            for (const neighbor of this.railConnections[current]) {
                if (neighbor === toStation) return true;
                
                if (!visited.has(neighbor) && state[neighbor] === null) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }
        
        return false;
    }
    
    // 执行移动，返回新状态
    makeMove(state, move) {
        const newState = { ...state };
        newState[move.from] = null;
        newState[move.to] = move.train;
        return newState;
    }
    
    // 使用BFS找到最优解
    solve(initialState, immobileTrain = null) {
        const startTime = Date.now();
        const queue = [{
            state: initialState,
            path: [],
            moves: []
        }];
        
        const visited = new Set([this.stateToString(initialState)]);
        let exploredStates = 0;
        
        console.log('开始搜索最优解...');
        console.log('初始状态:', initialState);
        console.log('不可移动车辆:', immobileTrain);
        
        while (queue.length > 0) {
            const current = queue.shift();
            exploredStates++;
            
            // 检查是否达到目标状态
            if (this.isGoalState(current.state)) {
                const endTime = Date.now();
                console.log('\n🎉 找到最优解！');
                console.log('总步数:', current.moves.length);
                console.log('搜索时间:', (endTime - startTime), 'ms');
                console.log('探索状态数:', exploredStates);
                console.log('\n移动序列:');
                current.moves.forEach((move, index) => {
                    console.log(`${index + 1}: 🚂${move.train} ${move.from}→${move.to}`);
                });
                
                return {
                    success: true,
                    moves: current.moves,
                    totalMoves: current.moves.length,
                    exploredStates: exploredStates,
                    searchTime: endTime - startTime
                };
            }
            
            // 获取所有可能的移动
            const possibleMoves = this.getPossibleMoves(current.state);
            
            for (const move of possibleMoves) {
                // 跳过不可移动的车辆
                if (immobileTrain && move.train === immobileTrain) {
                    continue;
                }
                
                const newState = this.makeMove(current.state, move);
                const stateStr = this.stateToString(newState);
                
                if (!visited.has(stateStr)) {
                    visited.add(stateStr);
                    queue.push({
                        state: newState,
                        path: [...current.path, stateStr],
                        moves: [...current.moves, move]
                    });
                }
            }
            
            // 防止搜索时间过长
            if (exploredStates % 1000 === 0) {
                console.log(`已探索 ${exploredStates} 个状态...`);
            }
            
            if (exploredStates > 50000) {
                console.log('搜索状态数超过限制，停止搜索');
                break;
            }
        }
        
        const endTime = Date.now();
        console.log('\n❌ 未找到解决方案');
        console.log('搜索时间:', (endTime - startTime), 'ms');
        console.log('探索状态数:', exploredStates);
        
        return {
            success: false,
            exploredStates: exploredStates,
            searchTime: endTime - startTime
        };
    }
    
    // 分析当前状态
    analyzeState(state) {
        console.log('\n📊 状态分析:');
        
        // 统计车辆位置
        const trainPositions = {};
        Object.keys(state).forEach(station => {
            if (state[station] !== null) {
                trainPositions[state[station]] = station;
            }
        });
        
        console.log('车辆位置:', trainPositions);
        
        // 检查每辆车是否在正确位置
        const counterClockwiseCorrect = this.analyzeDirection(state, this.counterClockwiseStations, '逆时针');
        const clockwiseCorrect = this.analyzeDirection(state, this.clockwiseStations, '顺时针');
        
        return {
            trainPositions,
            counterClockwiseCorrect,
            clockwiseCorrect
        };
    }
    
    // 分析特定方向的正确性
    analyzeDirection(state, stations, direction) {
        console.log(`\n${direction}方向分析:`);
        let maxCorrect = 0;
        let bestStart = 0;
        
        for (let startIndex = 0; startIndex < stations.length; startIndex++) {
            let correct = 0;
            const sequence = [];
            
            for (let i = 0; i < 8; i++) {
                const stationIndex = (startIndex + i) % 8;
                const station = stations[stationIndex];
                const expectedNumber = i + 1;
                const actualNumber = state[station];
                
                sequence.push(`${station}(期望${expectedNumber},实际${actualNumber})`);
                
                if (actualNumber === expectedNumber) {
                    correct++;
                }
            }
            
            if (correct > maxCorrect) {
                maxCorrect = correct;
                bestStart = startIndex;
            }
            
            console.log(`从${stations[startIndex]}开始: ${correct}/8 正确`);
        }
        
        console.log(`最佳起点: ${stations[bestStart]}, 正确率: ${maxCorrect}/8`);
        return { maxCorrect, bestStart: stations[bestStart] };
    }
}

// 导出求解器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrainSolver;
}

// 浏览器环境下的全局变量
if (typeof window !== 'undefined') {
    window.TrainSolver = TrainSolver;
} 