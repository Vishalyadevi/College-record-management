// CertificateContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const CertificateContext = createContext();

export const CertificateProvider = ({ children }) => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const backendUrl = "http://localhost:4000";
  const token = localStorage.getItem("token");
  const UserId = localStorage.getItem("userId");

  const fetchCertificates = useCallback(async () => {
    if (!token || !UserId) {
      console.log("Missing token or UserId");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${backendUrl}/api/certificates?UserId=${UserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Certificates Response:", response.data);
      setCertificates(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching certificates:", err);
      setError(err.message);
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  }, [token, UserId, backendUrl]);

  const uploadCertificate = useCallback(async (file, category, certificateType) => {
    if (!token || !UserId) return toast.error("Unauthorized: No token found");

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("certificate", file);
      formData.append("category", category);
      formData.append("certificateType", certificateType);
      formData.append("UserId", UserId);

      const response = await axios.post(`${backendUrl}/api/upload-certificate`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Upload response:", response.data);
      setCertificates((prev) => [...prev, response.data]);
      toast.success("Certificate uploaded successfully!");
      return response.data;
    } catch (err) {
      console.error("Error uploading certificate:", err);
      setError(err.message);
      toast.error("Failed to upload certificate.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token, UserId, backendUrl]);

  const deleteCertificate = useCallback(async (id) => {
    if (!token) return toast.error("Unauthorized: No token found");

    setLoading(true);

    try {
      await axios.delete(`${backendUrl}/api/delete-certificate/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCertificates((prev) => prev.filter((cert) => cert.id !== id));
      toast.success("Certificate deleted successfully!");
    } catch (err) {
      console.error("Error deleting certificate:", err);
      setError(err.message);
      toast.error("Failed to delete certificate.");
    } finally {
      setLoading(false);
    }
  }, [token, backendUrl]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  return (
    <CertificateContext.Provider
      value={{
        certificates,
        loading,
        error,
        fetchCertificates,
        uploadCertificate,
        deleteCertificate,
      }}
    >
      {children}
    </CertificateContext.Provider>
  );
};

export const useCertificateContext = () => useContext(CertificateContext);