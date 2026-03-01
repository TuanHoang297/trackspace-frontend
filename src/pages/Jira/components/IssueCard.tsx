import React from 'react';
import {
    Card, CardActionArea, Box, Typography, Chip, Avatar, Tooltip,
} from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
import type { JiraIssueResponse, IssueType } from '../../../types/jira.types';

const TYPE_CONFIG: Record<IssueType, { icon: React.ReactElement; color: string }> = {
    EPIC: { icon: <AccountTreeIcon fontSize="small" />, color: '#6554C0' },
    STORY: { icon: <AutoStoriesIcon fontSize="small" />, color: '#36B37E' },
    TASK: { icon: <TaskAltIcon fontSize="small" />, color: '#0065FF' },
    BUG: { icon: <BugReportIcon fontSize="small" />, color: '#FF5630' },
    SUBTASK: { icon: <SubdirectoryArrowRightIcon fontSize="small" />, color: '#6B778C' },
};

const PRIORITY_COLOR: Record<string, string> = {
    Highest: '#FF5630',
    High: '#FF7452',
    Medium: '#FFAB00',
    Low: '#36B37E',
    Lowest: '#6B778C',
};

interface Props {
    issue: JiraIssueResponse;
    onClick: (issue: JiraIssueResponse) => void;
}

const IssueCard: React.FC<Props> = ({ issue, onClick }) => {
    const typeConfig = TYPE_CONFIG[issue.issueType] || TYPE_CONFIG.TASK;
    const priorityColor = PRIORITY_COLOR[issue.priority] || '#6B778C';
    const initials = issue.assigneeName
        ? issue.assigneeName.split(' ').map(n => n[0]).join('').slice(0, 2)
        : '';

    const isOverdue = issue.dueDate && new Date(issue.dueDate) < new Date() && issue.status !== 'Done';

    return (
        <Card
            elevation={0}
            sx={{
                mb: 1,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                transition: 'all 0.15s ease',
                '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: '0 2px 8px rgba(0,101,255,0.12)',
                    transform: 'translateY(-1px)',
                },
            }}
        >
            <CardActionArea onClick={() => onClick(issue)} sx={{ p: 1.5 }}>
                {/* Issue Key + Type */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
                    <Tooltip title={issue.issueType}>
                        <Box sx={{ color: typeConfig.color, display: 'flex', alignItems: 'center' }}>
                            {typeConfig.icon}
                        </Box>
                    </Tooltip>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {issue.issueKey}
                    </Typography>
                </Box>

                {/* Summary */}
                <Typography
                    variant="body2"
                    fontWeight={500}
                    sx={{
                        mb: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.4,
                    }}
                >
                    {issue.summary}
                </Typography>

                {/* Footer: Status + Priority + Assignee */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                        {/* Status chip */}
                        <Chip
                            label={issue.status}
                            size="small"
                            sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                bgcolor: issue.status === 'Done' ? '#E3FCEF'
                                    : issue.status === 'In Progress' ? '#DEEBFF'
                                        : '#DFE1E6',
                                color: issue.status === 'Done' ? '#006644'
                                    : issue.status === 'In Progress' ? '#0052CC'
                                        : '#42526E',
                            }}
                        />
                        {/* Priority chip */}
                        <Chip
                            label={issue.priority}
                            size="small"
                            sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                bgcolor: `${priorityColor}14`,
                                color: priorityColor,
                                border: `1px solid ${priorityColor}30`,
                            }}
                        />
                        {isOverdue && (
                            <Chip
                                label="Overdue"
                                size="small"
                                sx={{
                                    height: 20,
                                    fontSize: '0.65rem',
                                    fontWeight: 600,
                                    bgcolor: '#FF563014',
                                    color: '#FF5630',
                                }}
                            />
                        )}
                    </Box>

                    {/* Assignee avatar — always show */}
                    <Tooltip title={issue.assigneeName || 'Chưa phân công'}>
                        <Avatar
                            sx={{
                                width: 24,
                                height: 24,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                bgcolor: issue.assigneeName ? typeConfig.color : '#DFE1E6',
                                color: issue.assigneeName ? '#fff' : '#6B778C',
                            }}
                        >
                            {initials || '?'}
                        </Avatar>
                    </Tooltip>
                </Box>
            </CardActionArea>
        </Card>
    );
};

export default IssueCard;
