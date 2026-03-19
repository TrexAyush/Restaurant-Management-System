import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Chip,
  Stack
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Add, Edit, Delete, Lock, LockOpen } from '@mui/icons-material';
import { User, UserRole, CreateUserRequest, UpdateUserRequest } from '../../types/auth';
import { AuthService } from '../../services/authService';
import { toast } from 'react-toastify';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({
    open: false, title: '', message: '', onConfirm: () => {}
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUserRequest>({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    email: '',
    role: UserRole.WAITER
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await AuthService.getAllUsers();
      setUsers(usersData);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      firstName: '',
      lastName: '',
      email: '',
      role: UserRole.WAITER
    });
    setDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '', // Don't pre-fill password for security
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    });
    setDialogOpen(true);
  };

  const handleToggleUserStatus = (user: User) => {
    const action = user.isActive ? 'deactivate' : 'activate';
    setConfirmDialog({
      open: true,
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      message: `Are you sure you want to ${action} this user?`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        try {
          if (user.isActive) {
            await AuthService.deactivateUser(user.id);
          } else {
            await AuthService.activateUser(user.id);
          }
          toast.success(`User ${action}d successfully`);
          await loadUsers();
        } catch (err: any) {
          const msg = err.response?.data?.error?.message || `Failed to ${action} user`;
          setError(msg);
          toast.error(msg);
        }
      }
    });
  };

  const handleDeleteUser = (userId: string) => {
    setConfirmDialog({
      open: true,
      title: 'Delete User',
      message: 'Are you sure you want to delete this user?',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        try {
          await AuthService.deleteUser(userId);
          toast.success('User deleted successfully');
          await loadUsers();
        } catch (err: any) {
          const msg = err.response?.data?.error?.message || 'Failed to delete user';
          setError(msg);
          toast.error(msg);
        }
      }
    });
  };

  const handleSubmit = async () => {
    try {
      setError('');

      // Validate required fields
      if (!formData.firstName.trim()) {
        setError('First name is required');
        return;
      }
      if (!formData.lastName.trim()) {
        setError('Last name is required');
        return;
      }
      if (!formData.email.trim()) {
        setError('Email is required');
        return;
      }
      if (!formData.role) {
        setError('Role is required');
        return;
      }

      if (editingUser) {
        // Update existing user
        if (!formData.email.includes('@')) {
          setError('Please enter a valid email address');
          return;
        }

        const updateData: UpdateUserRequest = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          role: formData.role
        };
        await AuthService.updateUser(editingUser.id, updateData);
      } else {
        // Create new user
        // Additional validation for create
        if (!formData.username.trim()) {
          setError('Username is required');
          return;
        }
        if (formData.username.length < 3) {
          setError('Username must be at least 3 characters');
          return;
        }
        if (!formData.password) {
          setError('Password is required');
          return;
        }
        if (formData.password.length < 8) {
          setError('Password must be at least 8 characters');
          return;
        }
        if (!formData.email.includes('@')) {
          setError('Please enter a valid email address');
          return;
        }

        const createData: CreateUserRequest = {
          username: formData.username.trim(),
          password: formData.password,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          role: formData.role
        };
        await AuthService.createUser(createData);
      }
      
      setDialogOpen(false);
      toast.success(editingUser ? 'User updated successfully' : 'User created successfully');
      await loadUsers();
    } catch (err: any) {
      const msg = err.response?.data?.error?.details?.[0] || err.response?.data?.error?.message || 'Failed to save user';
      setError(msg);
      toast.error(msg);
    }
  };

  const getRoleColor = (role: UserRole) => {
    const colors: Record<UserRole, 'primary' | 'secondary' | 'success' | 'warning' | 'error'> = {
      [UserRole.ADMIN]: 'error',
      [UserRole.MANAGER]: 'primary',
      [UserRole.WAITER]: 'success',
      [UserRole.KITCHEN_STAFF]: 'warning',
      [UserRole.CASHIER]: 'secondary'
    };
    return colors[role];
  };

  const columns: GridColDef[] = [
    { field: 'username', headerName: 'Username', width: 150 },
    { field: 'firstName', headerName: 'First Name', width: 130 },
    { field: 'lastName', headerName: 'Last Name', width: 130 },
    { field: 'email', headerName: 'Email', width: 200 },
    {
      field: 'role',
      headerName: 'Role',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value.replace('_', ' ').toUpperCase()}
          color={getRoleColor(params.value)}
          size="small"
        />
      )
    },
    {
      field: 'isActive',
      headerName: 'Active',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 150,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<Edit />}
          label="Edit"
          onClick={() => handleEditUser(params.row)}
        />,
        <GridActionsCellItem
          icon={params.row.isActive ? <Lock /> : <LockOpen />}
          label={params.row.isActive ? 'Deactivate' : 'Activate'}
          onClick={() => handleToggleUserStatus(params.row)}
        />,
        <GridActionsCellItem
          icon={<Delete />}
          label="Delete"
          onClick={() => handleDeleteUser(params.row.id)}
        />
      ]
    }
  ];

  return (
    <Box>
      <Paper
        sx={{
          p: { xs: 2.5, md: 3 },
          mb: 3,
          background: 'linear-gradient(135deg, rgba(236,72,153,0.1) 0%, rgba(139,92,246,0.08) 100%)',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ mb: 0.75 }}>
              User Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage staff accounts, assign roles, and control access permissions.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateUser}
          >
            Add User
          </Button>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={users}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } }
          }}
          disableRowSelectionOnClick
        />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Edit User' : 'Create New User'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Username"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              margin="normal"
              required
              disabled={!!editingUser} // Can't change username when editing
            />
            {!editingUser && (
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                margin="normal"
                required
              />
            )}
            <TextField
              fullWidth
              label="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                label="Role"
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
              >
                {Object.values(UserRole).map((role) => (
                  <MenuItem key={role} value={role}>
                    {role.replace('_', ' ').toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
      />
    </Box>
  );
};