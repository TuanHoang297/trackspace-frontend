import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, TextField, Button, Typography,
  IconButton, Alert, CircularProgress, Divider,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import GoogleIcon from '@mui/icons-material/Google';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { API_BASE_URL } from '../../config/env';

/* ── Tokens ── */
const BG = '#0B1120';
const CARD = 'rgba(255,255,255,0.06)';
const BORDER = 'rgba(255,255,255,0.08)';
const WHITE = '#F1F5F9';
const DIM = '#94A3B8';
const ACCENT = '#3B82F6';
const GRAD = 'linear-gradient(135deg, #3B82F6, #8B5CF6)';
const CTA = 'linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)';
const INPUT_BG = 'rgba(15,23,42,0.8)';

/* ── Shared TextField sx ── */
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: INPUT_BG,
    color: WHITE,
    '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
    '&:hover fieldset': { borderColor: 'rgba(59,130,246,0.5)' },
    '&.Mui-focused fieldset': { borderColor: ACCENT, borderWidth: '2px' },
    '& input': {
      color: WHITE,
      caretColor: WHITE,
      '&:-webkit-autofill': {
        WebkitBoxShadow: `0 0 0 100px ${INPUT_BG} inset !important`,
        WebkitTextFillColor: `${WHITE} !important`,
      },
    },
  },
  '& .MuiInputLabel-root': { color: DIM, fontWeight: 500 },
  '& .MuiInputLabel-root.Mui-focused': { color: ACCENT },
  '& .MuiFormHelperText-root': { color: '#F87171' },
};

/* ── Types ── */
interface FormData { email: string; password: string; }
interface LoginResponse {
  success: boolean; message: string;
  data: { token: string; userId: number; email: string; fullName: string; role: string; };
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>({ email: '', password: '' });
  const [errs, setErrs] = useState<Partial<FormData>>({});
  const [loading, setLoading] = useState(false);
  const [apiErr, setApiErr] = useState('');
  const [showPw, setShowPw] = useState(false);

