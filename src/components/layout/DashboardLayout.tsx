import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  UploadCloud, 
  History, 
  LogOut, 
  Menu, 
  X,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/firebase';
import { signOut } from 'firebase/auth';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  path: string;
  isActive: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, path, isActive, onClick }) => (
  <Link 
    to={path} 
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
      isActive 
        ? 'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300 font-semibold shadow-sm' 
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
    }`}
  >
    <Icon className={`w-5 h-5 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
    <span>{label}</span>
    {isActive && <ChevronRight className="w-4 h-4 ml-auto text-sky-500" />}
  </Link>
);

export default function DashboardLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Documents', path: '/documents' },
    { icon: UploadCloud, label: 'Upload New', path: '/upload' },
    { icon: History, label: 'History', path: '/history' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-[#111625] border-r border-slate-200 dark:border-slate-800 h-screen sticky top-0">
        <div className="p-6">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
               <img src="/icon.png" alt="Logo" className="w-5 h-5 invert brightness-0" />
            </div>
            <span className="font-bold text-xl font-sora text-slate-900 dark:text-white tracking-tight">Clarity OCR</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <NavItem 
              key={item.path} 
              {...item} 
              isActive={location.pathname.startsWith(item.path)} 
            />
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
           <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                 <Avatar className="h-9 w-9 border border-slate-200 dark:border-slate-700">
                    <AvatarImage src={user?.photoURL || ''} />
                    <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                 </Avatar>
                 <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.displayName || 'User'}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                 </div>
              </div>
              <Button variant="ghost" size="sm" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 h-8" onClick={handleLogout}>
                 <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </Button>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white dark:bg-[#111625] border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between sticky top-0 z-30">
           <Link to="/dashboard" className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
                <span className="font-bold text-white">C</span>
             </div>
             <span className="font-bold text-lg text-slate-900 dark:text-white">Clarity</span>
           </Link>
           <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
             {isMobileMenuOpen ? <X /> : <Menu />}
           </Button>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
           <div className="lg:hidden fixed inset-0 z-20 bg-white dark:bg-[#111625] pt-20 px-4 space-y-2">
              {navItems.map((item) => (
                <NavItem 
                  key={item.path} 
                  {...item} 
                  isActive={location.pathname.startsWith(item.path)} 
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              ))}
              <div className="pt-8 mt-8 border-t border-slate-100 dark:border-slate-800">
                 <Button variant="destructive" className="w-full" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                 </Button>
              </div>
           </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
           <Outlet />
        </main>
      </div>
    </div>
  );
}