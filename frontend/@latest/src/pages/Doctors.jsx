import { useState, useEffect } from "react";
import { getDoctors, getSpecialties } from "../api/doctorApi";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Doctors = () => {
    const [doctors, setDoctors] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [filters, setFilters] = useState({ specialtyId: "", mode: "" });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchSpecialties();
    }, []);

    useEffect(() => {
        fetchDoctors();
    }, [filters]);

    const fetchSpecialties = async () => {
        try {
            const data = await getSpecialties();
            console.log("Specialties loaded:", data);
            setSpecialties(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch specialties", error);
            // Don't toast here as it might be a transition state
        }
    };

    const fetchDoctors = async () => {
        setLoading(true);
        try {
            const data = await getDoctors({
                specialtyId: filters.specialtyId || undefined,
                mode: filters.mode || undefined
            });
            console.log("Doctors loaded:", data);
            setDoctors(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load doctors:", error);
            const msg = error.response?.data?.message || "Failed to load doctors. Check console or CORS.";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Doctors</h1>
                    <p className="subtitle">Connect with specialists from {specialties.length} fields</p>
                </div>
                <div className="filters">
                    <select
                        value={filters.specialtyId}
                        onChange={(e) => setFilters({ ...filters, specialtyId: e.target.value })}
                    >
                        <option value="">All Specialties</option>
                        {specialties.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>

                    <select
                        value={filters.mode}
                        onChange={(e) => setFilters({ ...filters, mode: e.target.value })}
                    >
                        <option value="">All Modes</option>
                        <option value="ONLINE">Online</option>
                        <option value="OFFLINE">Offline</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="loading">Searching for doctors...</div>
            ) : (
                <div className="doctor-grid">
                    {doctors.length > 0 ? (
                        doctors.map(doc => (
                            <div key={doc.id} className="doctor-card" onClick={() => navigate(`/doctors/${doc.id}`)}>
                                <h3>{doc.name}</h3>
                                <p className="specialty">{doc.specialty}</p>
                                <div className="card-footer">
                                    <span className={`mode-tag ${doc.mode?.toLowerCase()}`}>{doc.mode}</span>
                                    <span className="fee">₹{doc.consultationFee}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-results">
                            <p>No doctors found.</p>
                            <button onClick={fetchDoctors} className="retry-btn">Retry Refresh</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Doctors;