import { Navigate } from 'react-router-dom';
import { canAccess } from '../lib/permissions';

export default function RequireRole({ module, children }) {
  if (!canAccess(module, 'read')) {
    const fallback = canAccess('portal', 'read') ? '/portal' : '/';
    return <Navigate to={fallback} replace />;
  }
  return children;
}
