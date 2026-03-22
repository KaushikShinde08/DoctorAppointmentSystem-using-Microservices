import axiosInstance from "../utils/axiosInstance";

export const login = async (credentials) => {
    const response = await axiosInstance.post("/auth/login", credentials);
    return response.data; // Expecting { token }
};

export const register = async (userData) => {
    const response = await axiosInstance.post("/auth/register", userData);
    return response.data;
};