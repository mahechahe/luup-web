import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import Auth from './app/auth/Auth';
import { TooltipProvider } from '@/components/ui/tooltip';
import RouterComponent from './App/routes/RouterComponent';

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
