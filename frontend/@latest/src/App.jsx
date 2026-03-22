import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContent";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Doctors from "./pages/Doctors";
import DoctorDetails from "./pages/DoctorDetails";
import MyAppointments from "./pages/MyAppointments";
import AdminAppointments from "./pages/AdminAppointments";

import "./App.css";

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Toaster position="top-right" />
                <Navbar />
                <div className="main-content">
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* Patient Routes */}
                        <Route element={<ProtectedRoute requiredRole="PATIENT" />}>
                            <Route path="/doctors" element={<Doctors />} />
                            <Route path="/doctors/:id" element={<DoctorDetails />} />
                            <Route path="/appointments" element={<MyAppointments />} />
                        </Route>

                        {/* Admin Routes */}
                        <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
                            <Route path="/admin/appointments" element={<AdminAppointments />} />
                        </Route>
                    </Routes>
                </div>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;