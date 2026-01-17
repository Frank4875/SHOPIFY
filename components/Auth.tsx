
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface AuthProps {
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}

const Auth: React.FC<AuthProps> = ({ isDarkMode, toggleTheme }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage('Registration successful! Please check your email to confirm your account.');
      }
    }
    setLoading(false);
  };

  return (
    <main className="flex items-center justify-center h-screen w-screen bg-gradient-to-br from-gray-100 to-white dark:from-gray-900 dark:to-gray-800 font-sans text-gray-900 dark:text-white transition-colors duration-300">
      <div className="absolute top-4 right-4">
          <button onClick={toggleTheme} className="p-2 rounded-full bg-white dark:bg-gray-700 shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            {isDarkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" /></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
      </div>
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 bg-opacity-90 dark:bg-opacity-50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
          </svg>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Shopify Stock Official
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>
        
        <div className="flex justify-center border-b border-gray-200 dark:border-gray-600">
            <button onClick={() => setIsLogin(true)} className={`px-4 py-2 text-sm font-medium transition-colors ${isLogin ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400' : 'text-gray-400'}`}>Sign In</button>
            <button onClick={() => setIsLogin(false)} className={`px-4 py-2 text-sm font-medium transition-colors ${!isLogin ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400' : 'text-gray-400'}`}>Sign Up</button>
        </div>

        <form className="space-y-6" onSubmit={handleAuth}>
          <div>
            <label className="text-sm font-bold text-gray-600 dark:text-gray-400 block mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-600 dark:text-gray-400 block mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-500 rounded-lg text-white font-semibold transition-colors disabled:bg-green-800 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
          {message && <p className="text-center text-sm text-red-500 dark:text-red-400 mt-4">{message}</p>}
        </form>
      </div>
    </main>
  );
};

export default Auth;
