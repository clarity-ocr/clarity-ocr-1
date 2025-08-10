// src/components/ProtectedRoute.tsx
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  user?: any;  // 添加可选的user属性
  loading?: boolean;  // 添加可选的loading属性
}

export function ProtectedRoute({ children, user, loading }: ProtectedRouteProps) {
  // 如果外部传入了user和loading，使用它们；否则使用useAuthState获取的状态
  const [authUser, authLoading] = useAuthState(auth);
  const currentUser = user !== undefined ? user : authUser;
  const currentLoading = loading !== undefined ? loading : authLoading;
  
  if (currentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

export default ProtectedRoute;