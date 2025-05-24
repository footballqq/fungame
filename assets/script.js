let words = [];
let currentCard = 0;
let currentMode = 'english';
let showingDetails = false;

// 加载JSON文件
async function loadWords() {
    try {
        const response = await fetch('/assets/data/words.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        words = shuffleArray(data.words);
        document.getElementById('total').textContent = words.length;
        setMode('english'); // 默认英文模式
    } catch (error) {
        console.error('加载数据失败:', error);
        document.getElementById('initialWord').textContent = '加载失败，请刷新页面重试';
    }
}

// Fisher-Yates 洗牌算法
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function setMode(mode) {
    if (words.length === 0) return;
    currentMode = mode;
    showingDetails = false;
    showCard(currentCard);
}

function showCard(index) {
    if (words.length === 0) return;
    
    const word = words[index];
    const initialWord = document.getElementById('initialWord');
    const details = document.getElementById('details');
    
    // 隐藏详细信息
    details.classList.add('hidden');
    showingDetails = false;

    if (currentMode === 'english') {
        // 英文模式：只显示英文单词
        initialWord.textContent = word.english;
        document.getElementById('phonetic').textContent = word.phonetic;
        document.getElementById('chinese').textContent = word.chinese;
        document.getElementById('example').textContent = word.example;
        document.getElementById('translation').textContent = word.translation;
    } else {
        // 中文模式：显示中文和所有其他信息
        initialWord.textContent = word.chinese;
        document.getElementById('phonetic').textContent = word.phonetic;
        document.getElementById('english').textContent = word.english;
        document.getElementById('example').textContent = word.example;
        document.getElementById('translation').textContent = word.translation;
        details.classList.remove('hidden'); // 中文模式下直接显示所有信息
    }
    
    document.getElementById('current').textContent = index + 1;
}

function toggleDetails() {
    if (words.length === 0) return;

    const details = document.getElementById('details');
    
    if (currentMode === 'english') {
        // 英文模式下才切换显示/隐藏
        showingDetails = !showingDetails;
        if (showingDetails) {
            details.classList.remove('hidden');
        } else {
            details.classList.add('hidden');
        }
    }
    // 中文模式下点击无效
}

function nextCard() {
    if (words.length === 0) return;
    currentCard = (currentCard + 1) % words.length;
    showCard(currentCard);
}

function prevCard() {
    if (words.length === 0) return;
    currentCard = (currentCard - 1 + words.length) % words.length;
    showCard(currentCard);
}

// 添加点击卡片显示详情的事件监听器
document.getElementById('card').addEventListener('click', toggleDetails);

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', loadWords);