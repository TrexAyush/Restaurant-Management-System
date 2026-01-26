import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TableRestaurant as TableIcon,
  People as PeopleIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { Table, TableStatus, CreateTableRequest, UpdateTableRequest } from '../../types/table';
import { TableService } from '../../services/tableService';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';

interface TableFormData {
  number: number;
  capacity: number;
  status: TableStatus;
}

export const TableManagement: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [formData, setFormData] = useState<TableFormData>({
    number: 1,
    capacity: 2,
    status: TableStatus.AVAILABLE
  });
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const canManageTables = user && [UserRole.ADMIN, UserRole.MANAGER].includes(user.role);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      setLoading(true);
      const tablesData = await TableService.getAllTables();
      setTables(tablesData.sort((a, b) => a.number - b.number));
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTable = () => {
    const nextNumber = Math.max(...tables.map(t => t.number), 0) + 1;
    setEditingTable(null);
    setFormData({
      number: nextNumber,
      capacity: 2,
      status: TableStatus.AVAILABLE
    });
    setDialogOpen(true);
  };

  const handleEditTable = (table: Table) => {
    setEditingTable(table);
    setFormData({
      number: table.number,
      capacity: table.capacity,
      status: table.status
    });
    setDialogOpen(true);
  };

  const handleDeleteTable = async (tableId: string) => {
    if (window.confirm('Are you sure you want to delete this table?')) {
      try {
        await TableService.deleteTable(tableId);
        await loadTables();
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to delete table');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');

      if (editingTable) {
        const updateData: UpdateTableRequest = {
          number: formData.number,
          capacity: formData.capacity,
          status: formData.status
        };
        await TableService.updateTable(editingTable.id, updateData);
      } else {
        const createData: CreateTableRequest = {
          number: formData.number,
          capacity: formData.capacity
        };
        await TableService.createTable(createData);
      }

      setDialogOpen(false);
      await loadTables();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save table');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: TableStatus) => {
    const colors: Record<TableStatus, 'success' | 'warning' | 'error' | 'default'> = {
      [TableStatus.AVAILABLE]: 'success',
      [TableStatus.OCCUPIED]: 'warning',
      [TableStatus.RESERVED]: 'default',
      [TableStatus.OUT_OF_SERVICE]: 'error'
    };
    return colors[status];
  };

  const getStatusIcon = (status: TableStatus) => {
    switch (status) {
      case TableStatus.AVAILABLE:
        return '✅';
      case TableStatus.OCCUPIED:
        return '🔴';
      case TableStatus.RESERVED:
        return '🟡';
      case TableStatus.OUT_OF_SERVICE:
        return '❌';
      default:
        return '❓';
    }
  };

  const formatOccupiedTime = (occupiedAt?: string) => {
    if (!occupiedAt) return null;
    const now = new Date();
    const occupied = new Date(occupiedAt);
    const diffMs = now.getTime() - occupied.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Table Management
        </Typography>
        {canManageTables && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateTable}
          >
            Add Table
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!canManageTables && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You have read-only access to table information.
        </Alert>
      )}

      {/* Table Statistics */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Table Overview
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box textAlign="center">
              <Typography variant="h4" color="success.main">
                {tables.filter(t => t.status === TableStatus.AVAILABLE).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box textAlign="center">
              <Typography variant="h4" color="warning.main">
                {tables.filter(t => t.status === TableStatus.OCCUPIED).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Occupied
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box textAlign="center">
              <Typography variant="h4" color="info.main">
                {tables.filter(t => t.status === TableStatus.RESERVED).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Reserved
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box textAlign="center">
              <Typography variant="h4" color="error.main">
                {tables.filter(t => t.status === TableStatus.OUT_OF_SERVICE).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Out of Service
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tables Grid */}
      <Grid container spacing={2}>
        {tables.map((table) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={table.id}>
            <Card
              sx={{
                height: '100%',
                border: table.status === TableStatus.OCCUPIED ? '2px solid' : '1px solid',
                borderColor: table.status === TableStatus.OCCUPIED ? 'warning.main' : 'divider',
                position: 'relative'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TableIcon color="primary" />
                    <Typography variant="h6" component="h2">
                      Table {table.number}
                    </Typography>
                  </Box>
                  <Typography variant="h4">
                    {getStatusIcon(table.status)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PeopleIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Capacity: {table.capacity}
                  </Typography>
                </Box>

                <Chip
                  label={table.status.replace('_', ' ').toUpperCase()}
                  color={getStatusColor(table.status)}
                  size="small"
                  sx={{ mb: 2 }}
                />

                {table.status === TableStatus.OCCUPIED && table.occupiedAt && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <TimeIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Occupied for: {formatOccupiedTime(table.occupiedAt)}
                    </Typography>
                  </Box>
                )}

                {canManageTables && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEditTable(table)}
                      title="Edit Table"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteTable(table.id)}
                      title="Delete Table"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}

        {tables.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No tables configured
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {canManageTables 
                  ? 'Add your first table to get started with table management.'
                  : 'Contact a manager to set up tables.'
                }
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Table Form Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTable ? 'Edit Table' : 'Add New Table'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Table Number"
              type="number"
              value={formData.number}
              onChange={(e) => setFormData(prev => ({ ...prev, number: parseInt(e.target.value) || 1 }))}
              margin="normal"
              required
              inputProps={{ min: 1 }}
            />
            <TextField
              fullWidth
              label="Capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
              margin="normal"
              required
              inputProps={{ min: 1, max: 20 }}
              helperText="Maximum number of people this table can seat"
            />
            {editingTable && (
              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as TableStatus }))}
                >
                  {Object.values(TableStatus).map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.replace('_', ' ').toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} /> : (editingTable ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};