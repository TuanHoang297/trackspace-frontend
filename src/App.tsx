import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { theme } from './styles/theme';
import LandingPage from './pages/Landing/LandingPage';
import LoginPage from './pages/Auth/LoginPage';
import OAuth2RedirectPage from './pages/Auth/OAuth2RedirectPage';
import ProtectedRoute from './routes/ProtectedRoute';
import AppLayout from './components/layout/AppLayout/AppLayout';
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import UserManagement from './pages/Users/UserManagement';
import ClassManagement from './pages/Classes/ClassManagement';

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                pauseOnFocusLoss={false}
                draggable
                pauseOnHover
                theme="colored"
            />
            <Router>
                <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/oauth2/redirect" element={<OAuth2RedirectPage />} />
                    <Route
                        path="/register"
                        element={
                            <div style={{ padding: '2rem', textAlign: 'center' }}>
                                <h1>Register Page</h1>
                                <p>Coming soon...</p>
                            </div>
                        }
                    />

                    {/* Admin routes */}
                    <Route
                        element={
                            <ProtectedRoute allowedRoles={['ADMIN']}>
                                <AppLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="/admin/dashboard" element={<AdminDashboard />} />
                        <Route path="/admin/users" element={<UserManagement />} />
                        <Route path="/admin/classes" element={<ClassManagement />} />
                    </Route>

                    {/* Placeholder routes for other roles */}
                    <Route
                        path="/lecturer/dashboard"
                        element={
                            <div style={{ padding: '2rem', textAlign: 'center' }}>
                                <h1>Lecturer Dashboard</h1>
                                <p>Coming soon...</p>
                            </div>
                        }
                    />
                    <Route
                        path="/student/dashboard"
                        element={
                            <div style={{ padding: '2rem', textAlign: 'center' }}>
                                <h1>Student Dashboard</h1>
                                <p>Coming soon...</p>
                            </div>
                        }
                    />
                    <Route
                        path="/dashboard"
                        element={
                            <div style={{ padding: '2rem', textAlign: 'center' }}>
                                <h1>Dashboard</h1>
                                <p>Coming soon...</p>
                            </div>
                        }
                    />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;
