import { Navigate, Outlet } from "react-router-dom";
import useStore from "../store";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const token = useStore((state) => state.token);
  const role = useStore((state) => state.role);

  // If there's no securely verified token, immediately redirect to /login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If roles are specified and the user's role isn't included, redirect
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    if (role === 'WORKER') {
       return <Navigate to="/kiosk" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
