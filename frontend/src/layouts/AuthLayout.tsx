// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-success/5 to-primary/5 flex items-center justify-center p-4">
      <Outlet />
    </div>
  );
}
