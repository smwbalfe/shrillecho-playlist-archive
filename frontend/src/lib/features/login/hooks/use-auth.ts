"use client";
import { useState, useEffect } from "react";
import { api } from "@/src/lib/services/api";
import { supabase } from "@/src/lib/services/supabase";
import { setCookie, checkForCookie } from "@/src/lib/utils/cookies";

interface UseAuthReturn {
  isLoading: boolean;
  hasSession: boolean;
  registerAnomUser: () => Promise<any>;
}

export const useAuth = (): UseAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasSession, setHasSession] = useState(true);

  useEffect(() => {
    setHasSession(checkForCookie());
  }, []);

  const registerAnomUser = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      if (!data.session) throw new Error("No session created");

      setCookie(data.session.access_token);
      setHasSession(true);

      try {
        const responseData = await api.post("/users");
        console.log("Backend response:", responseData);
        return responseData;
      } catch (backendError) {
        await supabase.auth.signOut();
        setHasSession(false);
        throw backendError;
      }
    } catch (error) {
      console.error("Error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    hasSession,
    registerAnomUser,
  };
};
