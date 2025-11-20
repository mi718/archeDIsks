import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AppBar } from '@/components/layout/AppBar'
import { Sidebar } from '@/components/layout/Sidebar'
import { DiscListView } from '@/views/DiscListView'
import { DiscView } from '@/views/DiscView'
import { NotFoundView } from '@/views/NotFoundView'
import LoginPage from '@/views/LoginPage'
import { useDiscStore } from '@/stores/disc-store'
import { useUIStore } from '@/stores/ui-store'

function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const { loadDiscs } = useDiscStore()
  const { theme } = useUIStore()
  const location = useLocation();
  const isLoginPage = location.pathname === '/';
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  useEffect(() => {
    // Load discs on app start
    loadDiscs()
  }, [loadDiscs])

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {!isLoginPage && (
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />
      )}

      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${!isLoginPage && isSidebarOpen ? 'lg:ml-64' : ''}`}
      >
        {!isLoginPage && (
          <AppBar 
            onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            isMenuOpen={isSidebarOpen}
          />
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-scroll overflow-x-hidden">
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/disc-list" element={<DiscListView />} />
            <Route path="/disc/new" element={<DiscView />} />
            <Route path="/disc/:id" element={<DiscView />} />
            <Route path="*" element={<NotFoundView />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
