import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import config from '../config';
import { AuthResponse, ApiError } from '../types';

const Register: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  // Get clientID from environment variable
  const clientID = process.env.REACT_APP_STRAVA_CLIENT_ID;
  
  if (!clientID) {
    console.error('REACT_APP_STRAVA_CLIENT_ID environment variable is not set');
  }
  
  const redirectURI = `${config.FRONTEND_URL}/exchange_token`;
  const scope = 'read,activity:read';
  const stravaAuthURL = `https://www.strava.com/oauth/authorize?client_id=${clientID}&response_type=code&redirect_uri=${redirectURI}&approval_prompt=force&scope=${scope}`;

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // First, register the user
      const registerResponse = await axios.post<AuthResponse>(`${config.API_BASE_URL}/api/auth/register`, { email, password });

      if (registerResponse.data.message === 'User registered successfully') {
        setSuccess('User registered! Connecting to Strava...');

        // Next, automatically login to get JWT
        const loginResponse = await axios.post<AuthResponse>(`${config.API_BASE_URL}/api/auth/login`, { email, password });
        const { token } = loginResponse.data;
        // Store JWT in localStorage
        localStorage.setItem('jwt', token);

        // Redirect them immediately to Strava's Auth page
        window.location.href = stravaAuthURL;
      }
    } catch (err: any) {
      setIsLoading(false);
      console.error('Register error:', err);
      
      // Handle specific error types
      if (err.response?.status === 400) {
        const errorData = err.response.data;
        
        // Handle validation errors
        if (errorData.code === 'VALIDATION_ERROR' && errorData.details) {
          const messages = errorData.details.map((detail: any) => detail.message).join(', ');
          setError(`Registration failed: ${messages}`);
        } else if (errorData.message) {
          setError(errorData.message);
        } else {
          setError('Invalid registration data. Please check your email and password.');
        }
      } else if (err.response?.status === 409) {
        setError('An account with this email already exists. Please use a different email or try logging in.');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Registration failed. Please try again.');
      }
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Register</h2>
      {error && <p style={{ color:'red' }}>{error}</p>}
      {success && <p style={{ color:'green' }}>{success}</p>}
      <form onSubmit={handleRegister} style={{ display:'inline-block', textAlign:'left' }}>
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
          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            Password must contain:
            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
              <li>At least 8 characters</li>
              <li>One uppercase letter</li>
              <li>One lowercase letter</li>
              <li>One number</li>
              <li>One special character (!@#$%^&*)</li>
            </ul>
          </div>
        </div>
        <button type="submit" disabled={isLoading} style={{ 
          padding: '10px 20px', 
          backgroundColor: isLoading ? '#ccc' : '#fc4c02',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: isLoading ? 'not-allowed' : 'pointer'
        }}>
          {isLoading ? 'Creating Account...' : 'Register & Connect Strava'}
        </button>
      </form>
    </div>
  );
};

export default Register;
