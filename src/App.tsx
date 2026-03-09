import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Box, Typography, CircularProgress } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './config/queryClient';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { theme } from './styles/theme';
import ProtectedRoute from './routes/ProtectedRoute';
import AppLayout from './components/layout/AppLayout/AppLayout';
import ProjectLayout from './components/layout/ProjectLayout/ProjectLayout';

// ── Lazy-loaded pages (each becomes a separate chunk) ──
const LandingPage = lazy(() => import('./pages/Landing/LandingPage'));
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'));
const OAuth2RedirectPage = lazy(() => import('./pages/Auth/OAuth2RedirectPage'));
const AdminDashboard = lazy(() => import('./pages/Dashboard/AdminDashboard'));
const LecturerDashboard = lazy(() => import('./pages/Dashboard/LecturerDashboard'));
const UserManagement = lazy(() => import('./pages/Users/UserManagement'));
const ClassManagement = lazy(() => import('./pages/Classes/ClassManagement'));
const ClassDetail = lazy(() => import('./pages/Classes/ClassDetail/index'));
const GroupManagement = lazy(() => import('./pages/Groups/GroupManagement'));
const ProjectInfo = lazy(() => import('./pages/Projects/ProjectInfo'));
const ProjectOverview = lazy(() => import('./pages/Projects/ProjectOverview'));
const JiraBoard = lazy(() => import('./pages/Jira/JiraBoard'));
const JiraConnect = lazy(() => import('./pages/Jira/JiraConnect'));
const GitHubPage = lazy(() => import('./pages/GitHub/GitHubPage'));
const StudentDashboard = lazy(() => import('./pages/Student/StudentDashboard'));
const SemesterManagement = lazy(() => import('./pages/Semesters/SemesterManagement'));
const SubjectManagement = lazy(() => import('./pages/Subjects/SubjectManagement'));

const PageLoader = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress size={32} />
    </Box>
);


function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <ToastContainer
                    position="top-right"
                    autoClose={2500}
                    hideProgressBar={false}
                    newestOnTop
                    closeOnClick={false}
                    pauseOnFocusLoss={false}
                    draggable
                    pauseOnHover
                    theme="colored"
                />
                <Router>
                    <Suspense fallback={<PageLoader />}>
                        <Routes>
                            {/* Public routes */}
                            <Route path="/" element={<LandingPage />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/oauth2/redirect" element={<OAuth2RedirectPage />} />


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
                                <Route path="/admin/subjects" element={<SubjectManagement />} />
                                <Route path="/admin/semesters" element={<SemesterManagement />} />
                            </Route>
                            {/* Lecturer routes */}
                            <Route
                                element={
                                    <ProtectedRoute allowedRoles={['LECTURER']}>
                                        <AppLayout />
                                    </ProtectedRoute>
                                }
                            >
                                <Route path="/lecturer/classes" element={<LecturerDashboard />} />
                                <Route path="/lecturer/classes/:classId" element={<ClassDetail />} />
                                <Route path="/lecturer/classes/:classId/groups" element={<GroupManagement />} />
                                <Route path="/lecturer/projects/:projectId/info" element={<ProjectInfo />} />
                            </Route>

                            {/* Student routes */}
                            <Route
                                element={
                                    <ProtectedRoute allowedRoles={['TEAMLEADER', 'TEAMMEMBER']}>
                                        <AppLayout />
                                    </ProtectedRoute>
                                }
                            >
                                <Route path="/student/dashboard" element={<StudentDashboard />} />
                            </Route>

                            {/* Project Workspace — all roles */}
                            <Route
                                element={
                                    <ProtectedRoute allowedRoles={['LECTURER', 'TEAMLEADER', 'TEAMMEMBER']}>
                                        <ProjectLayout />
                                    </ProtectedRoute>
                                }
                            >
                                <Route path="/projects/:projectId" element={<ProjectOverview />} />
                                <Route path="/projects/:projectId/jira" element={<JiraBoard />} />
                                <Route path="/projects/:projectId/jira/connect" element={<JiraConnect />} />
                                <Route path="/projects/:projectId/github" element={<GitHubPage />} />
                                <Route path="/projects/:projectId/contribution" element={
                                    <Box sx={{ p: 4, textAlign: 'center' }}>
                                        <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>Contribution Analytics</Typography>
                                        <Typography color="text.secondary">Coming soon...</Typography>
                                    </Box>
                                } />
                                <Route path="/projects/:projectId/srs" element={
                                    <Box sx={{ p: 4, textAlign: 'center' }}>
                                        <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>SRS Document</Typography>
                                        <Typography color="text.secondary">Coming soon...</Typography>
                                    </Box>
                                } />
                                <Route path="/projects/:projectId/settings" element={
                                    <Box sx={{ p: 4, textAlign: 'center' }}>
                                        <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>Cài đặt dự án</Typography>
                                        <Typography color="text.secondary">Coming soon...</Typography>
                                    </Box>
                                } />
                            </Route>


                        </Routes>
                    </Suspense>
                </Router>
            </ThemeProvider>
        </QueryClientProvider>
    );
}

export default App;
