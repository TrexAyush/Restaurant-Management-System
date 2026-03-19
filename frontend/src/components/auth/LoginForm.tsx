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
import { toast } from 'react-toastify';
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
      toast.error(errorMessage);
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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(255, 255, 255, 0.9)',
        }}
      >
        <Box sx={{
          width: 360,
          height: 120,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mt: -2,
          ml: -4
        }}>
          <Box
            component="img"
            src="/images/logo/LogoTrans2.png"
            alt="RMS Logo"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transform: 'scale(1.8)', // 👈 zoom factor
              transformOrigin: 'center',
            }}
          />
        </Box>
        <Typography variant="h5" component="h1" align="center" sx={{ fontWeight: 'bold', mt: -4, mb: 2 }}>
          Login
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 2 , mx: 4}}>
          Hey, Enter your credentials to access your account
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
            error={!!error}
            autoFocus
            disabled={isLoading}
            size='small'
            color='secondary'
            variant="outlined"
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
            error={!!error}
            color='secondary'
            variant="outlined"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 2, mb: 2, color: "#4C4C4C", fontWeight: "500", backgroundColor: "#F9C483", boxShadow: "none", }}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
          © 2026 RMS. All rights reserved.
        </Typography>
      </Paper>
    </Box>
  );
};