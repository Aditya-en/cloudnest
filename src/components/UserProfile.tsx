import { useState, useEffect } from 'react';
import { UserProfile as ClerkUserProfile} from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import NavBar from './NavBar';

const UserProfile = () => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme) {
        return storedTheme;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });
  
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <NavBar toggleTheme={toggleTheme} theme={theme} />
      <div className="max-w-4xl mx-auto pt-20 p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
              Manage your account settings and preferences
            </p>
          </div>
          <Link 
            to="/dashboard" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg mt-4 md:mt-0"
          >
            Back to Files
          </Link>
        </div>
        
        <div className={`rounded-lg shadow-md ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6`}>
          <ClerkUserProfile 
            appearance={{
              elements: {
                rootBox: {
                  boxShadow: 'none',
                  width: '100%'
                },
                card: {
                  border: 'none',
                  boxShadow: 'none',
                  backgroundColor: 'transparent'
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default UserProfile;