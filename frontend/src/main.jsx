import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import axios from "axios";

// --- THE INTERCEPTOR LOGIC ---
// This runs globally for every axios call in your app
axios.interceptors.response.use(
  (response) => response, // If response is 200 (OK), do nothing
  (error) => {
    // If the backend sends 401 (Unauthorized/Expired)
    if (error.response && error.response.status === 401) {
      console.warn("Session expired or unauthorized. Logging out...");
      
      // 1. Clear all user data
      localStorage.clear();
      
      // 2. Redirect to login page
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);