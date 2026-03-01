import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthPage.css';

const OAuth2RedirectPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    if (token) {
      // Store token
      localStorage.setItem('token', token);

      // Fetch user info with the token
      fetch('http://localhost:8080/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            localStorage.setItem('user', JSON.stringify(data.data));

            // Redirect based on role
            switch (data.data.role) {
              case 'ADMIN':
                navigate('/admin/dashboard', { replace: true });
                break;
              case 'LECTURER':
                navigate('/lecturer/dashboard', { replace: true });
                break;
              case 'TEAMLEADER':
              case 'TEAMMEMBER':
              case 'STUDENT':
                navigate('/student/dashboard', { replace: true });
                break;
              default:
                navigate('/dashboard', { replace: true });
            }
          } else {
            navigate('/login?error=Unable to fetch user info', { replace: true });
          }
        })
        .catch(err => {
          console.error('Error fetching user info:', err);
          navigate('/login?error=Authentication failed', { replace: true });
        });
    } else if (error) {
      navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="auth-page">
      <div className="oauth-loading">
        <div className="loading-spinner">
          <svg className="spinner" viewBox="0 0 24 24">
            <circle className="spinner-circle" cx="12" cy="12" r="10" stroke="#2563EB" strokeWidth="4" fill="none" />
          </svg>
        </div>
        <h2>Authenticating...</h2>
        <p>Please wait while we complete your sign in.</p>
      </div>
    </div>
  );
};

export default OAuth2RedirectPage;
