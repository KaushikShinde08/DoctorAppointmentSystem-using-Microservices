import { useState, useEffect } from "react";
import { getAllAppointments, updateAppointmentStatus } from "../api/appointmentApi";
import toast from "react-hot-toast";

const AdminAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const data = await getAllAppointments();
            setAppointments(data);
        } catch (error) {
            toast.error("Failed to load all appointments");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        if (!window.confirm(`Are you sure you want to mark this appointment as ${newStatus}?`)) return;

        try {
            await updateAppointmentStatus(id, newStatus);
            toast.success(`Appointment marked as ${newStatus}`);
            fetchAppointments(); // Refresh list
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update status");
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

    if (loading) return <div className="loading">Loading system appointments...</div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Manage Appointments (Admin)</h1>
            </div>

            <div className="appointment-list">
                {appointments.length > 0 ? (
                    appointments.map(app => (
                        <div key={app.id} className={`appointment-card status-${app.status?.toLowerCase()}`}>
                            <div className="appointment-main">
                                <div className="appointment-details">
                                    <p><strong>Patient ID:</strong> {app.patientId}</p>
                                    <p><strong>Doctor:</strong> {app.doctorName || `(ID: ${app.doctorId})`}</p>
                                    <p><strong>Date:</strong> {formatDate(app.slotDate)}</p>
                                    <p><strong>Time:</strong> {formatTime(app.startTime)} - {formatTime(app.endTime)}</p>
                                    <p><strong>Mode:</strong> {app.mode}</p>
                                    <p><strong>Fee:</strong> ₹{app.price}</p>
                                </div>
                            </div>
                            <div className="appointment-status-section">
                                <span className={`status-badge ${app.status?.toLowerCase()}`}>{app.status}</span>
                                
                                {app.status === 'BOOKED' ? (
                                    <div className="admin-actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <button 
                                            className="book-btn" 
                                            style={{backgroundColor: '#059669', width: 'auto'}}
                                            onClick={() => handleStatusUpdate(app.id, 'COMPLETED')}
                                        >
                                            Complete
                                        </button>
                                        <button 
                                            className="cancel-btn" 
                                            style={{margin: 0}}
                                            onClick={() => handleStatusUpdate(app.id, 'CANCELLED')}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            className="btn" 
                                            style={{backgroundColor: '#475569', color: 'white', width: 'auto', padding: '0.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer'}}
                                            onClick={() => handleStatusUpdate(app.id, 'NO_SHOW')}
                                        >
                                            No Show
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-results">
                        <p>No appointments found in the system.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminAppointments;
