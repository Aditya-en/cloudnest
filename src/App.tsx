import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { useEffect, useState } from 'react';
import NavBar from "./components/NavBar";
import FileBrowser from "./components/FileBrowser";


export default function App() {
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
    // Apply theme to document
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
      <main className="p-6 max-w-7xl mx-auto">
        <SignedOut>
          <div className="text-center py-20">
            <h2 className={`text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Welcome to CloudNest
            </h2>
            <p className={`mb-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Secure cloud storage for all your files
            </p>
            <SignInButton mode="modal" />
          </div>
        </SignedOut>
        <SignedIn>
          <FileBrowser theme={theme} />
        </SignedIn>
      </main>
    </div>
  );
}



