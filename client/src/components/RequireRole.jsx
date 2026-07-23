import { Navigate } from 'react-router-dom';
import { canAccess } from '../lib/permissions';

export default function RequireRole({ module, children }) {
  if (!canAccess(module, 'read')) {
    return <Navigate to="/" replace />;
  }
  return children;
}
