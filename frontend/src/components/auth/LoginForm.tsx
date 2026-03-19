import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Stack
} from '@mui/material';
import { Shield, Sparkle, UserCircle } from '@phosphor-icons/react';
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
        position: 'relative',
        overflow: 'hidden',
        background:
          'radial-gradient(circle at top left, rgba(99, 102, 241, 0.22), transparent 28%), radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.18), transparent 26%), linear-gradient(135deg, #0f172a 0%, #172554 50%, #1e293b 100%)',
        p: 2,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.04) 25%, transparent 25%) -24px 0 / 48px 48px, linear-gradient(225deg, rgba(255,255,255,0.03) 25%, transparent 25%) -24px 0 / 48px 48px',
          opacity: 0.35,
        }}
      />
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          gap: 3,
          width: '100%',
          maxWidth: 540,
          mr: 6,
          position: 'relative',
          zIndex: 1,
          color: '#e2e8f0',
        }}
      >
        <Chip
          icon={<Sparkle size={14} weight="fill" />}
          label="Restaurant Operations Hub"
          sx={{
            alignSelf: 'flex-start',
            bgcolor: 'rgba(255,255,255,0.08)',
            color: '#e2e8f0',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        />
        <Typography variant="h2" sx={{ maxWidth: 520, color: '#f8fafc' }}>
          Run service, kitchen, billing, and inventory from one polished workspace.
        </Typography>
        <Typography variant="h6" sx={{ color: 'rgba(226, 232, 240, 0.8)', maxWidth: 480, fontWeight: 400 }}>
          Built for fast-paced restaurant teams with live operational visibility and tighter control across every shift.
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          {['Live order flow', 'Role-based access', 'Operational analytics'].map((item) => (
            <Paper
              key={item}
              sx={{
                px: 2.25,
                py: 1.5,
                bgcolor: 'rgba(255,255,255,0.08)',
                borderColor: 'rgba(255,255,255,0.1)',
                color: '#f8fafc',
                backdropFilter: 'blur(12px)',
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {item}
              </Typography>
            </Paper>
          ))}
        </Stack>
      </Box>
      <Paper
        sx={{
          p: { xs: 3, sm: 4 },
          width: '100%',
          maxWidth: 460,
          mx: 2,
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(255, 255, 255, 0.82)',
          border: '1px solid rgba(255,255,255,0.45)',
          backdropFilter: 'blur(18px)',
          boxShadow: '0 30px 60px -24px rgba(15, 23, 42, 0.55)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}>
          <Chip
            icon={<Shield size={14} weight="duotone" />}
            label="Secure Login"
            sx={{ bgcolor: 'rgba(99, 102, 241, 0.08)', color: 'primary.main' }}
          />
          <UserCircle size={28} color="#6366f1" weight="duotone" />
        </Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
          }}
        >
          {localStorage.getItem('restaurantName') || 'Plated'}
        </Typography>
        <Typography variant="h4" component="h1" align="center" sx={{ fontWeight: 700, mb: 1 }}>
          Welcome back
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3, maxWidth: 320 }}>
          Sign in to continue managing service, stock, billing, and staff operations.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <TextField
            fullWidth
            label="Username"
            placeholder="Enter your username"
            value={credentials.username}
            onChange={handleChange('username')}
            margin="normal"
            error={!!error}
            autoFocus
            disabled={isLoading}
            size="medium"
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={credentials.password}
            onChange={handleChange('password')}
            margin="normal"
            disabled={isLoading}
            size="medium"
            error={!!error}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 2.5,
              mb: 1,
              minHeight: 48,
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            }}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2.5 }}>
          © 2026 RMS. All rights reserved.
        </Typography>
      </Paper>
    </Box>
  );
};