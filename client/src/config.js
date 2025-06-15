// This file tells your React app where your backend server lives
const config = {
    API_BASE_URL: process.env.NODE_ENV === 'production' 
      ? 'https://api.doubledash.ai'  // When deployed to AWS
      : 'http://localhost:3001',     // When running locally
    
    FRONTEND_URL: process.env.NODE_ENV === 'production'
      ? 'https://doubledash.ai'      // Your domain
      : 'http://localhost:3000'      // Local development
  };
  
  export default config; 