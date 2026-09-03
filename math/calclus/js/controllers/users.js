import { Store } from '../state.js?v=23';

export function init() {
  function renderUsers() {
    const container = document.getElementById('user-list-container');
    if (!container) return;
    const users = Store.getUsers();
    
    container.innerHTML = '';
    
    users.forEach(user => {
      const card = document.createElement('div');
      card.className = 'user-card';
      card.innerHTML = `
        <div class="user-card-avatar">👾</div>
        <div class="user-card-name">${user.nickname}</div>
        <div style="font-size: 12px; color: var(--color-star); margin-top: 5px;">⭐ ${user.totalXP}</div>
      `;
      card.addEventListener('click', () => {
        Store.switchUser(user.id);
        window.location.replace('#/');
        window.location.reload();
      });
      container.appendChild(card);
    });
  }

  const btnCreate = document.getElementById('btn-create-user');
  if (btnCreate) {
    btnCreate.addEventListener('click', () => {
      const nameInput = document.getElementById('new-user-name').value.trim();
      if (nameInput) {
        Store.createUser(nameInput, 'default');
        window.location.replace('#/');
        window.location.reload();
      } else {
        alert('名字不能为空哦！');
      }
    });
  }

  renderUsers();
}
