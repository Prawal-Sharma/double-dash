import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import EnhancedDashboard from './components/EnhancedDashboard';
import Activities from './components/Activities';
import Analytics from './components/Analytics';
import StravaAuthFailure from './components/StravaAuthFailure';
import Login from './components/Login';
import Register from './components/Register';

const App: React.FC = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<EnhancedDashboard />} />
        <Route path="/activities" element={<Activities />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/auth-failure" element={<StravaAuthFailure />} />
        <Route path="/exchange_token" element={<EnhancedDashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;
