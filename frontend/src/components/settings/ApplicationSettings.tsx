import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { BillingService } from '../../services/billingService';
import { BillingConfig, RestaurantInfo, PDFOptions, PaymentMethod } from '../../types/billing';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const ApplicationSettings: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  
  // Billing Config
  const [configForm, setConfigForm] = useState<Partial<BillingConfig>>({});
  
  // Restaurant Info
  const [restaurantForm, setRestaurantForm] = useState<Partial<RestaurantInfo>>({});
  
  // PDF Options
  const [pdfForm, setPdfForm] = useState<Partial<PDFOptions>>({});
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [saving, setSaving] = useState(false);
  
  const { user } = useAuth();
  const isAdmin = user && [UserRole.ADMIN].includes(user.role);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [config, info, pdf] = await Promise.all([
        BillingService.getBillingConfig(),
        BillingService.getRestaurantInfo(),
        BillingService.getPDFOptions()
      ]);
      
      setConfigForm(config);
      setRestaurantForm(info);
      setPdfForm(pdf);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBillingConfig = async () => {
    try {
      setSaving(true);
      setError('');
      
      const updated = await BillingService.updateBillingConfig(configForm);
      setConfigForm(updated);
      setSuccessMessage('Billing settings saved successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save billing settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRestaurantInfo = async () => {
    try {
      setSaving(true);
      setError('');
      
      const updated = await BillingService.updateRestaurantInfo(restaurantForm);
      setRestaurantForm(updated);
      setSuccessMessage('Restaurant information saved successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save restaurant information');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePDFOptions = async () => {
    try {
      setSaving(true);
      setError('');
      
      const updated = await BillingService.updatePDFOptions(pdfForm);
      setPdfForm(updated);
      setSuccessMessage('PDF options saved successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save PDF options');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <Alert severity="error">
        You do not have permission to access application settings.
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon /> Application Settings
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadSettings}
          disabled={saving}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            aria-label="settings tabs"
          >
            <Tab label="Billing Settings" id="settings-tab-0" aria-controls="settings-tabpanel-0" />
            <Tab label="Restaurant Info" id="settings-tab-1" aria-controls="settings-tabpanel-1" />
            <Tab label="Invoice Customization" id="settings-tab-2" aria-controls="settings-tabpanel-2" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Billing Configuration
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Tax Rate (%)"
                  type="number"
                  value={configForm.taxRate || ''}
                  onChange={(e) => setConfigForm({ ...configForm, taxRate: parseFloat(e.target.value) })}
                  fullWidth
                  inputProps={{ step: '0.01', min: '0', max: '100' }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Default Payment Method</InputLabel>
                  <Select
                    value={configForm.defaultPaymentMethod || PaymentMethod.CASH}
                    label="Default Payment Method"
                    onChange={(e) => setConfigForm({ ...configForm, defaultPaymentMethod: e.target.value as PaymentMethod })}
                  >
                    <MenuItem value={PaymentMethod.CASH}>Cash</MenuItem>
                    <MenuItem value={PaymentMethod.CARD}>Card</MenuItem>
                    <MenuItem value={PaymentMethod.DIGITAL}>Digital</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Invoice Prefix"
                  value={configForm.invoicePrefix || ''}
                  onChange={(e) => setConfigForm({ ...configForm, invoicePrefix: e.target.value })}
                  fullWidth
                  placeholder="e.g., INV-"
                  helperText="Prefix for generated invoice numbers"
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveBillingConfig}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Billing Settings'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Restaurant Information
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Restaurant Name"
                  value={restaurantForm.name || ''}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, name: e.target.value })}
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Address"
                  value={restaurantForm.address || ''}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, address: e.target.value })}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Phone"
                  value={restaurantForm.phone || ''}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, phone: e.target.value })}
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Email"
                  type="email"
                  value={restaurantForm.email || ''}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, email: e.target.value })}
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Tax ID (Optional)"
                  value={restaurantForm.taxId || ''}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, taxId: e.target.value })}
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveRestaurantInfo}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Restaurant Info'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Invoice PDF Customization
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Header Text"
                  value={pdfForm.headerText || ''}
                  onChange={(e) => setPdfForm({ ...pdfForm, headerText: e.target.value })}
                  fullWidth
                  multiline
                  rows={2}
                  helperText="Text to appear at top of invoice"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Footer Text"
                  value={pdfForm.footerText || ''}
                  onChange={(e) => setPdfForm({ ...pdfForm, footerText: e.target.value })}
                  fullWidth
                  multiline
                  rows={2}
                  helperText="Text to appear at bottom of invoice"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Paper Size</InputLabel>
                  <Select
                    value={pdfForm.paperSize || 'A4'}
                    label="Paper Size"
                    onChange={(e) => setPdfForm({ ...pdfForm, paperSize: e.target.value as any })}
                  >
                    <MenuItem value="A4">A4</MenuItem>
                    <MenuItem value="LETTER">Letter</MenuItem>
                    <MenuItem value="RECEIPT">Receipt (80mm)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ pt: 1 }}>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={pdfForm.showLogo || false}
                        onChange={(e) => setPdfForm({ ...pdfForm, showLogo: e.target.checked })}
                      />
                      Show Logo
                    </label>
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={pdfForm.showQRCode || false}
                        onChange={(e) => setPdfForm({ ...pdfForm, showQRCode: e.target.checked })}
                      />
                      Show QR Code
                    </label>
                  </Typography>
                  <Typography variant="body2">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={pdfForm.includeItemDetails || false}
                        onChange={(e) => setPdfForm({ ...pdfForm, includeItemDetails: e.target.checked })}
                      />
                      Include Item Details
                    </label>
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSavePDFOptions}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Invoice Options'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Card>
    </Box>
  );
};
