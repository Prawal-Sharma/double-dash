import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import config from '../config';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    console.log('Attempting login with email:', email);

    try {
      const response = await axios.post(`${config.API_BASE_URL}/login`, { email, password });
      console.log('Login successful, response:', response.data);
      const { token } = response.data;
      // Store JWT in localStorage
      localStorage.setItem('jwt', token);
      console.log('JWT stored in localStorage:', token);
      // Redirect to home
      navigate('/');
      console.log('Navigating to home page');
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid credentials, please try again.');
      console.log('Error message set in state:', 'Invalid credentials, please try again.');
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
              console.log('Email input changed:', e.target.value);
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
              console.log('Password input changed:', e.target.value);
            }}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
