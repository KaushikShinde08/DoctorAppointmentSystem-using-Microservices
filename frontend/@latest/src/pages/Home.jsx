import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContent";

const Home = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, loading } = useAuth(); // ADDED

    useEffect(() => {
        if (!loading) {
            if (isAuthenticated) {
                if (user?.role === 'ADMIN') {
                    navigate("/admin/appointments");
                } else {
                    navigate("/doctors");
                }
            } else {
                navigate("/login");
            }
        }
    }, [isAuthenticated, loading, navigate, user]);

    return (
        <div className="loading-screen">
            <p>Redirecting...</p>
        </div>
    );
};

export default Home;