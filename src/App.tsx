import { UserProvider } from './context/UserContext';
import { AppRouter } from './router/AppRouter';
import { UpdatePrompt } from './components/UpdatePrompt';
import { EmailGateProvider } from './components/auth';

export default function App() {
  return (
    <UserProvider>
      <EmailGateProvider>
        <AppRouter />
        <UpdatePrompt />
      </EmailGateProvider>
    </UserProvider>
  );
}
