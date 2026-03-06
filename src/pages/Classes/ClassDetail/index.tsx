import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Tabs, Tab, Alert, Skeleton,
    Breadcrumbs, Link,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PeopleIcon from '@mui/icons-material/People';
import GroupsIcon from '@mui/icons-material/Groups';
import { useClassDetail } from '../../../hooks/useClassDetail';
import StudentsTab from './tabs/StudentsTab';
import GroupsTab from './tabs/GroupsTab';

const ClassDetail: React.FC = () => {
    const { classId } = useParams<{ classId: string }>();
    const navigate = useNavigate();
    const [tabIndex, setTabIndex] = useState(0);

    const id = Number(classId);
    const { students, groups, projects, loading, error, refresh } = useClassDetail(id);

    const pageTitle = `Chi tiết lớp học`;


    if (loading) {
        return (
            <Box>
                <Skeleton height={40} width={300} sx={{ mb: 1 }} />
                <Skeleton height={50} sx={{ mb: 2 }} />
                <Skeleton height={400} />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>;
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Breadcrumbs sx={{ mb: 1 }}>
                    <Link underline="hover" color="inherit" sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5 }}
                        onClick={() => navigate(-1)}>
                        <ArrowBackIcon fontSize="small" />
                        Quản lý lớp học
                    </Link>
                    <Typography color="text.primary" fontWeight={500}>{pageTitle}</Typography>
                </Breadcrumbs>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                    <Typography variant="h4" fontWeight={700}>{pageTitle}</Typography>
                </Box>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)}>
                    <Tab icon={<PeopleIcon />} iconPosition="start" label={`Sinh viên (${students.length})`}
                        sx={{ textTransform: 'none', fontWeight: 600 }} />
                    <Tab icon={<GroupsIcon />} iconPosition="start" label={`Nhóm (${groups.length})`}
                        sx={{ textTransform: 'none', fontWeight: 600 }} />
                </Tabs>
            </Box>

            {/* Tab Content */}
            {tabIndex === 0 && (
                <StudentsTab
                    classId={id}
                    students={students}
                    groups={groups}
                    projects={projects}
                    onRefresh={refresh}
                />
            )}
            {tabIndex === 1 && (
                <GroupsTab
                    classId={id}
                    groups={groups}
                    projects={projects}
                    students={students}
                    onRefresh={refresh}
                />
            )}
        </Box>
    );
};

export default ClassDetail;
