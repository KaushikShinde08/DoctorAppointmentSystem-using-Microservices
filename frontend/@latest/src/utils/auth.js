import { jwtDecode } from "jwt-decode";

export const setToken = (token) => {
    localStorage.setItem("token", token);
};

export const getToken = () => {
    return localStorage.getItem("token");
};

export const removeToken = () => {
    localStorage.removeItem("token");
};

export const getUserFromToken = () => {
    const token = getToken();
    if (!token) return null;
    try {
        const decoded = jwtDecode(token);
        // Map backend claims to frontend properties
        return {
            id: decoded.userId || decoded.sub, // sub is often used for ID or email
            email: decoded.sub,
            role: decoded.role
        };
    } catch (error) {
        return null;
    }
};
