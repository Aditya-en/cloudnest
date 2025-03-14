import React, { useState, useEffect } from 'react';
import { SignInButton, useAuth } from '@clerk/clerk-react';
import { Link, useNavigate } from 'react-router-dom';
import NavBar from './NavBar';

const PricingPage = () => {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
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

  const plans = [
    {
      name: "Free",
      price: "$0",
      storage: "5GB",
      features: ["Basic file storage", "Web access", "Mobile access", "24/7 support"]
    },
    {
      name: "Standard",
      price: "$5.99",
      storage: "100GB",
      features: ["Everything in Free", "File versioning", "Advanced sharing", "Priority support"]
    },
    {
      name: "Premium",
      price: "$12.99",
      storage: "500GB",
      features: ["Everything in Standard", "Advanced security", "Team collaboration", "API access"]
    }
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <NavBar toggleTheme={toggleTheme} theme={theme} />
      <div className="max-w-7xl mx-auto pt-20 px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className={`text-xl max-w-3xl mx-auto ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            We offer flexible plans to meet your needs. Pay only for what you use.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`p-6 rounded-lg shadow-md ${
                plan.name === "Standard" 
                  ? 'border-2 border-blue-500 ' + (theme === 'dark' ? 'bg-gray-700' : 'bg-white')
                  : theme === 'dark' ? 'bg-gray-700' : 'bg-white'
              }`}
            >
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>/month</span>
              </div>
              <p className="text-lg mb-4">
                <span className="font-bold text-blue-500">{plan.storage}</span> storage
              </p>
              <ul className="mb-8 space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              {isSignedIn ? (
                <Link 
                  to="/dashboard" 
                  className={`block w-full text-center py-2 rounded-lg ${
                    plan.name === "Standard"
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : theme === 'dark' 
                        ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  Select Plan
                </Link>
              ) : (
                <SignInButton mode="modal">
                  <button className={`w-full py-2 rounded-lg ${
                    plan.name === "Standard"
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : theme === 'dark' 
                        ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}>
                    Get Started
                  </button>
                </SignInButton>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Need a custom plan?</h2>
          <p className={`mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            We offer tailored solutions for businesses with specific needs.
          </p>
          <Link 
            to="/contact" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            Contact Sales
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;