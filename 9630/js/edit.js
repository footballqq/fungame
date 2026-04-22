// codex: 2026-04-22 why: 实现后台编辑页面的逻辑：牌池配置、题库CRUD操作、LocalStorage 读写及JSON导出

document.addEventListener('DOMContentLoaded', () => {
    let questions = AppStore.getQuestions();
    let deckConfig = AppStore.getDeckConfig();

    // DOM Elements
    const suitCheckboxes = document.querySelectorAll('#suit-options input');
    const rangeMin = document.getElementById('range-min');
    const rangeMax = document.getElementById('range-max');
    const questionList = document.getElementById('question-list');

    // Initialize Config Form
    function initConfigForm() {
        suitCheckboxes.forEach(cb => {
            cb.checked = deckConfig.suits.includes(cb.value);
        });
        rangeMin.value = deckConfig.range[0];
        rangeMax.value = deckConfig.range[1];
    }

    // Save Deck Config
    document.getElementById('save-deck-btn').addEventListener('click', () => {
        const suits = Array.from(suitCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        const min = parseInt(rangeMin.value) || 1;
        const max = parseInt(rangeMax.value) || 13;

        if (suits.length === 0) {
            alert('请至少选择一种花色！');
            return;
        }
        if (min > max) {
            alert('范围最小值不能大于最大值！');
            return;
        }

        deckConfig = { suits, range: [min, max] };
        AppStore.saveDeckConfig(deckConfig);
        alert('牌库配置已保存！');
    });

    // Reset History
    document.getElementById('reset-history-btn').addEventListener('click', () => {
        if (confirm('确定要清空抽奖历史记录吗？（已经抽出的牌将放回牌池）')) {
            AppStore.resetDrawHistory();
            alert('抽奖历史已清空！');
        }
    });

    // Render Question List
    function renderQuestions() {
        questionList.innerHTML = '';
        questions.forEach(q => {
            const item = document.createElement('div');
            item.className = 'question-item';
            item.innerHTML = `
                <div class="q-meta">
                    <span class="badge ${q.category === '必答题' ? 'badge-primary' : 'badge-secondary'}">${q.category}</span>
                    <span class="badge badge-outline">${q.subcategory}</span>
                </div>
                <div class="q-content">${q.content}</div>
                <div class="q-actions">
                    <button class="btn btn-small btn-secondary edit-btn" data-id="${q.id}">编辑</button>
                    <button class="btn btn-small btn-warning delete-btn" data-id="${q.id}">删除</button>
                </div>
            `;
            questionList.appendChild(item);
        });

        // Bind events
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => openModal(parseInt(e.target.dataset.id)));
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => deleteQuestion(parseInt(e.target.dataset.id)));
        });
    }

    // Modal Logic
    const modal = document.getElementById('edit-modal');
    const editId = document.getElementById('edit-id');
    const editCategory = document.getElementById('edit-category');
    const editSubcategory = document.getElementById('edit-subcategory');
    const editContent = document.getElementById('edit-content');

    function openModal(id = null) {
        if (id) {
            const q = questions.find(item => item.id === id);
            document.getElementById('modal-title').innerText = '编辑题目';
            editId.value = q.id;
            editCategory.value = q.category;
            editSubcategory.value = q.subcategory;
            editContent.value = q.content;
        } else {
            document.getElementById('modal-title').innerText = '新增题目';
            editId.value = '';
            editCategory.value = '选答题';
            editSubcategory.value = '';
            editContent.value = '';
        }
        modal.classList.remove('hidden');
    }

    function closeModal() {
        modal.classList.add('hidden');
    }

    document.getElementById('add-question-btn').addEventListener('click', () => openModal());
    document.getElementById('cancel-edit-btn').addEventListener('click', closeModal);

    // Save Question
    document.getElementById('save-question-btn').addEventListener('click', () => {
        const content = editContent.value.trim();
        if (!content) {
            alert('题目内容不能为空！');
            return;
        }

        const newQ = {
            category: editCategory.value,
            subcategory: editSubcategory.value.trim() || '通用',
            content: content
        };

        if (editId.value) {
            // Edit
            const index = questions.findIndex(item => item.id === parseInt(editId.value));
            newQ.id = parseInt(editId.value);
            questions[index] = newQ;
        } else {
            // Add
            const maxId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) : 0;
            newQ.id = maxId + 1;
            questions.push(newQ);
        }

        AppStore.saveQuestions(questions);
        renderQuestions();
        closeModal();
    });

    // Delete Question
    function deleteQuestion(id) {
        if (confirm('确定要删除这道题目吗？')) {
            questions = questions.filter(q => q.id !== id);
            AppStore.saveQuestions(questions);
            renderQuestions();
        }
    }

    // Export JSON
    document.getElementById('export-btn').addEventListener('click', () => {
        const dataStr = JSON.stringify({ questions, deckConfig }, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "tsinghua_9630_data.json";
        a.click();
        URL.revokeObjectURL(url);
    });

    // Init
    initConfigForm();
    renderQuestions();
});
