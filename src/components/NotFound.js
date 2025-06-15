import React from 'react';
import { useNavigate } from 'react-router-dom';

function NotFound() {
  const navigate = useNavigate();
  
  return (
    <div className="welcome-container">
      <h1>404 - Страница не найдена</h1>
      
      <div className="notification error">
        <p>Запрошенная страница не существует или была перемещена</p>
      </div>
      
      <button className="glass-button" onClick={() => navigate('/')}>
        Вернуться на главную
      </button>
    </div>
  );
}

export default NotFound;