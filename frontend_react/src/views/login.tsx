import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { setAuthToken, getAuthToken } from "../utils/auth";
import "../template.css";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import TextField from "@mui/material/TextField";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [showLogoutMessage, setShowLogoutMessage] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const style = { display: "block", margin: "10px" };

  // Vérifier si l'utilisateur a un token valide au chargement
  useEffect(() => {
    const checkExistingAuth = async () => {
      const token = getAuthToken();
      
      // Si on vient de se déconnecter, afficher le message
      if (location.state?.fromLogout) {
        setShowLogoutMessage(true);
        return;
      }

      // Si un token existe, vérifier qu'il est valide
      if (token) {
        try {
          const response = await axios.get("http://127.0.0.1:8000/api/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.status === 200) {
            // Token valide, rediriger vers la bonne page
            if (response.data.roles && response.data.roles.includes("ROLE_ADMIN")) {
              navigate("/admin/dashboard", { replace: true });
            } else {
              navigate("/tasks", { replace: true });
            }
          }
        } catch (error) {
          // Token invalide ou expiré, rester sur la page login
          console.log("Token invalide ou expiré");
        }
      }
    };

    checkExistingAuth();
  }, [location, navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    axios
      .post(
        "http://127.0.0.1:8000/api/login",
        {
          email,
          password,
          rememberMe,
        },
        {
          withCredentials: true,
        }
      )
      .then((response) => {
        if (response.status === 200) {
          console.log("Login successful");
          console.log("Response data:", response.data);
          
          // Stocker le token selon le choix rememberMe
          if (response.data.token) {
            setAuthToken(response.data.token, rememberMe);
            if (rememberMe) {
              console.log("Token stored in localStorage (24h)");
            } else {
              console.log("Token stored in sessionStorage (session uniquement)");
            }
            console.log(
              "Token:",
              response.data.token.substring(0, 50) + "..."
            );
          } else {
            console.error("No token in response!");
          }
          if (response.data.user.roles[1] === "ROLE_ADMIN") {
            navigate("/admin/dashboard");
          } else {
            navigate("/tasks");
          }
        }
      })
      .catch((error) => {
        if (error.response && error.response.data) {
          const errorMessage =
            error.response.data.message ||
            error.response.data.error ||
            "Mauvais identifiant";
          console.log("Erreur:", errorMessage);
          alert(errorMessage);
        } else {
          console.log("Erreur:", error.message);
          alert("Erreur de connexion");
        }
      });
  };

  return (
    <div className="container login-center">
      <div className="login-card">
        <h1>Login</h1>
        <TextField
          required
          label="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={style}
        />
        <TextField
          id="outlined-password-input"
          label="Password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={style}
        />
        <div>
          <FormControlLabel
            control={<Checkbox />}
            label="Se souvenir de moi"
            checked={rememberMe}
            onChange={(e) => setRememberMe((e.target as HTMLInputElement).checked)}
          />
        </div>
        <Button variant="contained" onClick={handleLogin}>
          Envoyer
        </Button>
      </div>
      
      <Snackbar
        open={showLogoutMessage}
        autoHideDuration={4000}
        onClose={() => setShowLogoutMessage(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowLogoutMessage(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          Vous avez été déconnecté avec succès !
        </Alert>
      </Snackbar>
    </div>
  );
};

export default LoginPage;
