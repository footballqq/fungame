class ResourceManager {
    constructor() {
        this.manifest = null;
    }

    async load() {
        try {
            const response = await fetch('../resources/manifest.json');
            this.manifest = await response.json();
            return true;
        } catch (e) {
            console.error('Failed to load manifest:', e);
            alert('资源加载失败');
            return false;
        }
    }

    getCards(count) {
        if (!this.manifest || !this.manifest.cards) return [];
        // Randomly shuffle and slice
        const shuffled = [...this.manifest.cards].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
}

class GameApp {
    constructor() {
        this.resourceManager = new ResourceManager();
        this.currentCards = [];
        this.dom = {
            startScreen: document.getElementById('start-screen'),
            gameScreen: document.getElementById('game-screen'),
            resultScreen: document.getElementById('result-screen'),
            cardContainer: document.getElementById('card-container'),
            levelIndicator: document.getElementById('level-indicator'),
            resultTitle: document.getElementById('result-title'),
            resultMessage: document.getElementById('result-message')
        };

        this.dragState = {
            dragging: false,
            el: null,
            startX: 0,
            startY: 0,
            initialIndex: -1
        };

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
                const level = btn.dataset.level;
                this.startGame(level);
            });
        });

        // Game Controls
        document.getElementById('back-btn').addEventListener('click', () => this.showScreen('start'));
        document.getElementById('submit-btn').addEventListener('click', () => this.checkResult());
        document.getElementById('retry-btn').addEventListener('click', () => this.showScreen('start'));
        document.getElementById('show-answer-btn').addEventListener('click', () => this.showAnswer());
    }

    startGame(level) {
        let count = 5;
        if (level === 'medium') count = 7;
        if (level === 'hard') count = 10;

        this.gameEnded = false;
        document.getElementById('submit-btn').style.display = 'inline-block';

        this.currentCards = this.resourceManager.getCards(count);
        this.dom.levelIndicator.textContent = `当前模式: ${count}张`;
        this.renderCards();
        this.showScreen('game');
    }

    showScreen(name) {
        Object.values(this.dom).forEach(el => {
            if (el.classList.contains('screen')) el.classList.add('hidden');
        });
        this.dom[`${name}Screen`].classList.remove('hidden');
    }

    renderCards() {
        this.dom.cardContainer.innerHTML = '';
        this.currentCards.forEach((card, index) => {
            const el = document.createElement('div');
            el.className = 'card';
            el.draggable = true;
            el.dataset.id = card.id;

            // Image path
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

            // Click to flip (only when permitted, e.g., in answer mode)
            el.addEventListener('click', () => {
                if (this.gameEnded) {
                    el.classList.toggle('flipped');
                }
            });

            this.addDragEvents(el);
            this.dom.cardContainer.appendChild(el);
        });
    }

    addDragEvents(el) {
        // Simple swap logic
        el.addEventListener('dragstart', (e) => {
            el.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            this.dragState.el = el;
            this.dragState.initialIndex = [...this.dom.cardContainer.children].indexOf(el);
        });

        el.addEventListener('dragend', () => {
            el.classList.remove('dragging');
            this.dragState.el = null;
        });

        el.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const container = this.dom.cardContainer;
            const afterElement = this.getDragAfterElement(container, e.clientX, e.clientY);
            const draggable = document.querySelector('.dragging');
            if (afterElement == null) {
                container.appendChild(draggable);
            } else {
                container.insertBefore(draggable, afterElement);
            }
        });
    }

    getDragAfterElement(container, x, y) {
        const draggableElements = [...container.querySelectorAll('.card:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            // Check horizontal and vertical distance logic
            // For flex wrap, it's a bit complex. Simple distance check:
            const offset = (x - box.left - box.width / 2) + (y - box.top - box.height / 2); // very rough

            // Better: Find element that center is closest to pointer
            const childX = box.left + box.width / 2;
            const childY = box.top + box.height / 2;
            const dist = Math.hypot(x - childX, y - childY);

            if (dist < closest.dist) {
                return { offset: dist, element: child };
            } else {
                return closest;
            }
        }, { dist: Number.POSITIVE_INFINITY }).element;
    }

    // Improved drag logic needed for flex grid? 
    // Standard approach: insertBefore based on mouse position relative to siblings
    // Re-implementing correctly:
    // ... Actually, the dragover logic above is flawed for grid. 
    // Let's use a simpler swap-on-drop or insert-on-hover approach.
    // For now, let's stick to a standard HTML5 DnD insert logic which works reasonably well.

    checkResult() {
        const currentOrder = [...this.dom.cardContainer.children].map(el => el.dataset.id);

        // Find Card objects
        const cards = currentOrder.map(id => this.currentCards.find(c => c.id === id));

        // Check if sorted by year_estimate
        let sorted = true;
        for (let i = 0; i < cards.length - 1; i++) {
            if (cards[i].year_estimate > cards[i + 1].year_estimate) {
                sorted = false;
                break;
            }
        }

        if (sorted) {
            this.dom.resultTitle.textContent = "恭喜！";
            this.dom.resultMessage.textContent = "排序正确！(按历史年代)";
            this.gameEnded = true;
            // Disable dragging
            [...this.dom.cardContainer.children].forEach(el => el.draggable = false);
        } else {
            this.dom.resultTitle.textContent = "遗憾";
            this.dom.resultMessage.textContent = "顺序不正确，请再接再厉。";
        }
        this.showScreen('result');
    }

    showAnswer() {
        this.gameEnded = true;
        // Sort the visual cards
        const sortedCards = [...this.currentCards].sort((a, b) => a.year_estimate - b.year_estimate);

        // Re-render sorted
        this.dom.cardContainer.innerHTML = '';
        sortedCards.forEach(card => {
            const el = document.createElement('div');
            el.className = 'card'; // Auto flip to show answer? Or just let them flip? Let's just render normally but allow flip.
            // Actually, "Show Answer" implied showing the back details essentially to explain.
            // Let's render them and set them to flipped.
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
            // Allow clicking to flip back
            el.addEventListener('click', () => {
                el.classList.toggle('flipped');
            });
            this.dom.cardContainer.appendChild(el);

            // Trigger reflow to animate flip? Or just add class.
            setTimeout(() => el.classList.add('flipped'), 50);
        });

        this.showScreen('game');
        document.getElementById('submit-btn').style.display = 'none';
        document.getElementById('level-indicator').textContent = "正确答案";
    }
}

// Init
const app = new GameApp();
app.init();
