import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContent";
import toast from "react-hot-toast";

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        toast.success("Logged out successfully");
        navigate("/login");
    };

    return (
        <nav className="navbar">
            <div className="nav-brand">
                <Link to="/">Hospital Care</Link>
            </div>
            <div className="nav-links">
                {isAuthenticated ? (
                    <>
                        {user?.role === 'ADMIN' ? (
                            <Link to="/admin/appointments">Manage System</Link>
                        ) : (
                            <>
                                <Link to="/doctors">Find Doctors</Link>
                                <Link to="/appointments">My Appointments</Link>
                            </>
                        )}
                        <span className="user-email">{user?.email}</span>
                        <button onClick={handleLogout} className="logout-btn">Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login">Login</Link>
                        <Link to="/register">Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;