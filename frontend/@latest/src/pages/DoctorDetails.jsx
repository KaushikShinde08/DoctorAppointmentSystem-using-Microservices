import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDoctorById, getSlots } from "../api/doctorApi";
import { bookAppointment } from "../api/appointmentApi";
import toast from "react-hot-toast";

const DoctorDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [doctor, setDoctor] = useState(null);
    const [slots, setSlots] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);

    useEffect(() => {
        fetchDoctor();
    }, [id]);

    useEffect(() => {
        if (doctor) fetchSlots();
    }, [id, selectedDate, doctor]);

    const fetchDoctor = async () => {
        try {
            const data = await getDoctorById(id);
            setDoctor(data);
        } catch (error) {
            console.error("Failed to fetch doctor detail:", error);
            toast.error("Doctor profile not found");
            navigate("/doctors");
        } finally {
            setLoading(false);
        }
    };

    const fetchSlots = async () => {
        try {
            const data = await getSlots(id, selectedDate);
            console.log("Slots loaded:", data);
            setSlots(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch slots:", error);
            setSlots([]);
        }
    };

    const formatTime = (time) => {
        if (!time) return "--:--";
        if (Array.isArray(time)) {
            // Handle [HH, MM] array format
            const h = time[0].toString().padStart(2, '0');
            const m = time[1].toString().padStart(2, '0');
            return `${h}:${m}`;
        }
        if (typeof time === 'string') {
            return time.substring(0, 5);
        }
        return time;
    };

    const formatDate = (date) => {
        if (!date) return "";
        if (Array.isArray(date)) {
            // Handle [YYYY, MM, DD] array format
            const y = date[0];
            const m = date[1].toString().padStart(2, '0');
            const d = date[2].toString().padStart(2, '0');
            return `${y}-${m}-${d}`;
        }
        return date;
    };

    const handleBook = async (slotId) => {
        setBooking(true);
        try {
            await bookAppointment({
                doctorId: parseInt(id),
                slotId: slotId,
                mode: doctor.mode
            });
            toast.success("Appointment booked successfully!");
            navigate("/appointments");
        } catch (error) {
            console.error("Booking error:", error);
            const msg = error.response?.data?.message || "Booking failed. Slot may no longer be available.";
            toast.error(msg);
        } finally {
            setBooking(false);
        }
    };

    if (loading) return <div className="loading">Loading doctor profile...</div>;
    if (!doctor) return null;

    return (
        <div className="page-container doctor-detail-page">
            <button className="back-btn" onClick={() => navigate("/doctors")}>← Back to List</button>
            
            <div className="doctor-header-card">
                <div className="doctor-info-main">
                    <h1>{doctor.name}</h1>
                    <p className="specialty-badge">{doctor.specialty}</p>
                    <p className="doctor-email">{doctor.email}</p>
                </div>
                <div className="doctor-meta">
                    <div className="meta-item">
                        <label>Consultation Fee</label>
                        <span className="value">₹{doctor.consultationFee}</span>
                    </div>
                    <div className="meta-item">
                        <label>Availability</label>
                        <span className={`value mode-tag ${doctor.mode?.toLowerCase()}`}>{doctor.mode}</span>
                    </div>
                </div>
            </div>

            <div className="slots-section">
                <h2>Available Slots</h2>
                <div className="date-selector">
                    <label>Select Date:</label>
                    <input 
                        type="date" 
                        value={selectedDate} 
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                </div>

                <div className="slot-grid">
                    {slots.length > 0 ? (
                        slots.map(slot => (
                            <div key={slot.id} className="slot-card">
                                <div className="slot-time">
                                    {formatDate(slot.slotDate)} <br/>
                                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                </div>
                                <button 
                                    className="book-btn" 
                                    disabled={booking}
                                    onClick={() => handleBook(slot.id)}
                                >
                                    Book Now
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="no-slots">No slots available for this date.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DoctorDetails;