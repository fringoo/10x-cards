import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

// TODO: Implement actual form handling and validation (e.g., with react-hook-form and Zod)
// TODO: Implement actual submission logic to call Supabase or API endpoint
// TODO: Implement password strength indicator

// Schemat walidacji Zod
const passwordValidation = z.string().min(8, { message: "Hasło musi mieć co najmniej 8 znaków." });
// .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
//   message: "Hasło musi zawierać wielką literę, małą literę, cyfrę i znak specjalny."
// }); // Bardziej złożona walidacja hasła, jeśli potrzebna

const registerSchema = z
  .object({
    email: z
      .string()
      .email({ message: "Nieprawidłowy format adresu email." })
      .min(1, { message: "Email jest wymagany." }),
    password: passwordValidation,
    confirmPassword: passwordValidation, // Używamy tej samej walidacji dla obu pól hasła
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być takie same.",
    path: ["confirmPassword"], // Ten błąd będzie przypisany do pola confirmPassword
  });

type RegisterFormInputs = z.infer<typeof registerSchema>;

const RegisterForm: React.FC = () => {
  console.log("[RegisterForm] Komponent zamontowany.");
  const [formMessage, setFormMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset, // Dodajemy reset do resetowania formularza
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormInputs) => {
    console.log("[RegisterForm] Próba wysłania formularza rejestracji z danymi:", data.email);
    setIsSubmitting(true);
    setFormMessage(null);

    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("password", data.password);

    try {
      console.log("[RegisterForm] Wysyłanie żądania POST do /api/auth/register");
      const response = await fetch("/api/auth/register", {
        method: "POST",
        body: formData,
      });
      console.log(`[RegisterForm] Otrzymano odpowiedź z API: Status ${response.status}`);
      const result = await response.json();
      console.log("[RegisterForm] Odpowiedź API (JSON):", result);

      if (!response.ok) {
        console.error("[RegisterForm] Błąd odpowiedzi API:", result.error);
        setFormMessage({ type: "error", message: result.error || "Wystąpił błąd podczas rejestracji." });
      } else {
        console.log("[RegisterForm] Rejestracja pomyślna. Komunikat:", result.message);
        setFormMessage({
          type: "success",
          message: result.message || "Rejestracja pomyślna. Sprawdź email, aby zweryfikować konto.",
        });
        reset(); // Resetowanie formularza po pomyślnej rejestracji
        console.log("[RegisterForm] Przekierowanie do /auth/verify-email za 3 sekundy.");
        setTimeout(() => {
          window.location.href = "/auth/verify-email";
        }, 3000);
      }
    } catch (error: any) {
      console.error("[RegisterForm] Błąd sieci lub inny błąd podczas wysyłania formularza:", error.message);
      setFormMessage({ type: "error", message: "Nie udało się połączyć z serwerem. Spróbuj ponownie później." });
    }
    setIsSubmitting(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Rejestracja</CardTitle>
        <CardDescription>Załóż nowe konto, aby korzystać z aplikacji.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="jan.kowalski@example.com" {...register("email")} />
            {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Hasło</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Powtórz Hasło</Label>
            <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
            {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch">
          {formMessage && (
            <Alert variant={formMessage.type === "error" ? "destructive" : "default"} className="mb-4">
              <AlertDescription>{formMessage.message}</AlertDescription>
            </Alert>
          )}
          {!(formMessage?.type === "success") && (
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Rejestrowanie..." : "Zarejestruj się"}
            </Button>
          )}
          {formMessage?.type !== "success" && (
            <div className="mt-4 text-center text-sm">
              Masz już konto?{" "}
              <a href="/auth/login" className="underline">
                Zaloguj się
              </a>
            </div>
          )}
        </CardFooter>
      </form>
    </Card>
  );
};

export default RegisterForm;
