import axiosInstance from "../utils/axiosInstance";

export const bookAppointment = async (appointmentData) => {
    const response = await axiosInstance.post("/appointments", appointmentData);
    return response.data;
};

export const getMyByPatientId = async (patientId) => {
    const response = await axiosInstance.get(`/appointments/patient/${patientId}`);
    return response.data;
};

export const cancelAppointment = async (id) => {
    const response = await axiosInstance.patch(`/appointments/${id}/cancel`);
    return response.data;
};

// Admin Endpoints
export const getAllAppointments = async () => {
    const response = await axiosInstance.get('/admin/appointments');
    return response.data;
};

export const updateAppointmentStatus = async (id, status) => {
    // Note: status is sent as a raw string in the body per the backend @RequestBody AppointmentStatus enum
    const response = await axiosInstance.patch(`/admin/appointments/${id}/status`, `"${status}"`, {
        headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
};