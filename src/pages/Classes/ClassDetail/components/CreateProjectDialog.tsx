import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, TextField, FormControl, InputLabel, Select, MenuItem, Chip,
    Typography, Divider, Stepper, Step, StepLabel,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import { toast } from 'react-toastify';
import projectService from '../../../../api/services/projectService';
import type { GroupResponse } from '../../../../types/group.types';
import type { ProjectResponse } from '../../../../types/project.types';

interface Props {
    open: boolean;
    groups: GroupResponse[];
    projects: ProjectResponse[];
    onClose: () => void;
    onCreated: () => void;
}

const steps = ['Thông tin cơ bản', 'Chi tiết đề tài'];

const CreateProjectDialog: React.FC<Props> = ({ open, groups, projects, onClose, onCreated }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [groupId, setGroupId] = useState<number | ''>('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    // Project Info fields
    const [topic, setTopic] = useState('');
    const [context, setContext] = useState('');
    const [problems, setProblems] = useState('');
    const [primaryActors, setPrimaryActors] = useState('');
    const [functionalRequirements, setFunctionalRequirements] = useState('');

    const availableGroups = groups.filter(g => !projects.some(p => p.groupId === g.id));

    const reset = () => {
        setActiveStep(0); setGroupId(''); setName('');
        setTopic(''); setContext(''); setProblems('');
        setPrimaryActors(''); setFunctionalRequirements('');
    };

    const handleClose = () => { reset(); onClose(); };

    const handleNext = () => {
        if (!groupId || !name) {
            toast.error('Vui lòng chọn nhóm và nhập tên project');
            return;
        }
        setActiveStep(1);
    };

    const handleBack = () => setActiveStep(0);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            // Step 1: Create the project
            const res = await projectService.createProject(groupId as number, { projectName: name });
            const projectId = res.data.data.id;

            // Step 2: Save project info if any field is filled
            const hasInfo = topic || context || problems || primaryActors || functionalRequirements;
            if (hasInfo) {
                await projectService.saveProjectInfo(projectId, {
                    topic, context, problems, primaryActors, functionalRequirements,
                });
            }

            toast.success('Tạo project thành công!');
            reset();
            onCreated();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Tạo project thất bại');
        } finally {
            setLoading(false);
        }
    };

    const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Tạo Project mới</DialogTitle>
            <DialogContent>
                <Stepper activeStep={activeStep} sx={{ mt: 1, mb: 3 }} alternativeLabel>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {activeStep === 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <FormControl fullWidth>
                            <InputLabel>Chọn nhóm</InputLabel>
                            <Select value={groupId} label="Chọn nhóm"
                                onChange={(e) => setGroupId(e.target.value as number)} sx={{ borderRadius: 2 }}>
                                {availableGroups.map(g => (
                                    <MenuItem key={g.id} value={g.id}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                            <GroupsIcon fontSize="small" color="action" />
                                            {g.groupName}
                                            <Chip label={`${g.totalMembers} thành viên`} size="small" sx={{ ml: 'auto' }} />
                                        </Box>
                                    </MenuItem>
                                ))}
                                {availableGroups.length === 0 && <MenuItem disabled>Tất cả nhóm đã có project</MenuItem>}
                            </Select>
                        </FormControl>
                        <TextField label="Tên Project" fullWidth value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ví dụ: Hệ thống quản lý bán hàng"
                            sx={fieldSx} />
                    </Box>
                )}

                {activeStep === 1 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: -1 }}>
                            Điền thông tin chi tiết đề tài. Có thể bỏ qua và điền sau.
                        </Typography>

                        <TextField label="Tên Đề tài (Topic)" fullWidth value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Ví dụ: Nền tảng học trực tuyến"
                            sx={fieldSx} />

                        <TextField label="Bối cảnh & Mục tiêu" fullWidth multiline minRows={2}
                            value={context} onChange={(e) => setContext(e.target.value)}
                            placeholder="Tại sao lại làm dự án này?"
                            sx={fieldSx} />

                        <TextField label="Vấn đề hiện tại" fullWidth multiline minRows={2}
                            value={problems} onChange={(e) => setProblems(e.target.value)}
                            placeholder="Các vấn đề thực tiễn cần giải quyết..."
                            sx={fieldSx} />

                        <Divider />

                        <TextField label="Đối tượng sử dụng" fullWidth multiline minRows={2}
                            value={primaryActors} onChange={(e) => setPrimaryActors(e.target.value)}
                            placeholder="Admin, Giảng viên, Sinh viên..."
                            sx={fieldSx} />

                        <TextField label="Yêu cầu chức năng cốt lõi" fullWidth multiline minRows={3}
                            value={functionalRequirements} onChange={(e) => setFunctionalRequirements(e.target.value)}
                            placeholder="- Chức năng 1: Đăng nhập&#10;- Chức năng 2: Quản lý..."
                            sx={fieldSx} />
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button onClick={handleClose} sx={{ textTransform: 'none', borderRadius: 2 }}>Hủy</Button>
                {activeStep === 1 && (
                    <Button onClick={handleBack} sx={{ textTransform: 'none', borderRadius: 2 }}>Quay lại</Button>
                )}
                {activeStep === 0 ? (
                    <Button variant="contained" onClick={handleNext}
                        disabled={!groupId || !name} sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}>
                        Tiếp theo
                    </Button>
                ) : (
                    <Button variant="contained" onClick={handleSubmit}
                        disabled={loading} sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}>
                        {loading ? 'Đang tạo...' : 'Tạo Project'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default CreateProjectDialog;
