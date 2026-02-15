// frontend/src/components/AuthForm.tsx
import { useState } from 'react';
import client from '../api/client';

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = isLogin 
        ? await client.post('/auth/login', { username, password })
        : await client.post('/auth/register', { username, password });
      
      localStorage.setItem('token', res.data.access_token);
      window.location.reload();
    } catch (error) {
      alert(isLogin ? 'Invalid credentials' : 'Username already exists');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto' }}>
      <h2>{isLogin ? 'Login' : 'Register'}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">{isLogin ? 'Login' : 'Register'}</button>
        <button type="button" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Need account?' : 'Already have account?'}
        </button>
      </form>
    </div>
  );
}