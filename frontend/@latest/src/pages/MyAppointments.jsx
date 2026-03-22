import { useState, useEffect } from "react";
import { getMyByPatientId, cancelAppointment } from "../api/appointmentApi";
import { useAuth } from "../context/AuthContent";
import toast from "react-hot-toast";

const MyAppointments = () => {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) fetchAppointments();
    }, [user]);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const data = await getMyByPatientId(user.id);
            setAppointments(data);
        } catch (error) {
            toast.error("Failed to load appointments");
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (time) => {
        if (!time) return "--:--";
        if (Array.isArray(time)) {
            const h = time[0].toString().padStart(2, '0');
            const m = time[1].toString().padStart(2, '0');
            return `${h}:${m}`;
        }
        if (typeof time === 'string') return time.substring(0, 5);
        return time;
    };

    const formatDate = (date) => {
        if (!date) return "";
        if (Array.isArray(date)) {
            return `${date[0]}-${date[1].toString().padStart(2, '0')}-${date[2].toString().padStart(2, '0')}`;
        }
        return date;
    };

    const handleCancel = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
        
        try {
            await cancelAppointment(id);
            toast.success("Appointment cancelled");
            fetchAppointments(); // Refresh list
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to cancel appointment");
        }
    };

    if (loading) return <div className="loading">Loading your appointments...</div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>My Appointments</h1>
            </div>

            <div className="appointment-list">
                {appointments.length > 0 ? (
                    appointments.map(app => (
                        <div key={app.id} className={`appointment-card status-${app.status.toLowerCase()}`}>
                            <div className="appointment-main">
                                <div className="appointment-details">
                                    <p><strong>Doctor:</strong> {app.doctorName || `(ID: ${app.doctorId})`}</p>
                                    <p><strong>Date:</strong> {formatDate(app.slotDate)}</p>
                                    <p><strong>Time:</strong> {formatTime(app.startTime)} - {formatTime(app.endTime)}</p>
                                    <p><strong>Mode:</strong> {app.mode}</p>
                                    <p><strong>Fee:</strong> ₹{app.price}</p>
                                </div>
                            </div>
                            <div className="appointment-status-section">
                                <span className={`status-badge ${app.status.toLowerCase()}`}>{app.status}</span>
                                {app.status === 'BOOKED' && (
                                    <button 
                                        className="cancel-btn" 
                                        onClick={() => handleCancel(app.id)}
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-results">
                        <p>No appointments found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyAppointments;