import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContent";

const ProtectedRoute = ({ requiredRole }) => {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) return <div>Loading...</div>;
    
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    
    if (requiredRole && user?.role !== requiredRole) {
        // Redirection handled intelligently by Home
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
