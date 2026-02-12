import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import RouterComponent from './app/routes/RouterComponent';
import Auth from './app/auth/Auth';

function App() {
  return (
    <Auth>
      <BrowserRouter>
        <RouterComponent />
        <Toaster richColors expand position="top-center" />
      </BrowserRouter>
    </Auth>
  );
}

export default App;
