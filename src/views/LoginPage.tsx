import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Pastraphic from '@/assets/Pastraphic.png';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    const validEmail = 'arche.winti@gmail.com';
    const validPassword = 'godisgreat';

    if (email === validEmail && password === validPassword) {
      navigate('/disc-list'); // Redirect to the next page
      localStorage.setItem('isLoggedIn', 'true');
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative bg-white bg-opacity-20 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white border-opacity-30">
        {/* Decorative elements */}
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-white bg-opacity-10 rounded-2xl blur-xl"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white bg-opacity-10 rounded-2xl blur-xl"></div>
        
        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <img src={Pastraphic} alt="ArcheDIsks Logo" className="h-24 w-auto" />
          </div>
          <h1 className="text-3xl font-bold mb-6 text-center text-black">Login</h1>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">Username</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="mt-1 block w-full px-4 py-2 bg-white bg-opacity-20 border border-black border-opacity-30 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-black placeholder-black placeholder-opacity-70"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="mt-1 block w-full px-4 py-2 bg-white bg-opacity-20 border border-black border-opacity-30 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-black placeholder-black placeholder-opacity-70"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-black border-opacity-30 text-black focus:ring-black"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-black">
                Remember me
              </label>
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button
              onClick={handleLogin}
              className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;