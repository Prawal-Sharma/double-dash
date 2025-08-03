import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import config from '../config';
import { AuthResponse, ApiError } from '../types';

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post<AuthResponse>(`${config.API_BASE_URL}/api/auth/login`, { email, password });
      const { token } = response.data;
      // Store JWT in localStorage
      localStorage.setItem('jwt', token);
      // Redirect to home
      navigate('/');
    } catch (err: any) {
      setIsLoading(false);
      console.error('Login error:', err);
      
      // Handle specific error types
      if (err.response?.status === 401) {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Login failed. Please try again.');
      }
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Login</h2>
      {error && <p style={{ color:'red' }}>{error}</p>}
      <form onSubmit={handleLogin} style={{ display:'inline-block', textAlign:'left' }}>
        <div style={{ marginBottom:'10px' }}>
          <label>Email: </label>
          <input 
            type="email" 
            value={email}
            onChange={e => {
              setEmail(e.target.value);
            }}
            required
          />
        </div>
        <div style={{ marginBottom:'10px' }}>
          <label>Password: </label>
          <input 
            type="password" 
            value={password}
            onChange={e => {
              setPassword(e.target.value);
            }}
            required
          />
        </div>
        <button type="submit" disabled={isLoading} style={{ 
          padding: '10px 20px', 
          backgroundColor: isLoading ? '#ccc' : '#fc4c02',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: isLoading ? 'not-allowed' : 'pointer'
        }}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login;
