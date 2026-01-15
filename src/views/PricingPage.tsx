import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck} from 'lucide-react';
import backgroundRing from '@/assets/backgroundring.png';
import { useUIStore } from '@/stores/ui-store';

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useUIStore();

  const handleSelectPlan = () => {
    navigate('/disc-list');
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} flex items-center justify-center p-4 transition-colors duration-300 relative overflow-hidden`}>
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 opacity-20 dark:opacity-10 pointer-events-none"
        style={{
          backgroundImage: `url(${backgroundRing})`,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '150%',
        }}
      />
      
      <div className={`relative z-10 w-full max-w-5xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl overflow-hidden border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="p-8 md:p-12">
          <div className="text-center mb-12">
            <h2 className={`text-4xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>Simple, Transparent Pricing</h2>
            <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Choose the plan that's right for you and start planning in circles.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Monthly */}
            <div className={`p-8 rounded-3xl border ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} flex flex-col transition-all hover:shadow-lg`}>
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
                  Support
                </li>
              </ul>
              <button 
                onClick={handleSelectPlan}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95"
              >
                Select Plan
              </button>
            </div>

            {/* Yearly */}
            <div className={`p-8 rounded-3xl border-2 border-blue-600 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} flex flex-col relative scale-105 shadow-2xl z-10`}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
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
                  3 Months Free
                </li>
                <li className="flex items-center text-sm text-gray-500">
                  <ShieldCheck className="h-4 w-4 text-blue-500 mr-2" />
                  Early Beta Access
                </li>
              </ul>
              <button 
                onClick={handleSelectPlan}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95"
              >
                Select Plan
              </button>
            </div>

            {/* Lifetime */}
            <div className={`p-8 rounded-3xl border ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} flex flex-col transition-all hover:shadow-lg`}>
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
                  Priority Support
                </li>
              </ul>
              <button 
                onClick={handleSelectPlan}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95"
              >
                Select Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
