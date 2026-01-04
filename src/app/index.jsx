import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { getAuthToken } from "@/utils/api";

export default function Index() {
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authToken = await getAuthToken();
        setToken(authToken);
      } catch (error) {
        console.error("Error checking auth:", error);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return null; // Show splash while checking auth
  }

  // Redirect to login if no token, otherwise go to home
  return <Redirect href={token ? "/(tabs)/home" : "/login"} />;
}

