"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Assuming Alert component exists

interface ChangePasswordFormProps {
  // Props if any, e.g., for redirection after success
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newPassword || !confirmPassword) {
      setError("Oba pola hasła są wymagane.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Hasła nie są identyczne.");
      return;
    }

    // Add more complex password validation if needed (e.g., length, special characters)
    // For example:
    // if (newPassword.length < 8) {
    //   setError('Hasło musi mieć co najmniej 8 znaków.');
    //   return;
    // }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Wystąpił błąd podczas zmiany hasła.");
      } else {
        setSuccess("Hasło zostało pomyślnie zmienione.");
        setNewPassword("");
        setConfirmPassword("");
        // Optionally redirect or perform other actions
      }
    } catch (err) {
      console.error("Change password error:", err);
      setError("Nie udało się połączyć z serwerem. Spróbuj ponownie później.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto p-6 border rounded-lg shadow-sm bg-card">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Błąd</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert variant="default">
          {" "}
          {/* Or a 'success' variant if available */}
          <AlertTitle>Sukces</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="newPassword">Nowe hasło</Label>
        <Input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Potwierdź nowe hasło</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Zmienianie..." : "Zmień hasło"}
      </Button>
    </form>
  );
};

export default ChangePasswordForm;
