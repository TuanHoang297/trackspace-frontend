import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Grid,
    TextField,
    Breadcrumbs,
    Link,
    Skeleton,
    Divider,
    IconButton
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import { toast } from 'react-toastify';
import projectService from '../../api/services/projectService';
import type { ProjectResponse, ProjectInfoResponse, ProjectInfoRequest } from '../../api/types/types';

const ProjectInfo: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const id = Number(projectId);

    const [project, setProject] = useState<ProjectResponse | null>(null);
    const [info, setInfo] = useState<ProjectInfoResponse | null>(null);

    // Editable state
    const [topic, setTopic] = useState('');
    const [context, setContext] = useState('');
    const [problems, setProblems] = useState('');
    const [primaryActors, setPrimaryActors] = useState('');
    const [functionalRequirements, setFunctionalRequirements] = useState('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const projRes = await projectService.getProjectById(id);
            const p = projRes.data.data;
            setProject(p);

            if (p.hasProjectInfo) {
                const infoRes = await projectService.getProjectInfo(id);
                const i = infoRes.data.data;
                setInfo(i);
                setTopic(i.topic || '');
                setContext(i.context || '');
                setProblems(i.problems || '');
                setPrimaryActors(i.primaryActors || '');
                setFunctionalRequirements(i.functionalRequirements || '');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Không thể tải chi tiết project');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    const handleSave = async () => {
        try {
            setSaving(true);
            const request: ProjectInfoRequest = {
                topic,
                context,
                problems,
                primaryActors,
                functionalRequirements
            };
            const res = await projectService.saveProjectInfo(id, request);
            toast.success('Lưu thông tin thành công!');
            setInfo(res.data.data);
            if (project) setProject({ ...project, hasProjectInfo: true });
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Lưu thất bại');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ p: 3 }}>
                <Skeleton variant="text" width={250} height={40} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
            </Box>
        );
    }

    if (!project) return null;

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: 'auto' }}>
            {/* Header & Breadcrumbs */}
            <Box sx={{ mb: 4 }}>
                <Breadcrumbs sx={{ mb: 2 }}>
                    <Link component="button" variant="body2" underline="hover" color="inherit" onClick={() => navigate('/lecturer/classes')}>
                        Lớp học
                    </Link>
                    <Link component="button" variant="body2" underline="hover" color="inherit" onClick={() => navigate(`/lecturer/classes/${project.classId}`)}>
                        {project.className}
                    </Link>
                    <Link component="button" variant="body2" underline="hover" color="inherit" onClick={() => navigate(`/lecturer/classes/${project.classId}/projects`)}>
                        Projects
                    </Link>
                    <Typography color="text.primary" variant="body2">
                        {project.projectName}
                    </Typography>
                </Breadcrumbs>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton onClick={() => navigate(-1)}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1E293B' }}>
                                Thông tin chi tiết: {project.projectName}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                                Nhóm phụ trách: {project.groupName}
                            </Typography>
                        </Box>
                    </Box>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={saving}
                        sx={{ px: 4, py: 1.2, borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
                    >
                        {saving ? 'Đang lưu...' : 'Lưu thông tin'}
                    </Button>
                </Box>
            </Box>

            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 24px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                        Thông tin chi tiết Project
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                        Điền các thông tin cơ bản về project. Thông tin này sẽ được sử dụng để tạo tài liệu đặc tả yêu cầu (SRS) sau này.
                    </Typography>

                    <Grid container spacing={4}>
                        <Grid item xs={12}>
                            <TextField
                                label="Tên Đề tài (Topic)"
                                fullWidth
                                variant="outlined"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="Ví dụ: Nền tảng học trực tuyến"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                label="Bối cảnh & Mục tiêu (Context & Objectives)"
                                fullWidth
                                multiline
                                minRows={3}
                                variant="outlined"
                                value={context}
                                onChange={(e) => setContext(e.target.value)}
                                placeholder="Tại sao lại làm dự án này? Hệ thống giải quyết mục tiêu kinh doanh/xã hội gì?"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                label="Vấn đề hiện tại (Problems)"
                                fullWidth
                                multiline
                                minRows={3}
                                variant="outlined"
                                value={problems}
                                onChange={(e) => setProblems(e.target.value)}
                                placeholder="Ghi rõ các vấn đề thực tiễn mà giải pháp này sẽ giải quyết..."
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Divider sx={{ my: 1 }} />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                label="Đối tượng sử dụng (Primary Actors)"
                                fullWidth
                                multiline
                                minRows={2}
                                variant="outlined"
                                value={primaryActors}
                                onChange={(e) => setPrimaryActors(e.target.value)}
                                placeholder="Ví dụ: Admin, Giảng viên, Sinh viên, Khách hàng..."
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                label="Yêu cầu chức năng cốt lõi (Core Functional Requirements)"
                                fullWidth
                                multiline
                                minRows={5}
                                variant="outlined"
                                value={functionalRequirements}
                                onChange={(e) => setFunctionalRequirements(e.target.value)}
                                placeholder="- Chức năng 1: Đăng nhập/Đăng ký&#10;- Chức năng 2: Quản lý khóa học&#10;- Chức năng 3: Thanh toán..."
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Grid>
                    </Grid>

                    {info?.updatedAt && (
                        <Typography variant="caption" display="block" color="text.disabled" sx={{ mt: 4, textAlign: 'right' }}>
                            Cập nhật lần cuối: {new Date(info.updatedAt).toLocaleString('vi-VN')}
                        </Typography>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};

export default ProjectInfo;
