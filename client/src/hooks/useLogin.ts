import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface LoginCredentials {
  email: string;
  password: string;
}

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Login failed';
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${result.user?.firstName || 'User'}!`,
      });

      // Force a page reload to update auth state
      window.location.href = "/";
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    isLoading,
  };
}