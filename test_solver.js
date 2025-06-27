// 测试求解器脚本
const TrainSolver = require('./solver.js');

function runTests() {
    const solver = new TrainSolver();
    
    // 初始状态：O-7 A-6 B-8 C-4 D-2 E-1 F-5 H-3 G-空
    const initialState = {
        'O': 7, 'A': 6, 'B': 8, 'C': 4, 'D': 2, 'E': 1, 'F': 5, 'H': 3, 'G': null
    };
    
    console.log('🚂 铁道机车调度问题求解器测试');
    console.log('=====================================');
    
    // 分析初始状态
    console.log('\n📊 初始状态分析:');
    solver.analyzeState(initialState);
    
    // 测试任务1：无限制
    console.log('\n\n🎯 任务1测试 - 无移动限制');
    console.log('=====================================');
    const result1 = solver.solve(initialState);
    
    if (result1.success) {
        console.log('\n✅ 任务1解决方案:');
        console.log('最优步数:', result1.totalMoves);
        
        // 验证解决方案
        console.log('\n🔍 验证解决方案...');
        let currentState = { ...initialState };
        
        console.log('初始状态:', currentState);
        result1.moves.forEach((move, index) => {
            currentState[move.from] = null;
            currentState[move.to] = move.train;
            console.log(`步骤 ${index + 1}: 🚂${move.train} ${move.from}→${move.to}`);
            console.log('当前状态:', currentState);
        });
        
        console.log('最终状态是否为目标状态:', solver.isGoalState(currentState));
    }
    
    // 测试任务2：17步限制，不同的不可移动车辆
    console.log('\n\n🎯 任务2测试 - 17步限制');
    console.log('=====================================');
    
    const testTrains = [1, 2, 3, 4, 5, 6, 7, 8];
    
    for (const immobileTrain of testTrains) {
        console.log(`\n🔒 测试不可移动车辆: ${immobileTrain}`);
        console.log('-----------------------------------');
        
        const result2 = solver.solve(initialState, immobileTrain);
        
        if (result2.success) {
            if (result2.totalMoves <= 17) {
                console.log(`✅ 车辆${immobileTrain}不移动时，可在${result2.totalMoves}步内完成任务！`);
                
                // 验证不可移动车辆确实没有移动
                const movedTrains = new Set(result2.moves.map(move => move.train));
                if (!movedTrains.has(immobileTrain)) {
                    console.log(`✅ 确认车辆${immobileTrain}未移动`);
                } else {
                    console.log(`❌ 错误：车辆${immobileTrain}被移动了！`);
                }
            } else {
                console.log(`❌ 车辆${immobileTrain}不移动时，需要${result2.totalMoves}步，超过17步限制`);
            }
        } else {
            console.log(`❌ 车辆${immobileTrain}不移动时，未找到解决方案`);
        }
    }
    
    // 总结最优策略
    console.log('\n\n📋 最优策略总结');
    console.log('=====================================');
    console.log('任务1最优解步数:', result1.success ? result1.totalMoves : '未找到');
    
    // 找到任务2的最佳不可移动车辆选择
    console.log('\n任务2推荐策略:');
    console.log('选择合适的不可移动车辆，使总步数≤17步');
}

// 运行测试
if (require.main === module) {
    runTests();
} 