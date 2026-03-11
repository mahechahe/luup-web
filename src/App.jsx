import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import Auth from './App/auth/Auth';
import { TooltipProvider } from '@/components/ui/tooltip';
import RouterComponent from './App/routes/RouterComponent';
import PWAUpdatePrompt from '@/components/PWAUpdatePrompt';
import { ThemeProvider } from './App/context/themeStore.jsx';

function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <Auth>
          <BrowserRouter>
            <RouterComponent />
            <Toaster richColors expand position="top-center" />
            <PWAUpdatePrompt />
          </BrowserRouter>
        </Auth>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
