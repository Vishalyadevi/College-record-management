import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      console.error("No token found! Redirecting to login...");
      navigate('/login');
    } else {
      axios.get('http://localhost:4000/api/user', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(response => setUser(response.data))
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
        navigate('/login');
      });
    }
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);