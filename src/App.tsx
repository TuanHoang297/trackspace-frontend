import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './styles/theme';

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h1>🚀 TrackSpace Frontend</h1>
                <p>Project structure created successfully!</p>
                <p>Start building your features here.</p>
            </div>
        </ThemeProvider>
    );
}

export default App;
