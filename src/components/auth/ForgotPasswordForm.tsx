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

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email({ message: "Nieprawidłowy format adresu email." })
    .min(1, { message: "Email jest wymagany." }),
});

type ForgotPasswordFormInputs = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordForm: React.FC = () => {
  console.log("[ForgotPasswordForm] Komponent zamontowany.");
  const [formMessage, setFormMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordFormInputs>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormInputs) => {
    console.log("[ForgotPasswordForm] Próba wysłania formularza zapomnianego hasła dla email:", data.email);
    setIsSubmitting(true);
    setFormMessage(null);

    const formData = new FormData();
    formData.append("email", data.email);

    try {
      console.log("[ForgotPasswordForm] Wysyłanie żądania POST do /api/auth/forgot-password");
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        body: formData,
      });
      console.log(`[ForgotPasswordForm] Otrzymano odpowiedź z API: Status ${response.status}`);
      const result = await response.json();
      console.log("[ForgotPasswordForm] Odpowiedź API (JSON):", result);

      if (!response.ok) {
        // Chociaż API powinno zawsze zwracać 200, obsłużmy na wszelki wypadek
        console.error("[ForgotPasswordForm] Błąd odpowiedzi API:", result.error);
        setFormMessage({ type: "error", message: result.error || "Wystąpił błąd podczas wysyłania żądania." });
      } else {
        console.log("[ForgotPasswordForm] Żądanie wysłane pomyślnie. Komunikat:", result.message);
        setFormMessage({ type: "success", message: result.message });
        reset(); // Resetuj formularz po pomyślnym wysłaniu
      }
    } catch (error: any) {
      console.error("[ForgotPasswordForm] Błąd sieci lub inny błąd podczas wysyłania formularza:", error.message);
      setFormMessage({ type: "error", message: "Nie udało się połączyć z serwerem. Spróbuj ponownie później." });
    }
    setIsSubmitting(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Odzyskiwanie Hasła</CardTitle>
        <CardDescription>Podaj swój adres email, aby otrzymać link do zresetowania hasła.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="jan.kowalski@example.com" {...register("email")} />
            {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch">
          {formMessage && (
            <Alert variant={formMessage.type === "error" ? "destructive" : "default"} className="mb-4">
              <AlertDescription>{formMessage.message}</AlertDescription>
            </Alert>
          )}
          {/* Nie pokazuj przycisku, jeśli żądanie zostało wysłane (aby uniknąć wielokrotnego klikania) */}
          {!(formMessage?.type === "success") && (
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Wysyłanie..." : "Wyślij link do resetowania hasła"}
            </Button>
          )}
          <div className="mt-4 text-center text-sm">
            <a
              href="/auth/login"
              /* TODO: Use Astro's client-side router or a proper Link component if available */ className="underline"
            >
              Wróć do logowania
            </a>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ForgotPasswordForm;
