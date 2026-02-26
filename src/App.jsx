import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import Auth from './App/auth/Auth';
import { TooltipProvider } from '@/components/ui/tooltip';
import RouterComponent from './App/routes/RouterComponent';
import PWAUpdatePrompt from '@/components/PWAUpdatePrompt';

function App() {
  return (
    <TooltipProvider>
      <Auth>
        <BrowserRouter>
          <RouterComponent />
          <Toaster richColors expand position="top-center" />
          <PWAUpdatePrompt />
        </BrowserRouter>
      </Auth>
    </TooltipProvider>
  );
}

export default App;
