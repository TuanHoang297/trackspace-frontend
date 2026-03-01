import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Typography, Button, Container, Grid,
} from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import BarChartIcon from '@mui/icons-material/BarChart';
import GroupsIcon from '@mui/icons-material/Groups';
import DescriptionIcon from '@mui/icons-material/Description';
import SyncIcon from '@mui/icons-material/Sync';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

const FEATURES = [
  { icon: <IntegrationInstructionsIcon sx={{ fontSize: 26 }} />, title: 'Jira Integration', desc: 'Kết nối Jira Cloud, quản lý sprint và issues trực tiếp.', color: '#3B82F6', bg: '#EFF6FF' },
  { icon: <SyncIcon sx={{ fontSize: 26 }} />, title: 'GitHub Tracking', desc: 'Theo dõi commits, phân tích đóng góp code.', color: '#8B5CF6', bg: '#F5F3FF' },
  { icon: <BarChartIcon sx={{ fontSize: 26 }} />, title: 'Phân tích đóng góp', desc: 'Tính điểm đóng góp tự động dựa trên dữ liệu thực.', color: '#10B981', bg: '#ECFDF5' },
  { icon: <DescriptionIcon sx={{ fontSize: 26 }} />, title: 'AI-Powered SRS', desc: 'Tạo tài liệu SRS chuyên nghiệp tự động bằng AI.', color: '#F59E0B', bg: '#FFFBEB' },
  { icon: <GroupsIcon sx={{ fontSize: 26 }} />, title: 'Quản lý nhóm', desc: 'Tổ chức sinh viên, phân quyền và quản lý dự án.', color: '#EC4899', bg: '#FDF2F8' },
  { icon: <RocketLaunchIcon sx={{ fontSize: 26 }} />, title: 'Real-time Sync', desc: 'Đồng bộ tự động theo thời gian thực.', color: '#06B6D4', bg: '#ECFEFF' },
];

const STEPS = [
  { num: '01', title: 'Tạo lớp học', desc: 'Admin tạo lớp, import sinh viên, giảng viên phân nhóm.' },
  { num: '02', title: 'Kết nối công cụ', desc: 'Team Leader kết nối Jira và GitHub qua API token.' },
  { num: '03', title: 'Theo dõi tiến độ', desc: 'Monitor sprint, tasks, commits theo thời gian thực.' },
  { num: '04', title: 'Phân tích & Báo cáo', desc: 'Xem analytics đóng góp, tạo SRS document bằng AI.' },
];

/* ── Light mode tokens ── */
const BG = '#F8FAFC';
const WHITE = '#FFFFFF';
const BORDER = '#E2E8F0';
const TEXT = '#1E293B';
const DIM = '#64748B';
const ACCENT = '#3B82F6';
const GRAD = 'linear-gradient(135deg, #3B82F6, #8B5CF6)';
const CTA = 'linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)';

