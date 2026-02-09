import { AuthProvider } from "./App/auth/AuthContext";
import AppRouter from "./App/router/AppRouter";

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;

