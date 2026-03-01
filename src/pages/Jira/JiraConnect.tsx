import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, TextField, Button, Paper, InputAdornment,
    Alert, CircularProgress, Stepper, Step, StepLabel,
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import EmailIcon from '@mui/icons-material/Email';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import FolderIcon from '@mui/icons-material/Folder';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import jiraService from '../../api/services/jiraService';
import { toast } from 'react-toastify';

const steps = ['Nhập thông tin Jira', 'Kết nối & Đồng bộ'];

const JiraConnect: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const pid = Number(projectId);

    const [form, setForm] = useState({
        siteUrl: '',
        email: '',
        apiToken: '',
        projectKey: '',
    });
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(0);
    const [error, setError] = useState('');

    const handleChange = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const isFormValid = form.siteUrl && form.email && form.apiToken && form.projectKey;

    const handleConnect = async () => {
        if (!isFormValid) return;
        try {
            setLoading(true);
            setError('');
            setStep(1);

            // Step 1: Connect
            await jiraService.connect({
                projectId: pid,
                siteUrl: form.siteUrl.replace(/\/$/, ''),
                email: form.email,
                apiToken: form.apiToken,
                projectKey: form.projectKey.toUpperCase(),
            });

            // Step 2: Sync data
            await jiraService.sync({ projectId: pid });

            toast.success('🎉 Kết nối Jira thành công!');
            navigate(`/projects/${pid}/jira`);
        } catch (err: unknown) {
            setStep(0);
            const message = err instanceof Error ? err.message : 'Không thể kết nối Jira — kiểm tra lại credentials';
            setError(message);
            toast.error('Kết nối thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 560, mx: 'auto', mt: 4, px: 2 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Box sx={{
                    width: 64, height: 64, mx: 'auto', mb: 2,
                    borderRadius: 3, bgcolor: '#0052CC', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(0,82,204,0.3)',
                }}>
                    <CloudDoneIcon sx={{ color: '#fff', fontSize: 32 }} />
                </Box>
                <Typography variant="h5" fontWeight={800}>Kết nối Jira</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Liên kết Jira Cloud để đồng bộ Sprints, Issues và quản lý dự án
                </Typography>
            </Box>

            {/* Stepper */}
            <Stepper activeStep={step} alternativeLabel sx={{ mb: 3 }}>
                {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
            </Stepper>

            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

            {/* Form */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <TextField
                        label="Jira Site URL" fullWidth size="small"
                        placeholder="https://your-team.atlassian.net"
                        value={form.siteUrl}
                        onChange={e => handleChange('siteUrl', e.target.value)}
                        disabled={loading}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><LinkIcon fontSize="small" /></InputAdornment>,
                        }}
                    />
                    <TextField
                        label="Email" fullWidth size="small"
                        placeholder="your-email@fpt.edu.vn"
                        value={form.email}
                        onChange={e => handleChange('email', e.target.value)}
                        disabled={loading}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" /></InputAdornment>,
                        }}
                    />
                    <TextField
                        label="API Token" fullWidth size="small" type="password"
                        placeholder="Lấy từ id.atlassian.com/manage-profile/security/api-tokens"
                        value={form.apiToken}
                        onChange={e => handleChange('apiToken', e.target.value)}
                        disabled={loading}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><VpnKeyIcon fontSize="small" /></InputAdornment>,
                        }}
                    />
                    <TextField
                        label="Project Key" fullWidth size="small"
                        placeholder="VD: TS, PROJ, DEMO"
                        value={form.projectKey}
                        onChange={e => handleChange('projectKey', e.target.value.toUpperCase())}
                        disabled={loading}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><FolderIcon fontSize="small" /></InputAdornment>,
                        }}
                    />
                </Box>

                <Button
                    fullWidth variant="contained" size="large"
                    onClick={handleConnect}
                    disabled={!isFormValid || loading}
                    sx={{
                        mt: 3, py: 1.5, borderRadius: 2,
                        textTransform: 'none', fontWeight: 700, fontSize: '1rem',
                        bgcolor: '#0052CC',
                        '&:hover': { bgcolor: '#0747A6' },
                    }}
                >
                    {loading ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={20} sx={{ color: '#fff' }} />
                            Đang kết nối & đồng bộ...
                        </Box>
                    ) : 'Kết nối Jira'}
                </Button>
            </Paper>

            {/* Help Text */}
            <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
                <Typography variant="caption">
                    <strong>Cách lấy API Token:</strong> Vào{' '}
                    <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noreferrer">
                        id.atlassian.com
                    </a>
                    {' '}→ Create API Token → Copy paste vào form trên.
                </Typography>
            </Alert>
        </Box>
    );
};

export default JiraConnect;
