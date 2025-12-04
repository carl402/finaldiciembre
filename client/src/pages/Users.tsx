import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users as UsersIcon, UserCheck, UserX, Plus, Edit, Key, Ban, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AddUserDialog from "@/components/AddUserDialog";
import EditUserDialog from "@/components/EditUserDialog";

export default function Users() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const { user, isAuthenticated, isLoading } = useAuth() as { user: any, isAuthenticated: boolean, isLoading: boolean };
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "Please log in to access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: users, isLoading: usersLoading, error } = useQuery({
    queryKey: ["/api/users"],
    queryFn: () => {
      // Simular carga de usuarios desde localStorage
      const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
      // Añadir usuario admin por defecto si no existe
      if (storedUsers.length === 0) {
        const defaultAdmin = {
          id: '1',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@test.com',
          role: 'admin',
          createdAt: new Date().toISOString(),
          isActive: true
        };
        storedUsers.push(defaultAdmin);
        localStorage.setItem('users', JSON.stringify(storedUsers));
      }
      return storedUsers;
    },
    enabled: isAuthenticated && user?.role === 'admin',
  });



  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedUsers = users.map((u: any) => 
        u.id === userId ? { ...u, role } : u
      );
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      return { userId, role };
    },
    onSuccess: () => {
      toast({
        title: "User role updated",
        description: "The user's role has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  const deactivateUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedUsers = users.map((u: any) => 
        u.id === userId ? { ...u, isActive: false } : u
      );
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      return userId;
    },
    onSuccess: () => {
      toast({
        title: "User deactivated",
        description: "The user has been successfully deactivated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to deactivate user",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="role-badge admin">Administrator</Badge>;
      case 'analyst':
        return <Badge className="role-badge analyst">Analyst</Badge>;
      case 'viewer':
        return <Badge className="role-badge viewer">Viewer</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="status-badge completed">Active</Badge>
    ) : (
      <Badge className="status-badge failed">Inactive</Badge>
    );
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-16">
            <div className="w-16 h-16 bg-destructive/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Ban className="text-destructive" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              You don't have permission to access user management. Admin privileges are required.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Users Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">User Management</h2>
          <p className="text-muted-foreground">Manage system users and their permissions</p>
        </div>
        <AddUserDialog>
          <Button>
            <Plus className="mr-2" size={18} />
            Add User
          </Button>
        </AddUserDialog>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="stat-card">
          <CardContent className="flex items-center p-6">
            <div className="p-3 bg-primary/10 rounded-lg">
              <UsersIcon className="text-primary" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <p className="text-3xl font-bold text-foreground">
                {usersLoading ? <Skeleton className="h-8 w-16" /> : users?.length || 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="flex items-center p-6">
            <div className="p-3 bg-success/10 rounded-lg">
              <UserCheck className="text-success" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Active Users</p>
              <p className="text-3xl font-bold text-foreground">
                {usersLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  users?.filter((u: any) => u.isActive).length || 0
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="flex items-center p-6">
            <div className="p-3 bg-warning/10 rounded-lg">
              <UserX className="text-warning" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Administrators</p>
              <p className="text-3xl font-bold text-foreground">
                {usersLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  users?.filter((u: any) => u.role === 'admin').length || 0
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>System Users</CardTitle>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="analyst">Analyst</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {users
                    ?.filter((u: any) => 
                      (roleFilter === 'all' || u.role === roleFilter) &&
                      (searchTerm === '' || 
                        u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        u.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                    )
                    ?.map((userItem: any) => (
                      <tr key={userItem.id} className="hover:bg-muted/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar className="w-10 h-10 mr-4">
                              <AvatarImage 
                                src={userItem.profileImageUrl || ""} 
                                alt={`${userItem.firstName} ${userItem.lastName}`}
                              />
                              <AvatarFallback>
                                {userItem.firstName?.[0]}{userItem.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium text-foreground">
                                {userItem.firstName} {userItem.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">{userItem.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(userItem.role)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {formatDate(userItem.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(userItem.isActive)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          <div className="flex items-center space-x-2">
                            <EditUserDialog 
                              user={userItem} 
                              onUserUpdated={() => queryClient.invalidateQueries({ queryKey: ["/api/users"] })}
                            />
                            <Button variant="ghost" size="sm" title="Reset Password">
                              <Key size={16} />
                            </Button>
                            {userItem.isActive ? (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                title="Deactivate"
                                onClick={() => deactivateUserMutation.mutate(userItem.id)}
                                disabled={deactivateUserMutation.isPending}
                              >
                                <Ban size={16} />
                              </Button>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                title="Activate"
                                onClick={() => {
                                  const users = JSON.parse(localStorage.getItem('users') || '[]');
                                  const updatedUsers = users.map((u: any) => 
                                    u.id === userItem.id ? { ...u, isActive: true } : u
                                  );
                                  localStorage.setItem('users', JSON.stringify(updatedUsers));
                                  queryClient.invalidateQueries({ queryKey: ["/api/users"] });
                                  toast({
                                    title: "User activated",
                                    description: "The user has been successfully activated.",
                                  });
                                }}
                              >
                                <Check size={16} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
