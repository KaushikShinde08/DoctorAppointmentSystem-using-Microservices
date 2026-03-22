export const getUserFromToken = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    const payload = JSON.parse(atob(token.split(".")[1]));

    return payload; // contains userId, role, email
};