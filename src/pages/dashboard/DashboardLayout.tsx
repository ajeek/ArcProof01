import { Outlet } from 'react-router-dom';

export function DashboardLayout() {
  return (
    <div className="w-full">
      <Outlet />
    </div>
  );
}
