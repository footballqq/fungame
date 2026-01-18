class AudioManager {
    constructor() {
        this.sounds = {
            hover: document.getElementById('sfx-hover'),
            flip: document.getElementById('sfx-flip'),
            win: document.getElementById('sfx-win'),
            wrong: document.getElementById('sfx-wrong')
        };
    }

    play(name) {
        const sound = this.sounds[name];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.warn('Audio play failed (user interaction needed likely):', e));
        }
    }
}

class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.active = false;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    startCelebrate() {
        this.active = true;
        this.particles = [];
        // Create explosion
        for (let i = 0; i < 150; i++) {
            this.particles.push({
                x: this.canvas.width / 2,
                y: this.canvas.height / 2,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15,
                color: `hsl(${Math.random() * 60 + 30}, 80%, 60%)`, // Gold/Warm colors
                size: Math.random() * 8 + 2,
                life: 100
            });
        }
        this.animate();
    }

    animate() {
        if (!this.active) return;

        // Clear with fade trail
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.globalCompositeOperation = 'source-over';

        let stillAlive = false;
        this.particles.forEach(p => {
            if (p.life > 0) {
                stillAlive = true;
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.2; // Gravity
                p.life--;

                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });

        if (stillAlive) {
            requestAnimationFrame(() => this.animate());
        } else {
            this.active = false;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

const FALLBACK_MANIFEST = {
    "cards": [
        {
            "id": "caochuanjiejian",
            "name": "草船借箭",
            "period": "Eastern Han Dynasty",
            "year_estimate": 208,
            "meaning": "比喻巧妙利用他人资源或借力打力，以智取胜。",
            "story": "赤壁之战前夕，周瑜刁难诸葛亮，限其十日造十万支箭。诸葛亮立下军令状，只求三日，并密请鲁肃备船二十只、草人千余。第三日四更，江上大雾，诸葛亮率船逼近曹营擂鼓佯攻。曹操疑有伏兵，命弓弩手乱箭齐发，箭如雨下。天明雾散，船队满载十余万支箭返航。周瑜叹服其智谋，此即“草船借箭”之计。",
            "prompt": "heavy historical feel, straw boats borrowing arrows",
            "image_path": "cards/caochuanjiejian/image.png"
        },
        {
            "id": "fujingqingzui",
            "name": "负荆请罪",
            "period": "Warring States Period",
            "year_estimate": 279,
            "meaning": "表示主动向对方承认错误，请求责罚，态度非常诚恳。",
            "story": "廉颇负荆请罪。",
            "prompt": "heavy historical feel, carrying thorns",
            "image_path": "cards/fujingqingzui/image.png"
        },
        {
            "id": "kongrongrangli",
            "name": "孔融让梨",
            "period": "Eastern Han Dynasty",
            "year_estimate": 153,
            "meaning": "比喻兄弟姐妹间谦让有礼。",
            "story": "孔融让梨的故事。",
            "prompt": "Kong Rong sharing pears",
            "image_path": "cards/kongrongrangli/image.png"
        },
        {
            "id": "sangumaolu",
            "name": "三顾茅庐",
            "period": "Late Eastern Han Dynasty",
            "year_estimate": 207,
            "meaning": "比喻诚心诚意地一再拜访或邀请。",
            "story": "刘备三顾茅庐。",
            "prompt": "three visits to the thatched cottage",
            "image_path": "cards/sangumaolu/image.png"
        },
        {
            "id": "taoyuanjieyi",
            "name": "桃园结义",
            "period": "Late Eastern Han Dynasty",
            "year_estimate": 184,
            "meaning": "比喻志同道合的兄弟结盟。",
            "story": "刘关张桃园结义。",
            "prompt": "oath of the peach garden",
            "image_path": "cards/taoyuanjieyi/image.png"
        },
        {
            "id": "wanbiguizhao",
            "name": "完璧归赵",
            "period": "Warring States Period",
            "year_estimate": 283,
            "meaning": "指将原物完好无损地归还物主。",
            "story": "蔺相如完璧归赵。",
            "prompt": "returning the jade intact",
            "image_path": "cards/wanbiguizhao/image.png"
        },
        {
            "id": "wenjiqiwu",
            "name": "闻鸡起舞",
            "period": "Jin Dynasty",
            "year_estimate": 300,
            "meaning": "比喻有志之士抓紧时间勤学苦练。",
            "story": "祖逖闻鸡起舞。",
            "prompt": "rising at cockcrow to practice sword",
            "image_path": "cards/wenjiqiwu/image.png"
        },
        {
            "id": "woxinchangdan",
            "name": "卧薪尝胆",
            "period": "Spring and Autumn Period",
            "year_estimate": 494,
            "meaning": "刻苦自励，发愤图强。",
            "story": "勾践卧薪尝胆。",
            "prompt": "sleeping on brushwood and tasting gall",
            "image_path": "cards/woxinchangdan/image.png"
        },
        {
            "id": "zhishangtanbing",
            "name": "纸上谈兵",
            "period": "Warring States Period",
            "year_estimate": 260,
            "meaning": "比喻空谈理论，不能解决实际问题。",
            "story": "赵括纸上谈兵。",
            "prompt": "paper warfare",
            "image_path": "cards/zhishangtanbing/image.png"
        }
    ]
};

class ResourceManager {
    constructor() {
        this.manifest = null;
    }

    async load() {
        try {
            const response = await fetch('../resources/manifest.json');
            if (!response.ok) throw new Error('Network response was not ok');
            this.manifest = await response.json();
            return true;
        } catch (e) {
            console.warn('Failed to load manifest via fetch (likely CORS or missing file). Using fallback data.', e);
            this.manifest = FALLBACK_MANIFEST;
            return true; // Return true as we have data now
        }
    }

    getCards(count) {
        if (!this.manifest || !this.manifest.cards) return [];
        const cardData = this.manifest.cards.length > 0 ? this.manifest.cards : FALLBACK_MANIFEST.cards;
        const shuffled = [...cardData].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
}

class ScoreManager {
    constructor() {
        this.data = this.loadData();
        this.renderProfile();
    }

    loadData() {
        const stored = localStorage.getItem('history_game_data');
        return stored ? JSON.parse(stored) : { score: 0, wins: 0, losses: 0 };
    }

    saveData() {
        localStorage.setItem('history_game_data', JSON.stringify(this.data));
        this.renderProfile();
    }

    addWin(level) {
        let points = 5;
        if (level === 'medium') points = 7;
        if (level === 'hard') points = 10;

        this.data.score += points;
        this.data.wins += 1;
        this.saveData();
        return points;
    }

    addLoss(level) {
        // Loss or Surrender penalty logic: deduct 1/2 of reward, rounded down
        let points = 5;
        if (level === 'medium') points = 7;
        if (level === 'hard') points = 10;

        const penalty = Math.floor(points / 2);

        this.data.score = Math.max(0, this.data.score - penalty); // No negative score
        this.data.losses += 1;
        this.saveData();
        return penalty;
    }

    getRank() {
        const s = this.data.score;
        if (s >= 1000) return { title: "翰林", stars: "⭐⭐⭐⭐⭐" };
        if (s >= 500) return { title: "进士", stars: "⭐⭐⭐⭐" };
        if (s >= 200) return { title: "举人", stars: "⭐⭐⭐" };
        if (s >= 50) return { title: "秀才", stars: "⭐⭐" };
        return { title: "书童", stars: "⭐" };
    }

    renderProfile() {
        const profileEl = document.getElementById('player-profile');
        const scoreDisplayEl = document.getElementById('score-display');
        if (!profileEl) return;

        const rank = this.getRank();
        const winRate = (this.data.wins + this.data.losses) === 0 ? 0 : Math.round((this.data.wins / (this.data.wins + this.data.losses)) * 100);

        profileEl.innerHTML = `
            <div class="profile-rank">${rank.title}</div>
            <div class="profile-stars">${rank.stars}</div>
            <div class="profile-stats">
                <span>积分: ${this.data.score}</span>
                <span>胜率: ${winRate}%</span>
                <span>场次: ${this.data.wins + this.data.losses}</span>
            </div>
        `;

        if (scoreDisplayEl) {
            scoreDisplayEl.textContent = `积分: ${this.data.score}`;
        }
    }
}

class GameApp {
    constructor() {
        this.scoreManager = new ScoreManager(); // Init Score Manager
        this.audio = new AudioManager();
        this.particles = new ParticleSystem('effects-canvas');
        this.resourceManager = new ResourceManager();
        this.currentCards = [];

        this.dom = {
            startScreen: document.getElementById('start-screen'),
            gameScreen: document.getElementById('game-screen'),
            resultScreen: document.getElementById('result-screen'),
            cardContainer: document.getElementById('card-container'),
            levelIndicator: document.getElementById('level-indicator'),
            resultTitle: document.getElementById('result-title'),
            resultMessage: document.getElementById('result-message'),
            gameHint: document.getElementById('game-hint')
        };

        this.selectedCard = null; // New state for click-swap

        this.gameEnded = false;
        this.bindEvents();
    }

    async init() {
        await this.resourceManager.load();
    }

    bindEvents() {
        // Difficulty Selection
        document.querySelectorAll('.difficulty-select button').forEach(btn => {
            btn.addEventListener('click', () => {
                this.audio.play('hover');
                const level = btn.dataset.level;
                this.startGame(level);
            });
            btn.addEventListener('mouseenter', () => this.audio.play('hover'));
        });

        // Controls
        document.getElementById('back-btn').addEventListener('click', () => this.showScreen('start'));
        document.getElementById('submit-btn').addEventListener('click', () => this.checkResult());
        document.getElementById('surrender-btn').addEventListener('click', () => {
            this.showConfirmationModal();
        });

        // Confirmation Modal Events
        document.getElementById('confirm-surrender-btn').addEventListener('click', () => {
            this.hideConfirmationModal();
            this.handleSurrender();
        });

        document.getElementById('cancel-surrender-btn').addEventListener('click', () => {
            this.hideConfirmationModal();
        });

        document.getElementById('retry-btn').addEventListener('click', () => this.showScreen('start'));
        document.getElementById('show-answer-btn').addEventListener('click', () => this.showAnswer());
    }

    showConfirmationModal() {
        const modal = document.getElementById('confirmation-modal');
        const points = this.getPointsForLevel(this.currentLevel);
        document.getElementById('penalty-point').textContent = points;
        modal.classList.remove('hidden');
    }

    hideConfirmationModal() {
        document.getElementById('confirmation-modal').classList.add('hidden');
    }

    handleSurrender() {
        const points = this.scoreManager.addLoss(this.currentLevel);
        // Directly show answer as requested by user ("看答案直接显示答案就行")
        // But users also liked the "Regret" dialog.
        // The user said: "Also viewing answer just show answer directly, don't show dialog anymore."
        // This implies that AFTER confirming surrender, we should skip the intermediate "Regret" result screen
        // and jump straight to the answer view. 
        // HOWEVER, the user also said "Your 'Regret' dialog is quite good."
        // Let's modify the flow: Surrender -> Confirm -> SHOW ANSWER DIRECTLY (cards).
        this.showAnswer(); // This switches to game screen with flipped cards
        // We DO NOT call this.showScreen('result') here, satisfying "don't show dialog anymore".
    }

    getPointsForLevel(level) {
        let points = 5;
        if (level === 'medium') points = 7;
        if (level === 'hard') points = 10;
        return Math.floor(points / 2);
    }

    startGame(level) {
        this.currentLevel = level; // Track level for scoring
        let count = 5;
        if (level === 'medium') count = 7;
        if (level === 'hard') count = 10;

        this.gameEnded = false;
        this.selectedCard = null;
        document.getElementById('submit-btn').style.display = 'inline-block';

        this.currentCards = this.resourceManager.getCards(count);
        this.dom.levelIndicator.textContent = `${count}张`;
        this.renderCards();
        this.showScreen('game');
    }

    showScreen(name) {
        // Handle result screen separately due to custom active class logic
        if (name === 'result') {
            this.dom.resultScreen.classList.remove('hidden'); // Ensure display block if needed
            // Force reflow
            void this.dom.resultScreen.offsetWidth;
            this.dom.resultScreen.classList.add('active');
        } else {
            this.dom.resultScreen.classList.remove('active');
            setTimeout(() => {
                if (!this.dom.resultScreen.classList.contains('active')) {
                    this.dom.resultScreen.classList.add('hidden');
                }
            }, 500); // Wait for fade out

            Object.values(this.dom).forEach(el => {
                if (el.classList.contains('screen') && el.id !== 'result-screen') el.classList.add('hidden');
            });
            this.dom[`${name}Screen`].classList.remove('hidden');
        }
    }

    renderCards() {
        this.dom.cardContainer.innerHTML = '';
        this.dom.gameHint.textContent = "点击卡片选中，再点击另一张交换位置"; // Reset hint

        this.currentCards.forEach((card, index) => {
            const el = document.createElement('div');
            el.className = 'card';
            // el.draggable = true; // Disable DnD
            el.dataset.id = card.id;

            const imgPath = `../resources/${card.image_path}`;

            el.innerHTML = `
                <div class="card-inner">
                    <div class="card-front">
                        <img src="${imgPath}" class="card-image" draggable="false">
                        <div class="card-name">${card.name}</div>
                    </div>
                    <div class="card-back">
                        <h3>${card.name}</h3>
                        <p><strong>时期:</strong> ${card.period}</p>
                        <p><strong>年份:</strong> ~${card.year_estimate}</p>
                        <p><strong>释义:</strong> ${card.meaning || '暂无释义'}</p>
                    </div>
                </div>
            `;

            // Interaction Event
            el.addEventListener('click', () => this.handleCardClick(el));

            // Hover Sound
            el.addEventListener('mouseenter', () => {
                if (!this.gameEnded) this.audio.play('hover');
            });

            this.dom.cardContainer.appendChild(el);

            // Entrance animation delay
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            setTimeout(() => {
                el.style.transition = 'opacity 0.5s, transform 0.5s';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    handleCardClick(el) {
        if (this.gameEnded) {
            // If game ended, click flips the card (Result Mode)
            el.classList.toggle('flipped');
            this.audio.play('flip');
            return;
        }

        // Game Active Mode: Selection Logic
        this.audio.play('hover');

        if (this.selectedCard === null) {
            // Select first card
            this.selectedCard = el;
            el.classList.add('selected');
            this.dom.gameHint.textContent = "已选中一张，请点击另一张进行交换";
        } else if (this.selectedCard === el) {
            // Deselect if clicking same card
            el.classList.remove('selected');
            this.selectedCard = null;
            this.dom.gameHint.textContent = "已取消选中。点击卡片选中，再点击另一张交换位置";
        } else {
            // Swap with second card
            this.swapCards(this.selectedCard, el);
            this.selectedCard.classList.remove('selected');
            this.selectedCard = null;
            this.audio.play('flip'); // Sound for swap
            this.dom.gameHint.textContent = "交换成功！完成后请点击“提交验证”";
        }
    }

    swapCards(cardA, cardB) {
        // Swap in DOM
        const parent = cardA.parentNode;
        const siblingA = cardA.nextSibling === cardB ? cardA : cardA.nextSibling;

        // Move A to before B
        parent.insertBefore(cardA, cardB);
        // Move B to before A's original sibling (or A if they were adjacent)
        parent.insertBefore(cardB, siblingA);
    }

    getDragAfterElement(container, x, y) {
        const draggableElements = [...container.querySelectorAll('.card:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const childMidX = box.left + box.width / 2;
            const childMidY = box.top + box.height / 2;
            const dist = Math.hypot(x - childMidX, y - childMidY);

            if (dist < closest.dist) {
                return { dist: dist, element: child };
            } else {
                return closest;
            }
        }, { dist: Number.POSITIVE_INFINITY }).element;
    }

    checkResult() {
        const currentOrder = [...this.dom.cardContainer.children].map(el => el.dataset.id);
        const cards = currentOrder.map(id => this.currentCards.find(c => c.id === id));

        let sorted = true;
        for (let i = 0; i < cards.length - 1; i++) {
            if (cards[i].year_estimate > cards[i + 1].year_estimate) {
                sorted = false;
                break;
            }
        }

        if (sorted) {
            this.dom.resultTitle.textContent = "恭喜！";
            this.dom.resultTitle.style.color = "#d4af37";

            const points = this.scoreManager.addWin(this.currentLevel);
            this.dom.resultMessage.innerHTML = `排序正确！历史的长河在您的指尖流淌。<br>积分 +${points}`;

            this.gameEnded = true;
            this.audio.play('win');
            this.particles.startCelebrate();

            [...this.dom.cardContainer.children].forEach(el => {
                el.draggable = false;
                el.style.borderColor = "#d4af37";
            });
            this.dom.gameHint.textContent = "恭喜过关！点击“查看答案”了解成语背后的故事。";

            this.showScreen('result');
        } else {
            this.dom.resultTitle.textContent = "遗憾";
            this.dom.resultTitle.style.color = "#8d6e63";
            this.dom.resultMessage.textContent = "顺序尚有偏差，请再接再厉。";

            this.audio.play('wrong');

            // Visual feedback: Shake
            this.dom.cardContainer.classList.add('shake');
            setTimeout(() => {
                this.dom.cardContainer.classList.remove('shake');
            }, 500);

            this.dom.gameHint.textContent = "顺序不正确，请尝试调整卡片位置再次提交。";
        }
    }

    showAnswer() {
        this.gameEnded = true;
        const sortedCards = [...this.currentCards].sort((a, b) => a.year_estimate - b.year_estimate);

        this.dom.cardContainer.innerHTML = '';
        this.dom.gameHint.textContent = "【正确答案】点击卡片翻转，查看成语的年代与典故。";
        document.getElementById('submit-btn').style.display = 'none'; // Ensure submit is hidden

        sortedCards.forEach((card, i) => {
            const el = document.createElement('div');
            el.className = 'card flipped'; // Start Flipped
            el.dataset.id = card.id;

            const imgPath = `../resources/${card.image_path}`;
            el.innerHTML = `
                <div class="card-inner">
                    <div class="card-front">
                        <img src="${imgPath}" class="card-image">
                        <div class="card-name">${card.name}</div>
                    </div>
                    <div class="card-back">
                        <h3>${card.name}</h3>
                         <p><strong>时期:</strong> ${card.period}</p>
                        <p><strong>年份:</strong> ~${card.year_estimate}</p>
                        <p><strong>释义:</strong> ${card.meaning || '暂无释义'}</p>
                    </div>
                </div>
            `;
            el.addEventListener('click', () => {
                el.classList.toggle('flipped');
                this.audio.play('flip');
            });
            this.dom.cardContainer.appendChild(el);

            // Cascading entry
            el.style.opacity = '0';
            setTimeout(() => {
                el.style.opacity = '1';
            }, i * 50);
        });

        this.showScreen('game');
        document.getElementById('submit-btn').style.display = 'none';
        this.dom.levelIndicator.textContent = "正确答案";
    }
}

const app = new GameApp();
app.init();
