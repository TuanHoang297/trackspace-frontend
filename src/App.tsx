import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
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
import LecturerDashboard from './pages/Dashboard/LecturerDashboard';
import UserManagement from './pages/Users/UserManagement';
import ClassManagement from './pages/Classes/ClassManagement';
import ClassDetail from './pages/Classes/ClassDetail/index';
import GroupManagement from './pages/Groups/GroupManagement';
import ProjectInfo from './pages/Projects/ProjectInfo';
import ProjectOverview from './pages/Projects/ProjectOverview';
import ProjectLayout from './components/layout/ProjectLayout/ProjectLayout';
import JiraBoard from './pages/Jira/JiraBoard';
import JiraConnect from './pages/Jira/JiraConnect';
import GitHubPage from './pages/GitHub/GitHubPage';
import StudentDashboard from './pages/Student/StudentDashboard';
import SemesterManagement from './pages/Semesters/SemesterManagement';
import SubjectManagement from './pages/Subjects/SubjectManagement';

function App() {
    return (
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
            </Router>
        </ThemeProvider>
    );
}

export default App;