const LandingPage: React.FC = () => {
  return (
    <Box sx={{ bgcolor: BG, color: TEXT, minHeight: '100vh', fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* ─── Navbar ─── */}
      <Box component="nav" sx={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        bgcolor: 'rgba(248,250,252,0.9)', backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoAwesomeIcon sx={{ fontSize: 20, color: ACCENT }} />
              <Typography fontWeight={800} fontSize="1.1rem" sx={{
                background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                TrackSpace
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Button component={Link} to="/login" variant="outlined" size="small"
                sx={{ borderColor: BORDER, color: DIM, borderRadius: '10px', textTransform: 'none', fontWeight: 600, '&:hover': { borderColor: ACCENT, color: ACCENT } }}>
                Đăng nhập
              </Button>
              <Button component={Link} to="/login" variant="contained" size="small"
                sx={{ background: CTA, borderRadius: '10px', textTransform: 'none', fontWeight: 600, boxShadow: '0 2px 8px rgba(59,130,246,0.3)' }}>
                Bắt đầu
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ─── Hero ─── */}
      <Box sx={{ pt: 18, pb: 14, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Soft gradient blobs */}
        <Box sx={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: 700, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <Container maxWidth="md">
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 1, mb: 3,
            bgcolor: '#EFF6FF', border: '1px solid #BFDBFE',
            borderRadius: '20px', px: 2, py: 0.75,
          }}>
            <AutoAwesomeIcon sx={{ fontSize: 14, color: ACCENT }} />
            <Typography variant="caption" sx={{ color: ACCENT, fontWeight: 600, fontSize: '0.78rem' }}>
              Nền tảng quản lý dự án sinh viên
            </Typography>
          </Box>

          <Typography variant="h2" fontWeight={800} sx={{
            fontSize: { xs: '2.2rem', md: '3.2rem' }, lineHeight: 1.15,
            color: TEXT, mb: 2.5, letterSpacing: '-0.04em',
          }}>
            Quản lý dự án{' '}
            <Box component="span" sx={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              sinh viên
            </Box>
            {' '}thông minh
          </Typography>

          <Typography variant="h6" sx={{ color: DIM, fontWeight: 400, mb: 5, maxWidth: 520, mx: 'auto', lineHeight: 1.7, fontSize: '1rem' }}>
            Tích hợp Jira, GitHub, AI — một nền tảng duy nhất giúp giảng viên và sinh viên quản lý dự án hiệu quả.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              component={Link} to="/login" variant="contained" size="large"
              sx={{
                background: CTA, px: 4, py: 1.5, borderRadius: '14px',
                textTransform: 'none', fontWeight: 700, fontSize: '0.95rem',
                boxShadow: '0 4px 20px rgba(59,130,246,0.35)',
                '&:hover': { boxShadow: '0 6px 28px rgba(59,130,246,0.5)', transform: 'translateY(-1px)' },
                transition: 'all 0.2s ease',
              }}>
              Bắt đầu miễn phí
            </Button>
            <Button
              variant="outlined" size="large"
              sx={{
                borderColor: BORDER, color: DIM, px: 4, py: 1.5, borderRadius: '14px',
                textTransform: 'none', fontWeight: 600, fontSize: '0.95rem',
                '&:hover': { borderColor: ACCENT, color: ACCENT, bgcolor: '#EFF6FF' },
              }}>
              Xem demo
            </Button>
          </Box>
        </Container>
      </Box>

      {/* ─── Stats ─── */}
      <Box sx={{ bgcolor: WHITE, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, py: 5 }}>
        <Container maxWidth="md">
          <Grid container spacing={4} justifyContent="center">
            {[
              { val: '500+', label: 'Sinh viên' },
              { val: '50+', label: 'Lớp học' },
              { val: '1,200+', label: 'Dự án' },
              { val: '4.8★', label: 'Đánh giá' },
            ].map(s => (
              <Grid item xs={6} sm={3} key={s.label} sx={{ textAlign: 'center' }}>
                <Typography fontWeight={800} fontSize="1.8rem" sx={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.val}</Typography>
                <Typography variant="caption" sx={{ color: DIM, fontWeight: 500 }}>{s.label}</Typography>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ─── Features ─── */}
      <Box sx={{ py: 12 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 7 }}>
            <Typography variant="h4" fontWeight={800} sx={{ color: TEXT, mb: 1.5, letterSpacing: '-0.03em' }}>
              Tất cả trong một nền tảng
            </Typography>
            <Typography sx={{ color: DIM, maxWidth: 480, mx: 'auto', lineHeight: 1.7 }}>
              Từ quản lý nhóm đến phân tích đóng góp — TrackSpace có tất cả.
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {FEATURES.map((f) => (
              <Grid item xs={12} sm={6} md={4} key={f.title}>
                <Box sx={{
                  bgcolor: WHITE, border: `1px solid ${BORDER}`, borderRadius: '16px',
                  p: 3, height: '100%',
                  transition: 'all 0.2s ease',
                  '&:hover': { borderColor: f.color, boxShadow: `0 4px 20px ${f.color}18`, transform: 'translateY(-2px)' },
                }}>
                  <Box sx={{
                    width: 44, height: 44, borderRadius: '12px', bgcolor: f.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: f.color, mb: 2,
                  }}>
                    {f.icon}
                  </Box>
                  <Typography fontWeight={700} sx={{ color: TEXT, mb: 0.75, fontSize: '0.95rem' }}>{f.title}</Typography>
                  <Typography variant="body2" sx={{ color: DIM, lineHeight: 1.6 }}>{f.desc}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ─── How it works ─── */}
      <Box sx={{ bgcolor: WHITE, borderTop: `1px solid ${BORDER}`, py: 12 }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 7 }}>
            <Typography variant="h4" fontWeight={800} sx={{ color: TEXT, letterSpacing: '-0.03em' }}>
              Bắt đầu chỉ trong 4 bước
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {STEPS.map((s, i) => (
              <Grid item xs={12} sm={6} key={s.num}>
                <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
                  <Typography fontWeight={800} fontSize="2rem" sx={{
                    background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    lineHeight: 1, flexShrink: 0,
                  }}>
                    {s.num}
                  </Typography>
                  <Box>
                    <Typography fontWeight={700} sx={{ color: TEXT, mb: 0.5 }}>{s.title}</Typography>
                    <Typography variant="body2" sx={{ color: DIM, lineHeight: 1.6 }}>{s.desc}</Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ─── CTA ─── */}
      <Box sx={{ py: 14, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <Container maxWidth="sm" sx={{ position: 'relative' }}>
          <Typography variant="h4" fontWeight={800} sx={{ color: TEXT, mb: 2, letterSpacing: '-0.03em' }}>
            Sẵn sàng bắt đầu?
          </Typography>
          <Typography sx={{ color: DIM, mb: 4, lineHeight: 1.7 }}>
            Tham gia cùng hàng trăm sinh viên và giảng viên đang dùng TrackSpace.
          </Typography>
          <Button
            component={Link} to="/login" variant="contained" size="large"
            sx={{
              background: CTA, px: 5, py: 1.5, borderRadius: '14px',
              textTransform: 'none', fontWeight: 700, fontSize: '1rem',
              boxShadow: '0 4px 20px rgba(59,130,246,0.35)',
              '&:hover': { boxShadow: '0 8px 30px rgba(59,130,246,0.5)', transform: 'translateY(-1px)' },
            }}>
            Đăng nhập ngay
          </Button>
        </Container>
      </Box>

      {/* ─── Footer ─── */}
      <Box sx={{ bgcolor: WHITE, borderTop: `1px solid ${BORDER}`, py: 4, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: DIM }}>
          © 2026 TrackSpace. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default LandingPage;
