import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../store/userStore';

const UsersPage = () => {
  const { users, createUser, switchUser } = useUserStore();
  const [newName, setNewName] = useState('');
  const navigate = useNavigate();

  const handleCreate = () => {
    if (newName.trim()) {
      createUser(newName.trim());
      navigate('/');
    }
  };

  const handleSwitch = (id) => {
    switchUser(id);
    navigate('/');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>选择你的角色</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {users.map(u => (
          <div 
            key={u.id} 
            className="card" 
            style={{ cursor: 'pointer', textAlign: 'center' }}
            onClick={() => handleSwitch(u.id)}
          >
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>👾</div>
            <h3>{u.name}</h3>
            <div style={{ color: 'var(--color-star)' }}>⭐ {u.xp}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h3>创建新角色</h3>
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <input 
            type="text" 
            value={newName} 
            onChange={e => setNewName(e.target.value)}
            placeholder="输入你的名字..."
            style={{ 
              flex: 1, 
              padding: '10px', 
              borderRadius: '8px', 
              border: '1px solid var(--color-primary-600)',
              background: 'var(--color-primary-950)',
              color: 'var(--text-primary)'
            }}
          />
          <button className="btn" onClick={handleCreate}>开始旅程</button>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
