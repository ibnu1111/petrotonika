'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Login attempt with credentials:', { username: credentials.username });
      const success = await login(credentials.username, credentials.password);
      
      console.log('Login result:', success);
      
      if (success) {
        console.log('Login successful, redirecting to dashboard');
        router.push('/dashboard');
      } else {
        console.log('Login failed: success = false');
        setError('Username atau password salah');
      }
    } catch (error: unknown) {
      console.error('Login error in component:', error);
      setError('Terjadi kesalahan saat login. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <span className="text-2xl">🏭</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            PT Petronika
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Inventory Management System
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <Input
              label="Username"
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleInputChange}
              placeholder="Masukkan username"
              required
              className="relative block w-full"
            />
            
            <Input
              label="Password"
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              placeholder="Masukkan password"
              required
              className="relative block w-full"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <Button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Logging in...
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Demo Accounts:
            </p>
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              <div>Admin: admin / admin123</div>
              <div>User: user / user123</div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
