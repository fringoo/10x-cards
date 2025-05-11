import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// TODO: Implement actual form handling and validation (e.g., with react-hook-form and Zod)
// TODO: Implement actual submission logic to call Supabase or API endpoint

const LoginForm: React.FC = () => {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Logowanie</CardTitle>
        <CardDescription>Zaloguj się, aby uzyskać dostęp do aplikacji.</CardDescription>
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
          {/* TODO: Add client-side validation message area */}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch">
        {/* TODO: Add error message display area for general login errors */}
        <Button type="submit" className="w-full">Zaloguj się</Button>
        <div className="mt-4 text-center text-sm">
          <a href="/forgot-password" /* TODO: Use Astro's client-side router or a proper Link component if available */ className="underline">
            Nie pamiętasz hasła?
          </a>
        </div>
      </CardFooter>
    </Card>
  );
};

export default LoginForm; 