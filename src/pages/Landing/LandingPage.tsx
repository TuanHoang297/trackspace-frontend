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

/* ═══════════════════════════════════════════════════════
   TrackSpace Landing — Premium Dark Theme
   ═══════════════════════════════════════════════════════ */

const FEATURES = [
  { icon: <IntegrationInstructionsIcon sx={{ fontSize: 28 }} />, title: 'Jira Integration', desc: 'Kết nối Jira Cloud, quản lý sprint và issues trực tiếp.', color: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6, #2563EB)' },
  { icon: <SyncIcon sx={{ fontSize: 28 }} />, title: 'GitHub Tracking', desc: 'Theo dõi commits, phân tích đóng góp code.', color: '#8B5CF6', gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' },
  { icon: <BarChartIcon sx={{ fontSize: 28 }} />, title: 'Phân tích đóng góp', desc: 'Tính điểm đóng góp tự động dựa trên dữ liệu thực.', color: '#10B981', gradient: 'linear-gradient(135deg, #10B981, #059669)' },
  { icon: <DescriptionIcon sx={{ fontSize: 28 }} />, title: 'AI-Powered SRS', desc: 'Tạo tài liệu SRS chuyên nghiệp tự động bằng AI.', color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B, #D97706)' },
  { icon: <GroupsIcon sx={{ fontSize: 28 }} />, title: 'Quản lý nhóm', desc: 'Tổ chức sinh viên, phân quyền và quản lý dự án.', color: '#EC4899', gradient: 'linear-gradient(135deg, #EC4899, #DB2777)' },
  { icon: <RocketLaunchIcon sx={{ fontSize: 28 }} />, title: 'Real-time Sync', desc: 'Đồng bộ tự động theo thời gian thực.', color: '#06B6D4', gradient: 'linear-gradient(135deg, #06B6D4, #0891B2)' },
];

const STEPS = [
  { num: '01', title: 'Tạo lớp học', desc: 'Admin tạo lớp, import sinh viên, giảng viên phân nhóm.' },
  { num: '02', title: 'Kết nối công cụ', desc: 'Team Leader kết nối Jira và GitHub qua API token.' },
  { num: '03', title: 'Theo dõi tiến độ', desc: 'Monitor sprint, tasks, commits theo thời gian thực.' },
  { num: '04', title: 'Phân tích & Báo cáo', desc: 'Xem analytics đóng góp, tạo SRS document bằng AI.' },
];

/* ── Color tokens ── */
const BG_DARK = '#0B1120';
const BG_CARD = 'rgba(255,255,255,0.04)';
const BG_ELEVATED = 'rgba(255,255,255,0.06)';
const GLASS_BORDER = 'rgba(255,255,255,0.08)';
const TEXT_WHITE = '#F1F5F9';
const TEXT_DIM = '#94A3B8';
const ACCENT = '#3B82F6';
const ACCENT_GRAD = 'linear-gradient(135deg, #3B82F6, #8B5CF6)';
const CTA_GRAD = 'linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)';
const GLOW_BLUE = 'rgba(59,130,246,0.15)';
const GLOW_PURPLE = 'rgba(139,92,246,0.12)';

const LandingPage: React.FC = () => {
  return (
    <Box sx={{
      bgcolor: BG_DARK,
      color: TEXT_WHITE,
      minHeight: '100vh',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      {/* ─── Navbar ─── */}
      <Box component="nav" sx={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        bgcolor: 'rgba(11,17,32,0.8)', backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${GLASS_BORDER}`,
      }}>
        <Container maxWidth="lg" sx={{
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesomeIcon sx={{ color: ACCENT, fontSize: 22 }} />
            <Typography variant="h6" fontWeight={800} sx={{
              letterSpacing: '-0.03em',
              background: ACCENT_GRAD,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              TrackSpace
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box component="a" href="#features" sx={{
              textDecoration: 'none', color: TEXT_DIM, fontSize: 14, fontWeight: 500,
              transition: 'color 0.2s',
              '&:hover': { color: TEXT_WHITE },
            }}>
              Tính năng
            </Box>
            <Box component="a" href="#how-it-works" sx={{
              textDecoration: 'none', color: TEXT_DIM, fontSize: 14, fontWeight: 500,
              transition: 'color 0.2s',
              '&:hover': { color: TEXT_WHITE },
            }}>
              Cách hoạt động
            </Box>
            <Button component={Link} to="/login" variant="contained" size="small"
              sx={{
                textTransform: 'none', fontWeight: 600, borderRadius: '10px',
                background: CTA_GRAD,
                border: `1px solid rgba(255,255,255,0.1)`,
                px: 2.5,
                boxShadow: '0 0 20px rgba(59,130,246,0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 50%, #7C3AED 100%)',
                  boxShadow: '0 0 30px rgba(59,130,246,0.5)',
                },
              }}>
              Đăng nhập
            </Button>
          </Box>
        </Container>
      </Box>

      {/* ─── Hero ─── */}
      <Box sx={{ pt: 18, pb: 12, position: 'relative', overflow: 'hidden' }}>
        {/* Background glows */}
        <Box sx={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          background: `radial-gradient(circle, ${GLOW_BLUE} 0%, transparent 70%)`,
          top: -150, left: '30%', transform: 'translateX(-50%)',
          filter: 'blur(40px)',
        }} />
        <Box sx={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: `radial-gradient(circle, ${GLOW_PURPLE} 0%, transparent 70%)`,
          top: -50, right: '-5%',
          filter: 'blur(60px)',
        }} />
        {/* Grid pattern overlay */}
        <Box sx={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }} />

        <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative' }}>

          <Typography variant="h2" fontWeight={900} sx={{
            mb: 3, lineHeight: 1.1, letterSpacing: '-0.04em',
            fontSize: { xs: '2.5rem', md: '3.5rem' },
          }}>
            Quản lý dự án sinh viên{' '}
            <Box component="span" sx={{
              background: CTA_GRAD,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              thông minh hơn
            </Box>
          </Typography>
          <Typography variant="h6" sx={{
            mb: 5, color: TEXT_DIM, fontWeight: 400,
            maxWidth: 560, mx: 'auto', lineHeight: 1.7,
            fontSize: { xs: '1rem', md: '1.15rem' },
          }}>
            Tích hợp Jira & GitHub để theo dõi tiến độ, phân tích đóng góp và tạo tài liệu SRS tự động bằng AI.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button component={Link} to="/login" variant="contained" size="large"
              sx={{
                px: 4, py: 1.5, fontWeight: 700, borderRadius: '12px', textTransform: 'none', fontSize: '1rem',
                background: CTA_GRAD,
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(59,130,246,0.4), 0 0 0 1px rgba(59,130,246,0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 50%, #7C3AED 100%)',
                  boxShadow: '0 12px 40px rgba(59,130,246,0.5), 0 0 0 1px rgba(59,130,246,0.2)',
                  transform: 'translateY(-2px)',
                },
              }}>
              Bắt đầu ngay
            </Button>
            <Button href="#features" variant="outlined" size="large"
              sx={{
                px: 4, py: 1.5, fontWeight: 600, borderRadius: '12px', textTransform: 'none', fontSize: '1rem',
                borderColor: GLASS_BORDER, color: TEXT_DIM,
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: ACCENT,
                  color: TEXT_WHITE,
                  bgcolor: 'rgba(59,130,246,0.08)',
                  transform: 'translateY(-2px)',
                },
              }}>
              Tìm hiểu thêm
            </Button>
          </Box>

          {/* Stats */}
          <Box sx={{
            display: 'flex', justifyContent: 'center', gap: { xs: 4, md: 8 }, mt: 8,
            py: 3, px: 4, borderRadius: '16px',
            bgcolor: BG_CARD, border: `1px solid ${GLASS_BORDER}`,
            backdropFilter: 'blur(10px)',
            maxWidth: 500, mx: 'auto',
          }}>
            {[['500+', 'Sinh viên'], ['50+', 'Dự án'], ['98%', 'Hài lòng']].map(([val, label]) => (
              <Box key={label} sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={900} sx={{
                  background: ACCENT_GRAD,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '1.5rem', md: '2rem' },
                }}>{val}</Typography>
                <Typography variant="body2" sx={{ color: TEXT_DIM, fontSize: '0.8rem' }}>{label}</Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ─── Features ─── */}
      <Box id="features" sx={{ py: 10, position: 'relative' }}>
        {/* Subtle glow */}
        <Box sx={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: `radial-gradient(circle, ${GLOW_BLUE} 0%, transparent 70%)`,
          top: '50%', left: -100, transform: 'translateY(-50%)',
          filter: 'blur(60px)',
        }} />

        <Container maxWidth="lg" sx={{ position: 'relative' }}>
          <Box sx={{ textAlign: 'center', mb: 7 }}>
            <Typography variant="overline" sx={{
              color: ACCENT, fontWeight: 700, letterSpacing: '0.15em',
              mb: 1.5, display: 'block',
            }}>
              TÍNH NĂNG
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{
              mb: 1.5, letterSpacing: '-0.02em',
              background: `linear-gradient(135deg, ${TEXT_WHITE} 0%, ${TEXT_DIM} 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Mọi thứ bạn cần để quản lý hiệu quả
            </Typography>
            <Typography variant="body1" sx={{ color: TEXT_DIM, maxWidth: 480, mx: 'auto' }}>
              Công cụ tích hợp mạnh mẽ dành cho sinh viên và giảng viên
            </Typography>
          </Box>

          <Grid container spacing={2.5}>
            {FEATURES.map(f => (
              <Grid item xs={12} sm={6} md={4} key={f.title}>
                <Box sx={{
                  p: 3.5, borderRadius: '16px',
                  bgcolor: BG_CARD,
                  border: `1px solid ${GLASS_BORDER}`,
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: BG_ELEVATED,
                    borderColor: `${f.color}40`,
                    transform: 'translateY(-4px)',
                    boxShadow: `0 20px 40px ${f.color}15`,
                  },
                }}>
                  <Box sx={{
                    width: 48, height: 48, borderRadius: '12px',
                    background: f.gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    mb: 2.5, color: '#fff',
                    boxShadow: `0 8px 24px ${f.color}30`,
                  }}>
                    {f.icon}
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.75, color: TEXT_WHITE }}>
                    {f.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: TEXT_DIM, lineHeight: 1.7 }}>
                    {f.desc}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ─── How it works ─── */}
      <Box id="how-it-works" sx={{
        py: 10, position: 'relative',
        bgcolor: 'rgba(255,255,255,0.02)',
        borderTop: `1px solid ${GLASS_BORDER}`,
        borderBottom: `1px solid ${GLASS_BORDER}`,
      }}>
        {/* Glow */}
        <Box sx={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: `radial-gradient(circle, ${GLOW_PURPLE} 0%, transparent 70%)`,
          bottom: -200, right: -100,
          filter: 'blur(80px)',
        }} />

        <Container maxWidth="md" sx={{ position: 'relative' }}>
          <Box sx={{ textAlign: 'center', mb: 7 }}>
            <Typography variant="overline" sx={{
              color: '#8B5CF6', fontWeight: 700, letterSpacing: '0.15em',
              mb: 1.5, display: 'block',
            }}>
              HƯỚNG DẪN
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{
              mb: 1.5, letterSpacing: '-0.02em',
              background: `linear-gradient(135deg, ${TEXT_WHITE} 0%, ${TEXT_DIM} 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Bắt đầu chỉ trong vài phút
            </Typography>
            <Typography variant="body1" sx={{ color: TEXT_DIM }}>
              4 bước đơn giản để quản lý dự án hiệu quả
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {STEPS.map((s, i) => (
              <Box key={s.num} sx={{
                display: 'flex', alignItems: 'flex-start', gap: 3,
                p: 3, borderRadius: '16px',
                bgcolor: BG_CARD,
                border: `1px solid ${GLASS_BORDER}`,
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: BG_ELEVATED,
                  borderColor: 'rgba(59,130,246,0.2)',
                  transform: 'translateX(4px)',
                },
              }}>
                <Box sx={{
                  minWidth: 48, height: 48, borderRadius: '12px',
                  background: i % 2 === 0 ? ACCENT_GRAD : 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: i % 2 === 0
                    ? '0 8px 24px rgba(59,130,246,0.3)'
                    : '0 8px 24px rgba(139,92,246,0.3)',
                }}>
                  <Typography variant="h6" fontWeight={900} sx={{ color: '#fff', fontSize: '1rem' }}>
                    {s.num}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: TEXT_WHITE, mb: 0.5 }}>
                    {s.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: TEXT_DIM, lineHeight: 1.7 }}>
                    {s.desc}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ─── CTA ─── */}
      <Box sx={{ py: 12, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Glows */}
        <Box sx={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          background: `radial-gradient(circle, ${GLOW_BLUE} 0%, transparent 60%)`,
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          filter: 'blur(60px)',
        }} />
        <Box sx={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: `radial-gradient(circle, ${GLOW_PURPLE} 0%, transparent 60%)`,
          bottom: -100, right: -50,
          filter: 'blur(40px)',
        }} />

        <Container maxWidth="sm" sx={{ position: 'relative' }}>
          <Box sx={{
            p: 5, borderRadius: '24px',
            bgcolor: BG_CARD,
            border: `1px solid ${GLASS_BORDER}`,
            backdropFilter: 'blur(20px)',
          }}>
            <Typography variant="h4" fontWeight={800} sx={{
              mb: 2, letterSpacing: '-0.02em',
              background: CTA_GRAD,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Sẵn sàng bắt đầu?
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: TEXT_DIM, lineHeight: 1.7 }}>
              Tham gia cùng hàng trăm sinh viên và giảng viên đang sử dụng TrackSpace để quản lý dự án hiệu quả hơn
            </Typography>
            <Button component={Link} to="/login" variant="contained" size="large"
              sx={{
                px: 5, py: 1.5, fontWeight: 700, borderRadius: '12px', textTransform: 'none', fontSize: '1.05rem',
                background: CTA_GRAD,
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(59,130,246,0.4)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 50%, #7C3AED 100%)',
                  boxShadow: '0 12px 40px rgba(59,130,246,0.5)',
                  transform: 'translateY(-2px)',
                },
              }}>
              ✨ Bắt đầu miễn phí
            </Button>
          </Box>
        </Container>
      </Box>

      {/* ─── Footer ─── */}
      <Box sx={{
        py: 3,
        borderTop: `1px solid ${GLASS_BORDER}`,
        bgcolor: 'rgba(255,255,255,0.02)',
      }}>
        <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesomeIcon sx={{ color: ACCENT, fontSize: 16 }} />
            <Typography variant="body2" fontWeight={700} sx={{
              background: ACCENT_GRAD,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              TrackSpace
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: TEXT_DIM }}>
            © 2026 TrackSpace. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
