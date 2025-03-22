import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignInButton, useAuth } from "@clerk/clerk-react";
import { motion } from 'framer-motion';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    // Check for stored preference or system preference
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
  
  // Redirect to dashboard if already signed in
  useEffect(() => {
    if (isSignedIn) {
      navigate('/dashboard');
    }
  }, [isSignedIn, navigate]);

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

  const features = [
    {
      title: "Secure Storage",
      description: "All your files are encrypted and stored securely on AWS S3.",
      icon: "🔒"
    },
    {
      title: "Easy Access",
      description: "Access your files from anywhere, on any device.",
      icon: "🌐"
    },
    {
      title: "Folder Organization",
      description: "Keep your files organized with our intuitive folder system.",
      icon: "📁"
    },
    {
      title: "Fast Uploads",
      description: "Upload your files quickly with our optimized system.",
      icon: "⚡"
    }
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={`fixed w-full z-10 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-blue-500">CloudNest</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-yellow-300' : 'bg-gray-100 text-gray-700'}`}
              >
                {theme === 'dark' ? (
                <SunIcon className="w-5 h-5" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              )}
              </button>
              <SignInButton mode="modal">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                  Sign In
                </button>
              </SignInButton>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="text-blue-500">Secure</span> Cloud Storage for Everyone
            </h1>
            <p className={`text-xl md:text-2xl max-w-3xl mx-auto mb-10 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Store, share, and access your files from anywhere. Affordable plans for everyone.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <SignInButton mode="modal">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg">
                  Get Started Free
                </button>
              </SignInButton>
              <a href="#pricing" className={`border border-blue-500 px-6 py-3 rounded-lg text-lg ${theme === 'dark' ? 'text-white' : 'text-blue-600'} hover:bg-blue-50 hover:text-blue-700`}>
                View Plans
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-20 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose CloudNest?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className={`p-6 rounded-lg shadow-md ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                className={`p-6 rounded-lg shadow-md ${
                  plan.name === "Standard" 
                    ? 'border-2 border-blue-500 ' + (theme === 'dark' ? 'bg-gray-700' : 'bg-white')
                    : theme === 'dark' ? 'bg-gray-700' : 'bg-white'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
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
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={`py-20 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "CloudNest has revolutionized how I store and access my files. The interface is intuitive and the prices are unbeatable.",
                author: "Sarah J.",
                role: "Small Business Owner"
              },
              {
                quote: "I've tried many cloud storage solutions, but CloudNest offers the best balance of features, security, and affordability.",
                author: "Michael T.",
                role: "Freelance Designer"
              },
              {
                quote: "The team collaboration features have made our workflow so much smoother. We can't imagine working without CloudNest now.",
                author: "Alex R.",
                role: "Project Manager"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className={`p-6 rounded-lg shadow-md ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <p className={`mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  "{testimonial.quote}"
                </p>
                <div>
                  <p className="font-bold">{testimonial.author}</p>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                    {testimonial.role}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to secure your files in the cloud?</h2>
            <p className={`text-xl max-w-3xl mx-auto mb-10 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Join thousands of satisfied users who trust CloudNest with their important data.
            </p>
            <SignInButton mode="modal">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg">
                Start Your Free Account
              </button>
            </SignInButton>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-blue-500 mb-4">CloudNest</h3>
              <p>Secure, affordable cloud storage for everyone.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-blue-500">Features</a></li>
                <li><a href="#pricing" className="hover:text-blue-500">Pricing</a></li>
                <li><a href="#" className="hover:text-blue-500">Security</a></li>
                <li><a href="#" className="hover:text-blue-500">Enterprise</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-blue-500">Blog</a></li>
                <li><a href="#" className="hover:text-blue-500">Documentation</a></li>
                <li><a href="#" className="hover:text-blue-500">FAQ</a></li>
                <li><a href="#" className="hover:text-blue-500">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-blue-500">About</a></li>
                <li><a href="#" className="hover:text-blue-500">Contact</a></li>
                <li><a href="#" className="hover:text-blue-500">About</a></li>
                <li><a href="#" className="hover:text-blue-500">Contact</a></li>
                <li><a href="#" className="hover:text-blue-500">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-blue-500">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center">
            <p>&copy; {new Date().getFullYear()} CloudNest. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}