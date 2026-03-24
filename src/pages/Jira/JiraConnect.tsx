import React, { useState, useEffect } from 'react';
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
import CloudOffIcon from '@mui/icons-material/CloudOff';
import jiraService from '../../api/services/jiraService';
import studentService from '../../api/services/studentService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUser } from '../../utils/auth';
import { toast } from 'react-toastify';

const steps = ['Nhập thông tin Jira', 'Kết nối & Đồng bộ'];

const JiraConnect: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const pid = Number(projectId);
    const currentUser = getUser();
    const isStudent = currentUser?.role === 'STUDENT';

    // Check leader status
    const { data: workspaces, isLoading: wsLoading } = useQuery({
        queryKey: ['student', 'workspaces'],
        queryFn: async () => {
            const res = await studentService.getMyWorkspaces();
            return res.data.data;
        },
        enabled: isStudent,
    });
    const isLeader = isStudent && workspaces?.find(w => w.projectId === pid)?.isLeader === true;
    const queryClient = useQueryClient();

    // Check if already connected → redirect to board
    const { data: connection } = useQuery({
        queryKey: ['jira', 'connection', pid],
        queryFn: async () => {
            try {
                const res = await jiraService.getStatus(pid);
                return res.data.data;
            } catch {
                return null;
            }
        },
        enabled: !!pid,
    });
    useEffect(() => {
        if (connection?.connectionStatus === 'CONNECTED') {
            navigate(`/projects/${pid}/jira`, { replace: true });
        }
    }, [connection, pid, navigate]);

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
        let connected = false;
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
            connected = true;

            // Step 2: Sync data
            await jiraService.sync({ projectId: pid });

            // Invalidate cached connection status so JiraBoard sees CONNECTED immediately
            await queryClient.invalidateQueries({ queryKey: ['jira', 'connection', pid] });

            toast.success('🎉 Kết nối Jira thành công!');
            navigate(`/projects/${pid}/jira`);
        } catch (err: unknown) {
            setStep(0);

            // Extract server error message
            let message = 'Không thể kết nối Jira — kiểm tra lại credentials';
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosError = err as { response?: { data?: { message?: string } } };
                if (axiosError.response?.data?.message) {
                    message = axiosError.response.data.message;
                }
            } else if (err instanceof Error) {
                message = err.message;
            }

            setError(message);
            toast.error(message);

            // If connect succeeded but sync failed, cleanup the connection
            if (connected) {
                try {
                    await jiraService.disconnect(pid);
                } catch {
                    // Ignore cleanup error
                }
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 560, mx: 'auto', mt: 4, px: 2 }}>
            {/* Non-leader users (member, lecturer) see info message when not connected */}
            {!isLeader && !wsLoading ? (
                <Box sx={{ textAlign: 'center', mt: 8 }}>
                    <CloudOffIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h5" fontWeight={800} gutterBottom>
                        Jira chưa được kết nối
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Chỉ <strong>Team Leader</strong> mới có thể thiết lập kết nối Jira cho dự án.
                        Vui lòng liên hệ Team Leader của nhóm.
                    </Typography>
                    <Button
                        variant="outlined"
                        onClick={() => navigate(`/projects/${pid}/jira`)}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                        Quay lại
                    </Button>
                </Box>
            ) : (
            <>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Box sx={{
                    width: 64, height: 64, mx: 'auto', mb: 2,
                    borderRadius: 3, background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(59,130,246,0.3)'
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
                        background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)',
                        '&:hover': { background: 'linear-gradient(135deg, #2563EB, #4F46E5, #7C3AED)' },
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
            </>
            )}
        </Box>
    );
};

export default JiraConnect;
