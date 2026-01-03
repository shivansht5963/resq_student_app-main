import React, { createContext, useContext, useState } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentBeacon, setCurrentBeacon] = useState("West Corridor - Block A");

  const addIncident = (incidentData) => {
    const newIncident = {
      id: Date.now().toString(),
      type: incidentData.type,
      description: incidentData.description,
      location: incidentData.location || null,
      beaconLocation: incidentData.beaconLocation,
      gpsLocation: incidentData.gpsLocation || null,
      images: incidentData.images || [],
      created_at: incidentData.timestamp || new Date().toISOString(),
      status: incidentData.status || "pending",
      userId: incidentData.userId || "guest",
      media: incidentData.media || [],
      timeline: [
        {
          id: "1",
          status: "REPORTED",
          timestamp: new Date(),
          description: "Incident reported",
        },
      ],
    };

    setIncidents((prev) => [newIncident, ...prev]);
    return newIncident;
  };

  const sendSOSAlert = () => {
    const sosIncident = {
      id: Date.now().toString(),
      type: "Emergency",
      description: "SOS Alert - Emergency assistance requested",
      beaconLocation: currentBeacon,
      gpsLocation: null,
      timestamp: new Date(),
      status: "REPORTED",
      media: [],
      timeline: [
        {
          id: "1",
          status: "REPORTED",
          timestamp: new Date(),
          description: "SOS Alert triggered",
        },
        {
          id: "2",
          status: "ASSIGNED",
          timestamp: new Date(Date.now() + 30000),
          description: "Security team assigned",
        },
      ],
    };

    setIncidents((prev) => [sosIncident, ...prev]);
    return sosIncident;
  };

  const addMessage = (messageText) => {
    const newMessage = {
      id: Date.now().toString(),
      message: messageText,
      sender: "user",
      created_at: new Date().toISOString(),
      userId: user?.id || "guest",
    };
    setMessages((prev) => [...prev, newMessage]);

    // Simulate security response
    setTimeout(() => {
      const responseMessage = {
        id: (Date.now() + 1).toString(),
        message: "Thank you for your message. Campus Security has been notified and will respond shortly.",
        sender: "security",
        created_at: new Date().toISOString(),
        userId: "security",
      };
      setMessages((prev) => [...prev, responseMessage]);
    }, 1500);

    return newMessage;
  };

  const value = {
    user,
    setUser,
    incidents,
    addIncident,
    sendSOSAlert,
    currentBeacon,
    setCurrentBeacon,
    messages,
    addMessage,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
