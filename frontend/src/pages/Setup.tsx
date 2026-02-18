import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoaderCircle } from "lucide-react";

export function Setup() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/setup/status')
      .then((response) => {
        if (response.data.setup_complete) {
          navigate('/login');
        } else {
          setIsLoading(false);
        }
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirmation) {
      setError('Пароли не совпадают');
      return;
    }

    try {
      await api.post('/setup/admin', {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      navigate('/login');
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(message || 'Ошибка при создании администратора');
    }
  };

  if (isLoading) {
    return <LoaderCircle className="h-12 w-12 animate-spin mx-auto mb-4 text-muted-foreground" />
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 bg-card rounded-lg shadow-md border border-border">
        <h1 className="text-2xl font-bold text-center mb-6">Первоначальная настройка</h1>
        <p className="text-muted-foreground text-center mb-6">
          Создайте учетную запись администратора для начала работы
        </p>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded border border-destructive/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Имя</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password-confirmation">Подтверждение пароля</Label>
            <Input
              id="password-confirmation"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <Button type="submit" className="w-full">
            Создать администратора
          </Button>
        </form>
      </div>
    </div>
  );
}
