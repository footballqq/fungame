// motion.js - 设备动作感应模块
const Motion = {
    enabled: false,
    hasPermission: false,
    callback: null,
    
    // 阈值设置
    thresholds: {
        light: 3,    // 轻敲 - 跑步
        medium: 15,  // 中敲 - 跳跃
        heavy: 35    // 重敲 - 摔倒
    },
    
    // 当前加速度
    current: { x: 0, y: 0, z: 0 },
    max: { x: 0, y: 0, z: 0 },
    
    // 冷却控制
    lastTapTime: 0,
    tapCooldown: 100, // 100ms防抖
    jumpCooldown: 500, // 跳跃冷却
    lastJumpTime: 0,

    async init() {
        // iOS需要请求权限
        if (typeof DeviceMotionEvent !== 'undefined' && 
            typeof DeviceMotionEvent.requestPermission === 'function') {
            try {
                const response = await DeviceMotionEvent.requestPermission();
                if (response === 'granted') {
                    this.hasPermission = true;
                    this.startListening();
                }
            } catch (e) {
                console.warn('Motion permission denied:', e);
            }
        } else {
            // 非iOS设备直接监听
            this.hasPermission = true;
            this.startListening();
        }
        
        return this.hasPermission;
    },

    startListening() {
        if (this.enabled) return;
        this.enabled = true;
        window.addEventListener('devicemotion', this.handleMotion.bind(this));
    },

    stopListening() {
        this.enabled = false;
        window.removeEventListener('devicemotion', this.handleMotion.bind(this));
    },

    handleMotion(event) {
        if (!this.enabled) return;
        
        const acc = event.acceleration || { x: 0, y: 0, z: 0 };
        this.current = {
            x: acc.x || 0,
            y: acc.y || 0,
            z: acc.z || 0
        };
        
        // 更新最大值
        if (Math.abs(this.current.x) > Math.abs(this.max.x)) this.max.x = this.current.x;
        if (Math.abs(this.current.y) > Math.abs(this.max.y)) this.max.y = this.current.y;
        if (Math.abs(this.current.z) > Math.abs(this.max.z)) this.max.z = this.current.z;
        
        // 计算合成加速度
        const magnitude = Math.sqrt(
            this.current.x ** 2 + 
            this.current.y ** 2 + 
            this.current.z ** 2
        );
        
        // 更新调试显示
        this.lastMagnitude = magnitude;
        this.updateDebugDisplay(magnitude, null);
        
        this.processTap(magnitude);
    },

    updateDebugDisplay(magnitude, action) {
        const debugAcc = document.getElementById('debug-acc');
        const debugBar = document.getElementById('debug-meter-bar');
        const debugAction = document.getElementById('debug-action');
        const meterLight = document.getElementById('debug-meter-light');
        const meterMedium = document.getElementById('debug-meter-medium');
        const meterHeavy = document.getElementById('debug-meter-heavy');
        
        if (debugAcc) {
            debugAcc.textContent = `当前加速度: ${magnitude.toFixed(1)}`;
        }
        
        if (debugBar) {
            // 最大显示50，超过就满格
            const percent = Math.min(100, (magnitude / 50) * 100);
            debugBar.style.width = percent + '%';
        }
        
        // 更新阈值标记位置
        if (meterLight) meterLight.style.left = (this.thresholds.light / 50 * 100) + '%';
        if (meterMedium) meterMedium.style.left = (this.thresholds.medium / 50 * 100) + '%';
        if (meterHeavy) meterHeavy.style.left = (this.thresholds.heavy / 50 * 100) + '%';
        
        if (debugAction && action) {
            debugAction.textContent = action === 'run' ? '跑步!' : action === 'jump' ? '跳跃!' : '摔倒!';
            debugAction.className = action;
            // 短暂高亮后恢复
            setTimeout(() => {
                if (debugAction.textContent !== '--') {
                    debugAction.textContent = '--';
                    debugAction.className = '';
                }
            }, 300);
        }
    },

    processTap(magnitude) {
        const now = Date.now();
        
        // 防抖
        if (now - this.lastTapTime < this.tapCooldown) return;
        
        let action = null;
        
        if (magnitude >= this.thresholds.heavy) {
            action = 'fall';
            this.lastTapTime = now;
        } else if (magnitude >= this.thresholds.medium) {
            // 跳跃有额外冷却
            if (now - this.lastJumpTime >= this.jumpCooldown) {
                action = 'jump';
                this.lastJumpTime = now;
                this.lastTapTime = now;
            }
        } else if (magnitude >= this.thresholds.light) {
            action = 'run';
            this.lastTapTime = now;
        }
        
        if (action) {
            this.updateDebugDisplay(magnitude, action);
            if (this.callback) {
                this.callback(action, magnitude);
            }
        }
    },

    setCallback(fn) {
        this.callback = fn;
    },

    resetMax() {
        this.max = { x: 0, y: 0, z: 0 };
    },

    // 桌面端键盘模拟（测试用）
    enableKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (!this.callback) return;
            
            let action = null;
            let magnitude = 0;
            
            switch (e.key.toLowerCase()) {
                case ' ':
                case 'w':
                case 'arrowup':
                    action = 'jump';
                    magnitude = 20;
                    break;
                case 'a':
                case 's':
                case 'd':
                case 'arrowleft':
                case 'arrowright':
                case 'arrowdown':
                    action = 'run';
                    magnitude = 5;
                    break;
                case 'x':
                    action = 'fall';
                    magnitude = 40;
                    break;
            }
            
            if (action) {
                this.updateDebugDisplay(magnitude, action);
                this.callback(action, magnitude);
            }
        });
    },

    // 鼠标点击模拟
    enableMouse(element) {
        let lastClick = 0;
        element.addEventListener('click', () => {
            if (!this.callback) return;
            const now = Date.now();
            const timeDiff = now - lastClick;
            
            let action, magnitude;
            if (timeDiff < 200) {
                // 快速双击 = 跳跃
                action = 'jump';
                magnitude = 20;
            } else {
                // 单击 = 跑步
                action = 'run';
                magnitude = 5;
            }
            lastClick = now;
            
            this.updateDebugDisplay(magnitude, action);
            this.callback(action, magnitude);
        });
    }
};
