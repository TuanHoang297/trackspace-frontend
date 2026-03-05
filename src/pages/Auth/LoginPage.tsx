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
const BG = '#F8FAFC';
const WHITE = '#FFFFFF';
const BORDER = '#E2E8F0';
const TEXT = '#1E293B';
const DIM = '#64748B';
const ACCENT = '#3B82F6';
const GRAD = 'linear-gradient(135deg, #3B82F6, #8B5CF6)';
const CTA = 'linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)';

/* ── TextField sx ── */
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: '#F8FAFC',
    '& fieldset': { borderColor: BORDER },
    '&:hover fieldset': { borderColor: '#93C5FD' },
    '&.Mui-focused fieldset': { borderColor: ACCENT, borderWidth: '2px' },
    '& input': { color: TEXT, caretColor: ACCENT },
  },
  '& .MuiInputLabel-root': { color: DIM, fontWeight: 500 },
  '& .MuiInputLabel-root.Mui-focused': { color: ACCENT },
  '& .MuiFormHelperText-root': { color: '#EF4444' },
};

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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data: LoginResponse = await res.json();
        if (data.success) {
          localStorage.setItem('token', data.data.token);
          localStorage.setItem('user', JSON.stringify({
            userId: data.data.userId, email: data.data.email,
            fullName: data.data.fullName, role: data.data.role,
          }));
          const r = data.data.role;
          if (r === 'ADMIN') navigate('/admin/dashboard');
          else if (r === 'LECTURER') navigate('/lecturer/classes');
          else navigate('/student/dashboard');
        } else {
          setApiErr(data.message || 'Đăng nhập thất bại.');
        }
      } else {
        try {
          const errData = await res.json();
          setApiErr(errData.message || `Lỗi ${res.status}: ${res.statusText}`);
        } catch {
          // Could not parse JSON error body
          if (res.status === 401) setApiErr('Email hoặc mật khẩu không đúng.');
          else if (res.status === 403) setApiErr('Tài khoản đã bị khóa. Liên hệ quản trị viên.');
          else if (res.status === 503) setApiErr('Hệ thống đang bảo trì. Vui lòng thử lại sau.');
          else setApiErr(`Lỗi server (${res.status}). Vui lòng thử lại sau.`);
        }
      }
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setApiErr('Không thể kết nối đến server. Kiểm tra kết nối mạng hoặc server chưa khởi động.');
      } else {
        setApiErr('Không thể kết nối đến server. Vui lòng thử lại.');
      }
    }
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
      bgcolor: BG, p: 3, fontFamily: "'Inter','Segoe UI',sans-serif",
    }}>
      <Box sx={{ maxWidth: 400, width: '100%' }}>

        {/* Logo */}
        <Box component={Link} to="/" sx={{
          display: 'flex', alignItems: 'center', gap: 1, mb: 5,
          justifyContent: 'center', textDecoration: 'none',
          '&:hover': { opacity: 0.8 },
        }}>
          <AutoAwesomeIcon sx={{ fontSize: 20, color: ACCENT }} />
          <Typography fontWeight={800} fontSize="1.1rem" sx={{
            background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            TrackSpace
          </Typography>
        </Box>

        {/* Card */}
        <Box sx={{
          bgcolor: WHITE, border: `1px solid ${BORDER}`,
          borderRadius: '20px', p: 4,
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}>
          <Typography variant="h5" fontWeight={800} sx={{ color: TEXT, mb: 0.5 }}>Đăng nhập</Typography>
          <Typography variant="body2" sx={{ color: DIM, mb: 3 }}>Nhập thông tin tài khoản để tiếp tục</Typography>

          {apiErr && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: '12px' }}>{apiErr}</Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth label="Email" name="email"
              value={form.email} onChange={handleChange}
              error={!!errs.email} helperText={errs.email}
              placeholder="your.email@example.com"
              autoComplete="email" size="small"
              sx={{ ...fieldSx, mb: 2.5 }}
            />

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
                size="small" onClick={() => setShowPw(p => !p)}
                sx={{
                  position: 'absolute', top: '50%', right: 8,
                  transform: errs.password ? 'translateY(calc(-50% - 12px))' : 'translateY(-50%)',
                  color: DIM, '&:hover': { color: ACCENT },
                }}
              >
                {showPw ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
              </IconButton>
            </Box>

            <Button type="submit" fullWidth variant="contained" size="large"
              disabled={loading}
              sx={{
                py: 1.4, fontWeight: 700, borderRadius: '12px', textTransform: 'none',
                background: CTA, boxShadow: '0 4px 15px rgba(59,130,246,0.3)',
                '&:hover': { background: 'linear-gradient(135deg,#2563EB,#4F46E5,#7C3AED)', boxShadow: '0 6px 20px rgba(59,130,246,0.45)', transform: 'translateY(-1px)' },
                '&:disabled': { background: '#E2E8F0', color: '#94A3B8' },
                transition: 'all 0.2s ease',
              }}>
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Đăng nhập'}
            </Button>
          </form>

          <Divider sx={{ my: 3, color: DIM, fontSize: '0.78rem' }}>hoặc</Divider>

          <Button fullWidth variant="outlined" startIcon={<GoogleIcon />}
            onClick={handleGoogle}
            sx={{
              borderColor: BORDER, color: DIM, textTransform: 'none',
              fontWeight: 600, borderRadius: '12px', py: 1.2,
              '&:hover': { borderColor: ACCENT, color: TEXT, bgcolor: 'rgba(59,130,246,0.04)' },
            }}>
            Đăng nhập với Google
          </Button>
        </Box>

        <Typography variant="caption" textAlign="center" display="block" sx={{ mt: 3, color: DIM }}>
          © 2026 TrackSpace. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginPage;
