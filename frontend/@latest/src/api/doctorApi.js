import axiosInstance from "../utils/axiosInstance";

export const getDoctors = async (params) => {
    const response = await axiosInstance.get("/doctors", { params });
    return response.data;
};

export const getDoctorById = async (id) => {
    const response = await axiosInstance.get(`/doctors/${id}`);
    return response.data;
};

export const getSlots = async (doctorId, date) => {
    const response = await axiosInstance.get(`/doctors/${doctorId}/slots`, {
        params: { date }
    });
    return response.data;
};

export const getSpecialties = async () => {
    const response = await axiosInstance.get("/specialties");
    return response.data;
};