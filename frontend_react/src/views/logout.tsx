import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { removeAuthToken } from "../utils/auth";

const LogoutBoutton: React.FC = () => {
    const navigate = useNavigate();
    const handleLogout = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Nettoyer le token localement
        removeAuthToken();
        
        // Appeler l'API de logout (optionnel)
        axios.post("http://127.0.0.1:8000/api/logout")
            .then((response) => {
                if (response.status === 200) {
                    console.log("Logout successful");
                }
            })
            .catch((error) => {
                console.log("Erreur lors de la déconnexion:", error.message);
            })
            .finally(() => {
                // Rediriger vers login avec un état indiquant la déconnexion
                navigate("/login", { state: { fromLogout: true } });
            });
    };

    return (
    <button
      type="button"
      onClick={handleLogout}
      style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            backgroundColor: '#363f46ff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '500',
            fontSize: '0.9em',
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(155, 89, 182, 0.3)'
          }}    >
      🚪Déconnexion
    </button>
    );
};

export default LogoutBoutton;
