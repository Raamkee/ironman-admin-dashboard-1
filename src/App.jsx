import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Delivery from "./pages/Delivery";
import Calendar from "./pages/Calendar";
import Partners from "./pages/Partners";
import Regions from "./pages/Regions";
import Zones from "./pages/Zones";
import Hubs from "./pages/Hubs";
import Stores from "./pages/Stores";
import Locations from "./pages/Locations";
import Users from "./pages/Users";
import Reports from "./pages/Reports";

function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem("auth") === "true";
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="delivery" element={<Delivery />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="partners" element={<Partners />} />
        <Route path="regions" element={<Regions />} />
        <Route path="zones" element={<Zones />} />
        <Route path="hubs" element={<Hubs />} />
        <Route path="stores" element={<Stores />} />
        <Route path="locations" element={<Locations />} />
        <Route path="users" element={<Users />} />
        <Route path="reports" element={<Reports />} />
      </Route>
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
