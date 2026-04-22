// codex: 2026-04-22 why: 实现空格键抽奖动画、从卡池随机抽取去重扑克牌以及随机分配6道题目逻辑

document.addEventListener('DOMContentLoaded', () => {
    const deckConfig = AppStore.getDeckConfig();
    const questions = AppStore.getQuestions();
    let drawHistory = AppStore.getDrawHistory();

    // DOM Elements
    const cardStage = document.getElementById('card-stage');
    const cardHint = document.getElementById('card-hint');
    const playingCard = document.getElementById('playing-card');
    const cardInner = playingCard.querySelector('.card-inner');
    const poolCount = document.getElementById('pool-count');
    const questionStage = document.getElementById('question-stage');
    const mandatoryContainer = document.getElementById('mandatory-questions');
    const optionalContainer = document.getElementById('optional-questions');
    const emptyModal = document.getElementById('empty-modal');

    // Build available pool
    let fullPool = [];
    Object.keys(deckConfig).forEach(suit => {
        const conf = deckConfig[suit];
        if (conf.active) {
            for (let i = conf.min; i <= conf.max; i++) {
                let valStr = i.toString();
                if (i === 1) valStr = 'A';
                if (i === 11) valStr = 'J';
                if (i === 12) valStr = 'Q';
                if (i === 13) valStr = 'K';
                fullPool.push({ suit, valStr, id: `${suit}${valStr}` });
            }
        }
    });

    // Remove already drawn cards
    let availablePool = fullPool.filter(card => !drawHistory.includes(card.id));
    
    // Update UI
    function updatePoolCount() {
        poolCount.innerText = availablePool.length;
    }
    updatePoolCount();

    if (availablePool.length === 0) {
        emptyModal.classList.remove('hidden');
    }

    let isDrawing = false;
    let isShowingQuestions = false;
    let shuffleInterval;

    // Listeners
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault(); // 防止滚动屏幕
            if (isDrawing) return; // 正在抽奖中
            
            if (isShowingQuestions) {
                // 如果正在展示问题，按空格重置状态，准备下一次抽奖
                resetStage();
            } else {
                // 开始抽奖
                startDraw();
            }
        }
        if (e.code === 'Escape') {
            window.location.href = 'index.html';
        }
    });

    // 重新选题按钮
    document.getElementById('redraw-qs-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        // 如果当前是展示题目的状态，允许重新抽题
        if (isShowingQuestions) {
            showQuestions();
        }
    });

    function resetStage() {
        isShowingQuestions = false;
        playingCard.classList.add('hidden');
        cardInner.classList.remove('flipped');
        questionStage.classList.add('hidden');
        cardHint.classList.remove('hidden');
    }

    function startDraw() {
        if (availablePool.length === 0) {
            emptyModal.classList.remove('hidden');
            return;
        }

        isDrawing = true;
        cardHint.classList.add('hidden');
        playingCard.classList.remove('hidden');
        questionStage.classList.add('hidden');
        cardInner.classList.remove('flipped'); // 显示牌背

        // 随机动画效果：每 100ms 换一张牌面
        let flips = 0;
        shuffleInterval = setInterval(() => {
            const randomCard = fullPool[Math.floor(Math.random() * fullPool.length)];
            renderCardFace(randomCard);
            cardInner.classList.toggle('shake');
            flips++;
            
            if (flips > 20) {
                // 停止动画，出结果
                clearInterval(shuffleInterval);
                finishDraw();
            }
        }, 80);
    }

    function finishDraw() {
        // 真正抽取逻辑
        const pickIndex = Math.floor(Math.random() * availablePool.length);
        const finalCard = availablePool.splice(pickIndex, 1)[0];
        
        // 记录历史
        drawHistory.push(finalCard.id);
        AppStore.saveDrawHistory(drawHistory);
        updatePoolCount();

        // 渲染最终结果并翻牌
        renderCardFace(finalCard);
        cardInner.classList.remove('shake');
        
        // 翻转效果
        setTimeout(() => {
            cardInner.classList.add('flipped');
            
            // 翻转结束后展示题目
            setTimeout(() => {
                showQuestions();
                isDrawing = false;
                isShowingQuestions = true;
            }, 800);
        }, 100);
    }

    function renderCardFace(card) {
        const isRed = (card.suit === '♥' || card.suit === '♦');
        playingCard.className = `playing-card ${isRed ? 'red-suit' : 'black-suit'}`;
        
        const vals = playingCard.querySelectorAll('.val');
        vals.forEach(v => v.innerText = card.valStr);
        
        const suits = playingCard.querySelectorAll('.suit');
        suits.forEach(s => s.innerText = card.suit);
    }

    function showQuestions() {
        const mandatoryQs = questions.filter(q => q.category === '必答题');
        const optionalQs = questions.filter(q => q.category === '选答题');

        const pickedMandatory = shuffleArray(mandatoryQs).slice(0, 3);
        const pickedOptional = shuffleArray(optionalQs).slice(0, 3);

        renderQuestionList(mandatoryContainer, pickedMandatory);
        renderQuestionList(optionalContainer, pickedOptional);

        questionStage.classList.remove('hidden');
    }

    function renderQuestionList(container, qs) {
        container.innerHTML = '';
        qs.forEach((q, idx) => {
            const el = document.createElement('div');
            el.className = 'q-item fade-in';
            el.style.animationDelay = `${idx * 0.2}s`;
            el.innerHTML = `
                <div class="q-badge">${q.subcategory}</div>
                <div class="q-text">${q.content}</div>
            `;
            container.appendChild(el);
        });
    }

    function shuffleArray(array) {
        let arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
});
