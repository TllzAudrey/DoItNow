import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./views/login";
import Tasks from "./views/tasks";
import AdminDashboard from "./views/admin/dashboard";
import AdminTasks from "./views/admin/tasks";
import AdminCategorie from "./views/admin/categorie";
import AdminPriorite from "./views/admin/priorite";
import AdminUsers from "./views/admin/user";
import "./app.css";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div id="app-root" className="layout">
        <main className="layout-container">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/tasks" element={<AdminTasks />} />
            <Route path="/admin/categories" element={<AdminCategorie />} />            
            <Route path="/admin/priorities" element={<AdminPriorite />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;