import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// TODO: Implement actual form handling and validation (e.g., with react-hook-form and Zod)
// TODO: Implement actual submission logic to call Supabase or API endpoint
// TODO: Implement password strength indicator

const RegisterForm: React.FC = () => {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Rejestracja</CardTitle>
        <CardDescription>Załóż nowe konto, aby korzystać z aplikacji.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="jan.kowalski@example.com" required />
          {/* TODO: Add client-side validation message area */}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Hasło</Label>
          <Input id="password" type="password" required />
          {/* TODO: Add client-side validation message area & password strength */}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Powtórz Hasło</Label>
          <Input id="confirmPassword" type="password" required />
          {/* TODO: Add client-side validation message area */}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch">
        {/* TODO: Add error message display area for general registration errors */}
        <Button type="submit" className="w-full">Zarejestruj się</Button>
        <div className="mt-4 text-center text-sm">
          Masz już konto?{' '}
          <a href="/auth/login" /* TODO: Use Astro's client-side router or a proper Link component if available */ className="underline">
            Zaloguj się
          </a>
        </div>
      </CardFooter>
    </Card>
  );
};

export default RegisterForm; 