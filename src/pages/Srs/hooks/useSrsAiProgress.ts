import { useState, useEffect } from 'react';

const AI_STAGES = [
    { at: 0,  label: 'Đang phân tích dữ liệu project và Jira...' },
    { at: 6,  label: 'AI đang nghiên cứu yêu cầu nghiệp vụ...' },
    { at: 12, label: 'Đang xây dựng cấu trúc SRS...' },
    { at: 18, label: 'Đang sinh nội dung Use Cases & Functions...' },
    { at: 22, label: 'Đang hoàn thiện tài liệu...' },
    { at: 26, label: 'Sắp xong rồi, đang kiểm tra nội dung...' },
];

export const ESTIMATED_SECONDS = 35;

export function useSrsAiProgress(isPending: boolean) {
    const [aiProgress, setAiProgress] = useState(0);
    const [aiStage, setAiStage] = useState('');
    const [aiElapsed, setAiElapsed] = useState(0);

    useEffect(() => {
        if (!isPending) {
            setAiProgress(0);
            setAiElapsed(0);
            setAiStage('');
            return;
        }
        setAiProgress(0);
        setAiElapsed(0);
        setAiStage(AI_STAGES[0].label);
        const start = Date.now();
        const timer = setInterval(() => {
            const elapsed = (Date.now() - start) / 1000;
            setAiElapsed(Math.floor(elapsed));
            const raw = (elapsed / ESTIMATED_SECONDS) * 97;
            setAiProgress(Math.min(raw, 97));
            const stage = [...AI_STAGES].reverse().find(s => elapsed >= s.at);
            if (stage) setAiStage(stage.label);
        }, 500);
        return () => clearInterval(timer);
    }, [isPending]);

    return { aiProgress, aiStage, aiElapsed };
}
