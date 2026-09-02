import LandingPage from '../Landing/LandingPage.jsx';

export function LoginPage() {
  return <LandingPage initialMode="login" />;
}

export function RegisterPage() {
  return <LandingPage initialMode="register" />;
}
