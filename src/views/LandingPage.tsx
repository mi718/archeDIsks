import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers, 
  Download, 
  Database,
  ShieldCheck, 
  Clock, 
  History,
  FileText,
  MousePointer2,
  Share2,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Menu,
  X
} from 'lucide-react';
import Pastraphic from '@/assets/Pastraphic.svg';
import Pasted4 from '@/assets/Pasted4.png';
import Pasted5 from '@/assets/Pasted5.png';
import Pasted6 from '@/assets/Pasted6.png';
import ringCloseExample from '@/assets/ringCloseExample.png';

import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = React.useState(false);

  const slides = [
    {
      image: Pasted4,
      title: "Interactive Planning Workspace",
      description: "Manage multiple time rings, events, and concurrent schedules in real-time."
    },
    {
      image: Pasted5,
      title: "Event Detail Panel",
      description: "Visualizing schedule details and cross-references between different timelines."
    },
    {
      image: Pasted6,
      title: "Timeline Visualization",
      description: "Analyze and present your plans with high-resolution circular timelines."
    }
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleStart = () => {
    if (isLoggedIn) {
      navigate('/pricing');
    } else {
      navigate('/login');
    }
  };

  const PricingModal = () => (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isPricingModalOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setIsPricingModalOpen(false)}
      ></div>
      <div className={`relative w-full max-w-4xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl overflow-hidden`}>
        <div className="p-8 md:p-12">
          <div className="flex justify-between items-center mb-10">
            <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Simple, Transparent Pricing</h2>
            <button 
              onClick={() => setIsPricingModalOpen(false)}
              className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Monthly */}
            <div className={`p-8 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} flex flex-col`}>
              <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Monthly</h3>
              <div className="mb-6">
                <span className={`text-4xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>$5</span>
                <span className="text-gray-500 ml-1">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center text-sm text-gray-500">
                  <ShieldCheck className="h-4 w-4 text-blue-500 mr-2" />
                  Unlimited Discs
                </li>
                <li className="flex items-center text-sm text-gray-500">
                  <ShieldCheck className="h-4 w-4 text-blue-500 mr-2" />
                  All Features Included
                </li>
                <li className="flex items-center text-sm text-gray-500">
                  <ShieldCheck className="h-4 w-4 text-blue-500 mr-2" />
                  Priority Support
                </li>
              </ul>
              <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all">
                Select Plan
              </button>
            </div>

            {/* Yearly */}
            <div className={`p-8 rounded-2xl border-2 border-blue-600 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} flex flex-col relative scale-105 shadow-xl`}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Most Popular
              </div>
              <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Yearly</h3>
              <div className="mb-6">
                <span className={`text-4xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>$45</span>
                <span className="text-gray-500 ml-1">/yr</span>
                <div className="text-xs text-blue-600 font-bold mt-1">Save 25% per year</div>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center text-sm text-gray-500">
                  <ShieldCheck className="h-4 w-4 text-blue-500 mr-2" />
                  Everything in Monthly
                </li>
                <li className="flex items-center text-sm text-gray-500">
                  <ShieldCheck className="h-4 w-4 text-blue-500 mr-2" />
                  2 Months Free
                </li>
                <li className="flex items-center text-sm text-gray-500">
                  <ShieldCheck className="h-4 w-4 text-blue-500 mr-2" />
                  Early Beta Access
                </li>
              </ul>
              <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all">
                Select Plan
              </button>
            </div>

            {/* Lifetime */}
            <div className={`p-8 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} flex flex-col`}>
              <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Lifetime</h3>
              <div className="mb-6">
                <span className={`text-4xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>$75</span>
                <span className="text-gray-500 ml-1">once</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center text-sm text-gray-500">
                  <ShieldCheck className="h-4 w-4 text-blue-500 mr-2" />
                  One-time Payment
                </li>
                <li className="flex items-center text-sm text-gray-500">
                  <ShieldCheck className="h-4 w-4 text-blue-500 mr-2" />
                  Lifetime Updates
                </li>
                <li className="flex items-center text-sm text-gray-500">
                  <ShieldCheck className="h-4 w-4 text-blue-500 mr-2" />
                  VIP Support
                </li>
              </ul>
              <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all">
                Select Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} flex flex-col transition-colors duration-300`}>
      <PricingModal />
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 ${theme === 'dark' ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-100'} backdrop-blur-md border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center -space-x-0">
              <img src={Pastraphic} alt="MyDisk Logo" className="h-28 w-28" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                OrbitalDisk
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => setIsPricingModalOpen(true)}
                className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} hover:text-blue-600 font-medium transition-colors`}
              >
                Pricing
              </button>
              <button
                onClick={handleStart}
                className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} hover:text-blue-600 font-bold transition-colors`}
              >
                Sign In
              </button>
              <button
                onClick={handleStart}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-semibold"
              >
                Get Started
              </button>
              <button
                onClick={toggleTheme}
                className={`p-2.5 ${theme === 'dark' ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'} hover:text-blue-600 rounded-full transition-all`}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center space-x-2">
              <button
                onClick={toggleTheme}
                className={`p-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} hover:text-blue-600 rounded-full transition-all`}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} hover:text-blue-600 rounded-full transition-all`}
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Overlay */}
        <div className={`md:hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-64 opacity-100 border-b' : 'max-h-0 opacity-0 overflow-hidden'} ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
          <div className="px-4 pt-2 pb-6 space-y-2">
            <button
              onClick={() => {
                setIsPricingModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-3 rounded-xl text-base font-medium ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50'} transition-colors`}
            >
              Pricing
            </button>
            <button
              onClick={() => {
                handleStart();
                setIsMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-3 rounded-xl text-base font-bold ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-50'} transition-colors`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                handleStart();
                setIsMobileMenuOpen(false);
              }}
              className="block w-full px-4 py-4 bg-blue-600 text-white rounded-xl text-center font-bold shadow-lg mt-4"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className={`text-5xl md:text-7xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} tracking-tight mb-8`}>
            Plan Your Time in <br />
            <span className="text-blue-600">Perfect Circles</span>
          </h1>
          <p className={`text-xl md:text-2xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-12 max-w-3xl mx-auto leading-relaxed`}>
            The professional standard to plan your year, month, or quarter. See simultaneous events at a glance and keep a perfectly structured timeline.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button
              onClick={handleStart}
              className="w-full sm:w-auto px-10 py-4 bg-blue-600 text-white rounded-2xl text-lg font-bold hover:bg-blue-700 transition-all shadow-xl hover:-translate-y-1"
            >
              Create Your First Disc
            </button>
            <a href="#features" className="text-gray-600 font-semibold flex items-center hover:text-blue-600 transition-colors">
              Explore features <span className="ml-2">↓</span>
            </a>
          </div>

          {/* Interactive Image Carousel */}
          <div className="mt-10 md:mt-20 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
              <div className="aspect-[16/9] bg-gray-50 relative overflow-hidden">
                {slides.map((slide, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                      index === currentSlide ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-8 text-left">
                      <p className="text-white font-bold text-xl">{slide.title}</p>
                      <p className="text-gray-200 text-sm mt-2 max-w-lg">{slide.description}</p>
                    </div>
                  </div>
                ))}

                {/* Navigation Arrows */}
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100"
                  aria-label="Next slide"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>

                {/* Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentSlide ? 'bg-white w-4' : 'bg-white/50'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" className={`py-24 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className={`text-3xl md:text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>Powerful Features for Structured Planning</h2>
            <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto`}>Everything you need to transform your messy schedule into a clear, publication-ready plan.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'} p-8 rounded-3xl shadow-sm border hover:shadow-md transition-shadow`}>
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <Layers className="h-8 w-8" />
              </div>
              <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Multi-Layer Timelines</h3>
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
                Visualize hierarchical or temporal schedules using nested rings. Perfect for representing years, months, and days in a single, cohesive view.
              </p>
            </div>

            {/* Feature 2 */}
            <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'} p-8 rounded-3xl shadow-sm border hover:shadow-md transition-shadow`}>
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <MousePointer2 className="h-8 w-8" />
              </div>
              <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Interactive Events</h3>
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
                Add rich details to every segment of your plan. Attach event notes, exact times, and descriptions that are easily accessible via interactive tooltips and sidebars.
              </p>
            </div>

            {/* Feature 3 */}
            <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'} p-8 rounded-3xl shadow-sm border hover:shadow-md transition-shadow`}>
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                <Download className="h-8 w-8" />
              </div>
              <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Pro-Grade Export</h3>
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
                Need it for a presentation? Export your plans as high-resolution PNGs, vector-based PDFs, or raw JSON data for further integration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why OrbitalDisk? (Use Cases) */}
      <section className={`py-24 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <h2 className={`text-3xl md:text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-6`}>What is it good for?</h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="mt-1 bg-green-100 p-2 rounded-lg">
                    <Clock className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Annual Roadmaps</h4>
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Represent major milestones across the year. See how quarterly goals overlap and align in an intuitive radial timeline.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="mt-1 bg-orange-100 p-2 rounded-lg">
                    <Database className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Simultaneous Event Tracking</h4>
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Quickly identify overlapping events and resource bottlenecks across different project streams or personal schedules.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="mt-1 bg-blue-100 p-2 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Structured Time Blocking</h4>
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Create beautiful, clear schedule diagrams that provide a more comprehensive view of your time than traditional linear calendars.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Detailed View */}
            <div className="lg:w-1/2 w-full flex justify-center mx-auto">
              <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-900'} rounded-3xl p-1 shadow-2xl relative group overflow-hidden max-w-[500px]`}>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <div className={`relative aspect-square ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-800'} rounded-2xl overflow-hidden flex flex-col`}>
                  <img 
                    src={ringCloseExample}
                    alt="Event Detail Panel" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-transparent flex flex-col justify-start p-8 text-left">
                    <p className="text-white font-bold text-xl">Event Detail Panel</p>
                    <p className="text-gray-200 text-sm mt-2">Visualizing schedule details and cross-references between different timelines.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Features List */}
      <section className={`py-24 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <History className="h-10 w-10 text-blue-500 mb-4" />
              <h4 className={`font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>History & Undo</h4>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Full undo/redo support for your complex design workflows.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <ShieldCheck className="h-10 w-10 text-blue-500 mb-4" />
              <h4 className={`font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Local Storage</h4>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Your data stays in your browser. Private and secure by default.</p>
            </div>
            <div className="flex flex-col items-center text-center md:col-span-2 lg:col-span-1">
              <Share2 className="h-10 w-10 text-blue-500 mb-4" />
              <h4 className={`font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Team Collaboration</h4>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Share folders with discs to friends or teammates to create, edit and see disc together in real-time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-blue-600 relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white opacity-10 rounded-full"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-8">Ready to visualize your plans?</h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
            Join others using OrbitalDisk to bring their schedules to life. Free to use, no credit card required.
          </p>
          <button
            onClick={handleStart}
            className="px-12 py-5 bg-white text-blue-600 rounded-2xl text-xl font-bold hover:bg-gray-100 transition-all shadow-2xl hover:scale-105"
          >
            Get Started Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-t border-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center -space-x--1 mb-8 md:mb-0">
              <img src={Pastraphic} alt="MyDisk Logo" className="h-20 w-30" />
              <span className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>OrbitalDisk</span>
            </div>
            <div className={`flex space-x-8 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              <p>© {new Date().getFullYear()} OrbitalDisk.</p>
              <a href="#" className="hover:text-blue-600">Privacy Policy</a>
              <a href="#" className="hover:text-blue-600">Terms of Service</a>
              <a href="mailto:arche.winti@gmail.com" className="hover:text-blue-600">Contact Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
