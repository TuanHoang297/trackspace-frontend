import React from 'react';
import { Box, TextField, Collapse } from '@mui/material';

interface SrsSupplementFormProps {
    show: boolean;
    businessRules: string;
    setBusinessRules: (v: string) => void;
    nonScreenFunctions: string;
    setNonScreenFunctions: (v: string) => void;
    /** 'empty' = vertical layout (empty state), 'inline' = horizontal layout (header collapse) */
    variant?: 'empty' | 'inline';
}

const SrsSupplementForm: React.FC<SrsSupplementFormProps> = ({
    show, businessRules, setBusinessRules, nonScreenFunctions, setNonScreenFunctions, variant = 'empty'
}) => {
    if (variant === 'inline') {
        return (
            <Collapse in={show}>
                <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #E2E8F0', bgcolor: '#FAFBFF' }}>
                    <Box sx={{ display: 'flex', gap: 2, maxWidth: 900, mx: 'auto' }}>
                        <TextField
                            label="Business Rules"
                            placeholder="Mỗi dòng 1 rule, VD: Email phải @fpt.edu.vn"
                            multiline rows={2}
                            value={businessRules}
                            onChange={(e) => setBusinessRules(e.target.value)}
                            size="small" fullWidth
                            sx={{ bgcolor: 'white' }}
                        />
                        <TextField
                            label="Non-Screen Functions"
                            placeholder="VD: Auto-sync Jira mỗi 30 phút"
                            multiline rows={2}
                            value={nonScreenFunctions}
                            onChange={(e) => setNonScreenFunctions(e.target.value)}
                            size="small" fullWidth
                            sx={{ bgcolor: 'white' }}
                        />
                    </Box>
                </Box>
            </Collapse>
        );
    }

    return (
        <Collapse in={show}>
            <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                    label="Business Rules"
                    placeholder="Mỗi dòng 1 rule, VD: Email phải @fpt.edu.vn"
                    multiline rows={3}
                    value={businessRules}
                    onChange={(e) => setBusinessRules(e.target.value)}
                    size="small" sx={{ bgcolor: 'white' }}
                />
                <TextField
                    label="Non-Screen Functions"
                    placeholder="VD: Auto-sync Jira mỗi 30 phút, Webhook nhận update"
                    multiline rows={3}
                    value={nonScreenFunctions}
                    onChange={(e) => setNonScreenFunctions(e.target.value)}
                    size="small" sx={{ bgcolor: 'white' }}
                />
            </Box>
        </Collapse>
    );
};

export default SrsSupplementForm;
