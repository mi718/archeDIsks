import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AppBar } from '@/components/layout/AppBar'
import { Sidebar } from '@/components/layout/Sidebar'
import { DiscListView } from '@/views/DiscListView'
import { DiscView } from '@/views/DiscView'
import { NotFoundView } from '@/views/NotFoundView'
import LandingPage from '@/views/LandingPage'
import LoginPage from '@/views/LoginPage'
import PricingPage from '@/views/PricingPage'
import { ProfilePage } from '@/views/ProfilePage'
import { ToastContainer } from '@/components/ui/ToastContainer'
import { useDiscStore } from '@/stores/disc-store'
import { useAuthStore } from '@/stores/auth-store'

function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const { loadDiscs } = useDiscStore()
  const { isLoggedIn } = useAuthStore()
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const isFullPage = isLandingPage || location.pathname === '/login' || location.pathname === '/pricing';

  const navigate = useNavigate();

  useEffect(() => {
    // Load discs on app start
    loadDiscs()
  }, [loadDiscs])

  useEffect(() => {
    if (!isLoggedIn && location.pathname !== '/' && location.pathname !== '/login' && location.pathname !== '/pricing') {
      navigate('/login', { replace: true });
    }
  }, [isLoggedIn, navigate, location.pathname]);

  return (
    <div className={`flex h-screen overflow-hidden ${isLandingPage ? 'bg-white' : (isFullPage ? 'bg-gray-50 dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-900')}`}>
      <ToastContainer />
      {!isFullPage && (
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />
      )}

      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${!isLandingPage ? 'dark:bg-gray-900' : ''} ${!isFullPage && isSidebarOpen ? 'lg:ml-64' : ''}`}
      >
        {!isFullPage && (
          <AppBar 
            onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            isMenuOpen={isSidebarOpen}
          />
        )}

        {/* Page content */}
        <main className={`flex-1 overflow-y-auto overflow-x-hidden ${!isLandingPage ? 'dark:bg-gray-900' : ''}`}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/disc-list" element={<DiscListView />} />
            <Route path="/disc/new" element={<DiscView />} />
            <Route path="/disc/:id" element={<DiscView />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<NotFoundView />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router basename="/orbitaldisk">
      <AppContent />
    </Router>
  )
}

export default App
