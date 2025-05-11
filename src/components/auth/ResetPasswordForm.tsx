import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabaseClient } from '@/db/supabase.client'; // Import klienckiego klienta Supabase

// TODO: Implement actual form handling and validation (e.g., with react-hook-form and Zod)
// TODO: Implement logic to handle the reset token (likely from URL)
// TODO: Implement actual submission logic to call Supabase auth.updateUser()

const passwordValidation = z.string()
  .min(8, { message: "Hasło musi mieć co najmniej 8 znaków." });

const resetPasswordSchema = z.object({
  newPassword: passwordValidation,
  confirmNewPassword: passwordValidation,
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Hasła muszą być takie same.",
  path: ["confirmNewPassword"],
});

type ResetPasswordFormInputs = z.infer<typeof resetPasswordSchema>;

const ResetPasswordForm: React.FC = () => {
  console.log('[ResetPasswordForm] Komponent zamontowany.');
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error' | 'default'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canResetPassword, setCanResetPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ResetPasswordFormInputs>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const handlePasswordRecovery = useCallback(() => {
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      console.log('[ResetPasswordForm] onAuthStateChange event:', event, 'session:', session);
      if (event === "PASSWORD_RECOVERY") {
        console.log('[ResetPasswordForm] Wykryto zdarzenie PASSWORD_RECOVERY. Formularz resetowania hasła jest aktywny.');
        setCanResetPassword(true);
        setFormMessage(null); // Wyczyść poprzednie komunikaty, jeśli były
      } else if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        // Jeśli użytkownik jest już zalogowany lub sesja została zaktualizowana w inny sposób,
        // a nie jesteśmy w trybie odzyskiwania, to nie powinien tu być.
        // Można rozważyć przekierowanie, ale na razie zostawiamy formularz nieaktywny.
        setCanResetPassword(false);
        console.log('[ResetPasswordForm] Użytkownik zalogowany lub sesja zaktualizowana, ale nie w trybie PASSWORD_RECOVERY.');
      }
    });
  }, []);

  useEffect(() => {
    console.log('[ResetPasswordForm] Uruchamiam nasłuchiwanie onAuthStateChange dla PASSWORD_RECOVERY.');
    handlePasswordRecovery();
    // Sprawdzenie, czy Supabase przekazuje token w URL hash - typowe dla linków resetujących
    // Ten kod jest uruchamiany tylko raz przy montowaniu komponentu.
    if (window.location.hash.includes('type=recovery')) {
        console.log('[ResetPasswordForm] Wykryto fragment #type=recovery w URL. Oczekiwanie na zdarzenie PASSWORD_RECOVERY z Supabase SDK.');
        // Supabase SDK powinno samo obsłużyć token z URL i wywołać onAuthStateChange z eventem PASSWORD_RECOVERY
        // Nie ma potrzeby ręcznego wywoływania exchangeCodeForSession czy podobnych.
        setFormMessage({type: 'default', message: "Przetwarzanie linku do resetowania hasła..."});
    } else {
        // Jeśli nie ma tokenu w URL, a nie jesteśmy już w stanie PASSWORD_RECOVERY, to link jest prawdopodobnie nieprawidłowy lub stary.
        // Można by tu od razu ustawić błąd, ale poczekajmy na event z onAuthStateChange.
        console.log('[ResetPasswordForm] Brak fragmentu #type=recovery w URL. Formularz może nie być aktywny, jeśli Supabase nie zainicjuje sesji odzyskiwania.');
    }

    return () => {
      // Opcjonalnie: czyszczenie listenera, jeśli jest taka potrzeba.
      // const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(() => {});
      // subscription?.unsubscribe();
      console.log('[ResetPasswordForm] Komponent odmontowywany / czyszczenie listenera (jeśli zaimplementowane).');
    };
  }, [handlePasswordRecovery]);

  const onSubmit = async (data: ResetPasswordFormInputs) => {
    if (!canResetPassword) {
      console.error('[ResetPasswordForm] Próba resetu hasła bez aktywnej sesji PASSWORD_RECOVERY.');
      setFormMessage({ type: 'error', message: 'Nie można zresetować hasła. Sesja odzyskiwania nie jest aktywna. Spróbuj ponownie kliknąć link z emaila.' });
      return;
    }
    console.log('[ResetPasswordForm] Próba wysłania formularza resetowania hasła.');
    setIsSubmitting(true);
    setFormMessage(null);

    const { error } = await supabaseClient.auth.updateUser({
      password: data.newPassword,
    });

    if (error) {
      console.error('[ResetPasswordForm] Błąd podczas aktualizacji hasła przez Supabase:', error.message);
      setFormMessage({ type: 'error', message: error.message || 'Wystąpił błąd podczas zmiany hasła.' });
    } else {
      console.log('[ResetPasswordForm] Hasło zostało pomyślnie zmienione.');
      setFormMessage({ type: 'success', message: 'Hasło zostało pomyślnie zmienione. Możesz się teraz zalogować.' });
      reset();
      setCanResetPassword(false); // Deaktywuj formularz po sukcesie
      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 3000);
    }
    setIsSubmitting(false);
  };

  if (!canResetPassword && !formMessage) {
    // Jeśli nie ma jeszcze tokenu i nie ma komunikatu (np. początkowego "Przetwarzanie...")
    // Pokaż bardziej ogólny komunikat lub nic, dopóki Supabase nie przetworzy URL
    // Można też wyświetlić komunikat o nieprawidłowym/wygasłym linku po pewnym czasie, jeśli `canResetPassword` pozostaje false
     return (
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <CardTitle>Resetowanie Hasła</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    Jeśli przeszedłeś tutaj z prawidłowego linku do resetowania hasła, 
                    formularz powinien pojawić się za chwilę. 
                    Jeśli nie, link może być nieprawidłowy lub wygasł.
                </p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Ustaw Nowe Hasło</CardTitle>
        {canResetPassword && <CardDescription>Wprowadź swoje nowe hasło poniżej.</CardDescription>}
        {!canResetPassword && formMessage?.type !== 'success' && (
            <CardDescription className="text-red-500">
                Link do resetowania hasła jest nieprawidłowy, wygasł lub wystąpił problem z jego przetworzeniem. Spróbuj ponownie wygenerować link.
            </CardDescription>
        )}
      </CardHeader>
      {/* Pokaż formularz tylko jeśli canResetPassword jest true i nie ma komunikatu o sukcesie */} 
      {canResetPassword && formMessage?.type !== 'success' && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nowe Hasło</Label>
              <Input id="newPassword" type="password" {...register('newPassword')} />
              {errors.newPassword && <p className="text-sm text-red-500 mt-1">{errors.newPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Powtórz Nowe Hasło</Label>
              <Input id="confirmNewPassword" type="password" {...register('confirmNewPassword')} />
              {errors.confirmNewPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmNewPassword.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch">
            {formMessage && formMessage.type === 'error' && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{formMessage.message}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting || !canResetPassword}>
              {isSubmitting ? 'Zapisywanie...' : 'Ustaw nowe hasło'}
            </Button>
          </CardFooter>
        </form>
      )}
      {/* Pokaż komunikat sukcesu jeśli istnieje */} 
      {formMessage && formMessage.type === 'success' && (
         <CardContent>
            <Alert className="mb-4">
                <AlertDescription>{formMessage.message}</AlertDescription>
            </Alert>
            <Button onClick={() => window.location.href = '/auth/login'} className="w-full mt-4">
                Przejdź do logowania
            </Button>
         </CardContent>
      )}
       {/* Pokaż komunikat o przetwarzaniu linku */} 
      {formMessage && formMessage.type === 'default' && !canResetPassword && (
         <CardContent>
            <Alert className="mb-4">
                <AlertDescription>{formMessage.message}</AlertDescription>
            </Alert>
         </CardContent>
      )}
    </Card>
  );
};

export default ResetPasswordForm; 