  const validate = () => {
    const e: Partial<FormData> = {};
    if (!form.email) e.email = 'Email không được để trống';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email không hợp lệ';
    if (!form.password) e.password = 'Mật khẩu không được để trống';
    else if (form.password.length < 6) e.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    setErrs(e);
    return !Object.keys(e).length;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errs[name as keyof FormData]) setErrs(p => ({ ...p, [name]: undefined }));
    setApiErr('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setApiErr('');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data: LoginResponse = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify({
          userId: data.data.userId, email: data.data.email,
          fullName: data.data.fullName, role: data.data.role,
        }));
        const r = data.data.role;
        if (r === 'ADMIN') navigate('/admin/dashboard');
        else if (r === 'LECTURER') navigate('/lecturer/dashboard');
        else navigate('/student/dashboard');
      } else setApiErr(data.message || 'Đăng nhập thất bại.');
    } catch { setApiErr('Không thể kết nối đến server.'); }
    finally { setLoading(false); }
  };

  const handleGoogle = () => {
    const baseUrl = API_BASE_URL.replace('/api', '');
    const uri = encodeURIComponent(window.location.origin + '/oauth2/redirect');
    window.location.href = `${baseUrl}/oauth2/authorize/google?redirect_uri=${uri}`;
  };

  React.useEffect(() => {
    const err = new URLSearchParams(window.location.search).get('error');
    if (err) setApiErr(decodeURIComponent(err));
  }, []);

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: BG, position: 'relative', overflow: 'hidden',
      fontFamily: "'Inter','Segoe UI',sans-serif",
    }}>
      {/* Glow orbs */}
      <Box sx={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', top: -200, right: -100, filter: 'blur(60px)', background: 'radial-gradient(circle,rgba(59,130,246,0.15) 0%,transparent 70%)' }} />
      <Box sx={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', bottom: -150, left: -100, filter: 'blur(80px)', background: 'radial-gradient(circle,rgba(139,92,246,0.12) 0%,transparent 70%)' }} />
      {/* Grid */}
      <Box sx={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)', backgroundSize: '64px 64px' }} />

      <Box sx={{ maxWidth: 420, width: '100%', mx: 2, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 5, textDecoration: 'none', '&:hover': { opacity: 0.8 } }}>
          <AutoAwesomeIcon sx={{ color: ACCENT, fontSize: 24 }} />
          <Typography variant="h4" fontWeight={800} sx={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.03em' }}>
            TrackSpace
          </Typography>
        </Box>

        {/* Card */}
        <Box sx={{ bgcolor: CARD, backdropFilter: 'blur(24px)', borderRadius: '20px', border: `1px solid ${BORDER}`, p: { xs: 3.5, sm: 4.5 }, boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}>
          <Typography variant="h5" fontWeight={800} textAlign="center" sx={{ mb: 0.5, color: WHITE }}>Đăng nhập</Typography>
          <Typography variant="body2" textAlign="center" sx={{ mb: 3.5, color: DIM }}>Nhập thông tin tài khoản để tiếp tục</Typography>

          {apiErr && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: '12px', bgcolor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5', '& .MuiAlert-icon': { color: '#EF4444' } }}>
              {apiErr}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <TextField
              fullWidth label="Email" name="email"
              value={form.email} onChange={handleChange}
              error={!!errs.email} helperText={errs.email}
              placeholder="your.email@example.com"
              autoComplete="email" size="small"
              sx={{ ...fieldSx, mb: 2.5 }}
            />

            {/* Password — wrapper box carries the mb so top:50% works on input only */}
            <Box sx={{ position: 'relative', mb: 3.5 }}>
              <TextField
                fullWidth label="Mật khẩu" name="password"
                type={showPw ? 'text' : 'password'}
                value={form.password} onChange={handleChange}
                error={!!errs.password} helperText={errs.password}
                placeholder="Nhập mật khẩu"
                autoComplete="current-password" size="small"
                sx={{ ...fieldSx, mb: 0, '& .MuiOutlinedInput-root input': { paddingRight: '44px' } }}
              />
              <IconButton
                size="small"
                onClick={() => setShowPw(p => !p)}
                sx={{
                  position: 'absolute', top: '50%', right: 8,
                  transform: errs.password ? 'translateY(calc(-50% - 12px))' : 'translateY(-50%)',
                  color: DIM,
                  '&:hover': { color: WHITE, bgcolor: 'transparent' },
                }}
              >
                {showPw ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
              </IconButton>
            </Box>

            <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{
              py: 1.4, fontWeight: 700, borderRadius: '12px', textTransform: 'none', fontSize: '0.95rem',
              background: CTA, border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 8px 32px rgba(59,130,246,0.35)',
              transition: 'all 0.3s ease',
              '&:hover': { background: 'linear-gradient(135deg,#2563EB 0%,#4F46E5 50%,#7C3AED 100%)', boxShadow: '0 12px 40px rgba(59,130,246,0.5)', transform: 'translateY(-1px)' },
              '&:disabled': { background: 'rgba(59,130,246,0.3)', color: 'rgba(255,255,255,0.5)' },
            }}>
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Đăng nhập'}
            </Button>
          </form>

          <Divider sx={{ my: 3, '&::before,&::after': { borderColor: BORDER } }}>
            <Typography variant="caption" sx={{ color: DIM, px: 1.5 }}>hoặc</Typography>
          </Divider>

          <Button fullWidth variant="outlined" startIcon={<GoogleIcon />} onClick={handleGoogle} sx={{
            borderColor: BORDER, color: DIM, textTransform: 'none', fontWeight: 600, borderRadius: '12px', py: 1.2,
            transition: 'all 0.3s ease',
            '&:hover': { borderColor: 'rgba(59,130,246,0.4)', color: WHITE, bgcolor: 'rgba(59,130,246,0.08)' },
          }}>
            Đăng nhập với Google
          </Button>
        </Box>

        <Typography variant="caption" textAlign="center" display="block" sx={{ mt: 4, color: DIM, opacity: 0.6 }}>
          © 2026 TrackSpace. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginPage;
