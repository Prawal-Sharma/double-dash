import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import EnhancedDashboard from './components/EnhancedDashboard';
import Activities from './components/Activities';
import AnalyticsV2 from './components/AnalyticsV2';
import StravaAuthFailure from './components/StravaAuthFailure';
import StravaCallback from './components/StravaCallback';
import Login from './components/Login';
import Register from './components/Register';
import { ActivitiesProvider } from './contexts/ActivitiesContext';
import { ThemeProvider } from './contexts/ThemeContext';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ActivitiesProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<EnhancedDashboard />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/analytics" element={<AnalyticsV2 />} />
            <Route path="/auth-failure" element={<StravaAuthFailure />} />
            <Route path="/strava-callback" element={<StravaCallback />} />
            <Route path="/exchange_token" element={<EnhancedDashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </Router>
      </ActivitiesProvider>
    </ThemeProvider>
  );
}

export default App;
