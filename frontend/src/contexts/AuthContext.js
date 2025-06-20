import React, { createContext, useState, useEffect, useContext } from 'react';
import { login as apiLogin } from '../api';
import apiClient from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true); // Para saber si estamos verificando el token inicial

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');

        if (storedUser && storedToken) {
            try {
                setUser(JSON.parse(storedUser));
                setToken(storedToken);
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            } catch (error) {
                console.error("Error al parsear usuario desde localStorage:", error);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, []);

    const login = async (credentials) => {
        try {
            const response = await apiLogin(credentials);
            const { token: newToken, user: userData } = response.data;

            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(userData));
            setToken(newToken);
            setUser(userData);
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            return { success: true };
        } catch (error) {
            console.error('Error en el login:', error.response?.data?.message || error.message);
            return { success: false, message: error.response?.data?.message || 'Error al iniciar sesión.' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        delete apiClient.defaults.headers.common['Authorization'];
        // Redirigir a login, se manejará en el componente ProtectedRoute o App.js
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
