import { NavLink } from 'react-router-dom';
import { Home, BookOpen, BarChart3, Settings } from 'lucide-react';

const tabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/questions', icon: BookOpen, label: 'Questions' },
  { to: '/progress', icon: BarChart3, label: 'Progress' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function NavBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-text-secondary hover:text-primary'
              }`
            }
          >
            <Icon size={22} />
            <span className="text-[11px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
