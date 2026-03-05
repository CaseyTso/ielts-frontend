import { Outlet, useLocation } from 'react-router-dom';
import NavBar from './NavBar';

export default function Layout() {
  const location = useLocation();
  const hideNav = location.pathname.startsWith('/practice/') || location.pathname === '/result';

  return (
    <div className="flex flex-col min-h-[100dvh] bg-surface">
      <main className="flex-1 pb-20 max-w-lg mx-auto w-full">
        <Outlet />
      </main>
      {!hideNav && <NavBar />}
    </div>
  );
}
