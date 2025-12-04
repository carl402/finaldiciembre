import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
}

export function useCreateUser() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: CreateUserData) => {
      // Simulación de creación de usuario
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Validar email único (simulado)
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      if (existingUsers.some((user: any) => user.email === userData.email)) {
        throw new Error('Email already exists');
      }
      
      // Crear nuevo usuario
      const newUser = {
        id: Date.now().toString(),
        ...userData,
        createdAt: new Date().toISOString(),
        isActive: true
      };
      
      // Guardar en localStorage
      const updatedUsers = [...existingUsers, newUser];
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      
      return newUser;
    },
    onSuccess: (data) => {
      toast({
        title: "User created successfully",
        description: `${data.firstName} ${data.lastName} has been added as an administrator.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      toast({
        title: "Failed to create user",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}