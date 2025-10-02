import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { ResellerLocator } from "./components/ResellerLocator";
import { Toaster } from "./components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const testConnection = async () => {
    try {
      const response = await axios.get(`${API}/`);
      console.log("Backend connection successful:", response.data.message);
    } catch (e) {
      console.error("Backend connection failed:", e);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ResellerLocator />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </div>
  );
}

export default App;
