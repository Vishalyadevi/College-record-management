import React from "react";
import { useNavigate } from "react-router-dom";

const LogoutButton = ({className}) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    navigate("/placement");
  };

  return (
    <button className={className} onClick={handleLogout}>
      Logout
    </button>
  );
};

export default LogoutButton;