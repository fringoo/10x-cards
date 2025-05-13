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

const loginSchema = z.object({
  email: z
    .string()
    .email({ message: "Nieprawidłowy format adresu email." })
    .min(1, { message: "Email jest wymagany." }),
  password: z.string().min(1, { message: "Hasło jest wymagane." }),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

const LoginForm: React.FC = () => {
  console.log("[LoginForm] Komponent zamontowany.");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormInputs) => {
    console.log("[LoginForm] Próba wysłania formularza logowania z danymi:", data.email);
    setIsSubmitting(true);
    setLoginError(null);

    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("password", data.password);

    try {
      console.log("[LoginForm] Wysyłanie żądania POST do /api/auth/login");
      const response = await fetch("/api/auth/login", {
        method: "POST",
        body: formData,
      });
      console.log(`[LoginForm] Otrzymano odpowiedź z API: Status ${response.status}`);
      const result = await response.json();
      console.log("[LoginForm] Odpowiedź API (JSON):", result);

      if (!response.ok) {
        console.error("[LoginForm] Błąd odpowiedzi API:", result.error);
        setLoginError(result.error || "Wystąpił błąd podczas logowania.");
      } else {
        console.log("[LoginForm] Logowanie pomyślne. Przekierowanie do /");
        window.location.href = "/";
      }
    } catch (error: any) {
      console.error("[LoginForm] Błąd sieci lub inny błąd podczas wysyłania formularza:", error.message);
      setLoginError("Nie udało się połączyć z serwerem. Spróbuj ponownie później.");
    }
    setIsSubmitting(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardDescription>Zaloguj się, aby uzyskać dostęp do aplikacji.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="jan.kowalski@example.com" {...register("email")} />
            {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
          </div>
          <div className="space-y-2 mb-2">
            <Label htmlFor="password">Hasło</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch">
          {loginError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{loginError}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Logowanie..." : "Zaloguj się"}
          </Button>
          <div className="mt-4 text-center text-sm">
            <a
              href="/auth/forgot-password"
              /* TODO: Use Astro's client-side router or a proper Link component if available */ className="underline"
            >
              Nie pamiętasz hasła?
            </a>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};

export default LoginForm;
