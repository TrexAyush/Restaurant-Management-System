import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { LoginCredentials } from '../../types/auth';
import { useAuth } from '../../contexts/AuthContext';

export const LoginForm: React.FC = () => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: ''
  });
  const [error, setError] = useState<string>('');
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!credentials.username || !credentials.password) {
      setError('Please enter both username and password');
      return;
    }

    try {
      await login(credentials);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
    }
  };

  const handleChange = (field: keyof LoginCredentials) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCredentials(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'grey.100',
        backgroundImage: 'url(/images/background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        p: 2
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
          mx: 2,
          borderRadius: 6,
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom align="center">
          🍽️ RMS Login
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Restaurant Management System
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Username"
            placeholder='Enter Your Username!'
            value={credentials.username}
            onChange={handleChange('username')}
            margin="normal"
            error ={!!error}
            autoFocus
            disabled={isLoading}
            size='small'
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            placeholder='Enter Your Password!'
            value={credentials.password}
            onChange={handleChange('password')}
            margin="normal"
            disabled={isLoading}
            size='small'
            error ={!!error}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, color: "#373c3c", fontWeight: "500", backgroundColor: "#F9C483" }}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
          Contact your administrator for account access
        </Typography>
      </Paper>
    </Box>
  );
};