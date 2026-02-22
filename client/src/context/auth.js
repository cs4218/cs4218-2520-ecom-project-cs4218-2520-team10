// Fix: Added React import - KIM SHI TONG A0265858J
import React, { useState, useContext, createContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({
        user: null,
        token: "",
    });

    //default axios
    axios.defaults.headers.common["Authorization"] = auth?.token;

    useEffect(() => {
       // Fix: Added try-catch error handling for localStorage parsing - KIM SHI TONG A0265858J
       try {
           const data = localStorage.getItem("auth");
           if (data) {
            const parseData = JSON.parse(data);
            setAuth({
                ...auth,
                user: parseData.user,
                token: parseData.token,
            });
           }
       } catch (error) {
           console.log("Failed to load auth from localStorage:", error);
           // Keep default state: {user: null, token: ""}
       }
       //eslint-disable-next-line
    }, []);
    return (
        <AuthContext.Provider value={[auth, setAuth]}>
            {children}
        </AuthContext.Provider>
    );
};

// custom hook
// Fix: Added validation to ensure useAuth is used within AuthProvider - KIM SHI TONG A0265858J
const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export {useAuth, AuthProvider};