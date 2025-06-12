import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="welcome-container">
      <h1>Добро пожаловать в игру "Бункер"</h1>

      <button onClick={() => navigate('/join-game')}>Войти в игру</button>
      <Link to="/rules">
        <button>Правила игры</button>
      </Link>
      <Link to="/create-game">
        <button>Создать игру</button>
      </Link>
    </div>
  );
}

export default Home;