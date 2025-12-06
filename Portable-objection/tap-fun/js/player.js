// player.js - 角色系统
class Player {
    constructor(isPlayer = false, difficulty = 'normal', playerRef = null) {
        this.isPlayer = isPlayer;
        this.difficulty = difficulty;
        this.playerRef = playerRef; // AI 用来参考玩家位置
        
        // 位置状态
        this.distance = 0;
        this.speed = 0;
        this.maxSpeed = 24; // 最大速度
        this.baseAcceleration = 6; // 每次敲击给的加速度（4次达到上限: 6*4=24）
        this.friction = 0.008; // 摩擦力，越小速度持续越久
        
        // 跳跃状态
        this.isJumping = false;
        this.jumpOffset = 0;
        this.jumpVelocity = 0;
        this.jumpProgress = 0; // 跳跃进度 0-1
        this.jumpDuration = 400; // 跳跃持续时间ms
        this.jumpDistance = 0; // 跳跃水平距离
        this.jumpStartX = 0; // 跳跃起始位置
        this.jumpHeight = 35; // 跳跃高度
        
        // 摔倒状态
        this.isFallen = false;
        this.fallTimer = 0;
        this.fallDuration = 600; // 摔倒恢复时间（缩短）
        
        // AI 参数
        this.aiTimer = 0;
        this.aiNextAction = 0;
        this.aiBaseInterval = 80; // AI基础敲击间隔
        this.setupAI();
        
        // 已碰撞的栏架索引
        this.hitHurdles = new Set();
        
        // 统计
        this.finishTime = null;
        this.finished = false;
    }

    setupAI() {
        if (this.isPlayer) return;
        
        const difficultySettings = {
            easy: { tapInterval: 140, winChance: 0.1 },
            normal: { tapInterval: 110, winChance: 0.15 },
            hard: { tapInterval: 85, winChance: 0.25 }
        };
        
        this.aiSettings = difficultySettings[this.difficulty] || difficultySettings.normal;
    }

    update(deltaTime, hurdles = [], raceDistance = 100) {
        if (this.finished) return;
        

        
        // 更新摔倒状态
        if (this.isFallen) {
            this.fallTimer -= deltaTime;
            if (this.fallTimer <= 0) {
                this.isFallen = false;
            }
            // 摔倒时速度快速衰减到0
            this.speed = Math.max(0, this.speed * 0.9);
        } else {
            // 正常摩擦力减速
            this.speed = Math.max(0, this.speed - this.friction * deltaTime);
        }
        
        // 更新跳跃 - 抛物线向前跳
        if (this.isJumping) {
            this.jumpProgress += deltaTime / this.jumpDuration;
            
            if (this.jumpProgress >= 1) {
                // 跳跃结束
                this.jumpProgress = 0;
                this.jumpOffset = 0;
                this.isJumping = false;
            } else {
                // 抛物线计算：y = -4h * (x - 0.5)^2 + h，其中 x 是进度 0-1
                const t = this.jumpProgress;
                this.jumpOffset = -this.jumpHeight * 4 * (t - 0.5) * (t - 0.5) + this.jumpHeight;
                this.jumpOffset = -this.jumpOffset; // 因为向上是负值
            }
        }
        
        // AI 逻辑
        if (!this.isPlayer) {
            this.updateAI(deltaTime, hurdles, raceDistance);
        }
        
        // 更新位置
        this.distance += this.speed * deltaTime / 1000;
        
        // 检查终点
        if (this.distance >= raceDistance) {
            this.distance = raceDistance;
            this.finished = true;
        }
    }

    updateAI(deltaTime, hurdles, raceDistance) {
        if (this.isFallen) return;
        
        this.aiTimer += deltaTime;
        
        // 计算与玩家的距离差
        let playerDistance = 0;
        if (this.playerRef) {
            playerDistance = this.playerRef.distance;
        }
        const distanceDiff = playerDistance - this.distance;
        
        // 动态调整AI敲击频率 - 落后时加快，领先时放慢
        let interval = this.aiSettings.tapInterval;
        if (distanceDiff > 5) {
            // 落后太多，加速追赶
            interval *= 0.6;
        } else if (distanceDiff > 2) {
            interval *= 0.8;
        } else if (distanceDiff < -3) {
            // 领先太多，稍微放慢
            interval *= 1.3;
        }
        
        // 随机波动
        interval += (Math.random() - 0.5) * 40;
        
        if (this.aiTimer >= interval) {
            this.aiTimer = 0;
            
            // 小概率失误（不敲）
            if (Math.random() < 0.05) {
                return;
            }
            
            // 检查前方栏架
            const upcomingHurdle = this.findUpcomingHurdle(hurdles);
            if (upcomingHurdle !== null) {
                const distanceToHurdle = upcomingHurdle - this.distance;
                // 根据当前速度计算跳跃时机
                const jumpDistance = this.speed * 0.3 + 1.5;
                if (distanceToHurdle > 0 && distanceToHurdle < jumpDistance && !this.isJumping) {
                    this.jump();
                    return;
                }
            }
            
            // 正常跑步
            this.run();
        }
    }

    findUpcomingHurdle(hurdles) {
        for (const hurdle of hurdles) {
            if (hurdle > this.distance + 0.5) {
                return hurdle;
            }
        }
        return null;
    }

    run() {
        if (this.isFallen) return;
        // 每次敲击增加速度，但有上限
        this.speed = Math.min(this.maxSpeed, this.speed + this.baseAcceleration);
    }

    jump() {
        if (this.isFallen || this.isJumping) return;
        this.isJumping = true;
        this.jumpProgress = 0;
        this.jumpStartX = this.distance;
        // 跳跃自带初速度（相当于2次敲击）
        this.speed = Math.min(this.maxSpeed, this.speed + this.baseAcceleration * 2);
        // 跳跃时根据当前速度计算水平距离
        this.jumpDistance = this.speed * 0.4 + 2;
    }

    fall() {
        if (this.isFallen) return;
        this.isFallen = true;
        this.fallTimer = this.fallDuration;
        this.speed = 0; // 速度归零
        this.isJumping = false;
        this.jumpOffset = 0;
    }

    checkHurdleCollision(hurdles) {
        // 跳跃中或已摔倒不检测
        if (this.isJumping || this.isFallen) return false;
        
        for (let i = 0; i < hurdles.length; i++) {
            // 已经碰撞过的栏架跳过
            if (this.hitHurdles.has(i)) continue;
            
            const hurdle = hurdles[i];
            const diff = this.distance - hurdle;
            // 碰撞范围：刚过栏架一点点
            if (diff > -0.3 && diff < 1.0) {
                this.fall();
                this.hitHurdles.add(i); // 记录已碰撞
                return true;
            }
        }
        return false;
    }

    reset() {
        this.distance = 0;
        this.speed = 0;
        this.isJumping = false;
        this.jumpOffset = 0;
        this.jumpVelocity = 0;
        this.jumpProgress = 0;
        this.isFallen = false;
        this.fallTimer = 0;
        this.hitHurdles = new Set();
        this.finished = false;
        this.finishTime = null;
        this.aiTimer = 0;
    }
}

// 创建玩家和AI
function createPlayers(difficulty) {
    const humanPlayer = new Player(true, difficulty);
    return [
        new Player(false, difficulty, humanPlayer), // AI 1，参考玩家位置
        humanPlayer,                                 // 玩家
        new Player(false, difficulty, humanPlayer)  // AI 2，参考玩家位置
    ];
}
