import React from 'react';
import { Dialog } from '@mui/material';
import type { ContributionResponse } from '../../../types/contribution.types';
import MemberDashboardView, { TeamAverages } from './MemberDashboardView';

interface MemberDetailDrawerProps {
    open: boolean;
    onClose: () => void;
    member: ContributionResponse | null;
    projectId: number;
    rank: number;
    contributionPercent: number;
    teamAverages: TeamAverages;
}

const MemberDetailDrawer: React.FC<MemberDetailDrawerProps> = ({
    open, onClose, member, projectId, rank, contributionPercent, teamAverages,
}) => {
    if (!member) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={false}
            PaperProps={{
                sx: {
                    width: '85%', maxWidth: 960,
                    height: '90vh',
                    borderRadius: 4, overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '0 32px 64px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)',
                },
            }}
        >
            <MemberDashboardView
                member={member}
                projectId={projectId}
                rank={rank}
                contributionPercent={contributionPercent}
                teamAverages={teamAverages}
                onClose={onClose}
                isModal={true}
            />
        </Dialog>
    );
};

export default MemberDetailDrawer;
