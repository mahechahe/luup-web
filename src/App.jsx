import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import RouterComponent from './app/routes/RouterComponent';
import Auth from './app/auth/Auth';
import { TooltipProvider } from '@/components/ui/tooltip';

function App() {
  return (
    <TooltipProvider>
      <Auth>
        <BrowserRouter>
          <RouterComponent />
          <Toaster richColors expand position="top-center" />
        </BrowserRouter>
      </Auth>
    </TooltipProvider>
  );
}

export default App;
