import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const Auth: React.FC = () => {
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
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage('Registration successful! Please check your email to confirm your account.');
      }
    }
    setLoading(false);
  };

  return (
    <main className="flex items-center justify-center h-screen w-screen bg-gradient-to-br from-gray-900 to-gray-800 font-sans text-white">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
          </svg>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Shopify Stock Official
          </h1>
          <p className="mt-2 text-gray-400">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>
        
        <div className="flex justify-center border-b border-gray-600">
            <button onClick={() => setIsLogin(true)} className={`px-4 py-2 text-sm font-medium ${isLogin ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400'}`}>Sign In</button>
            <button onClick={() => setIsLogin(false)} className={`px-4 py-2 text-sm font-medium ${!isLogin ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400'}`}>Sign Up</button>
        </div>

        <form className="space-y-6" onSubmit={handleAuth}>
          <div>
            <label className="text-sm font-bold text-gray-400 block mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-400 block mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
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
          {message && <p className="text-center text-sm text-red-400 mt-4">{message}</p>}
        </form>
      </div>
    </main>
  );
};

export default Auth;
