import React, { useState, useEffect, useCallback } from "react";
import type { SystemStatistics } from "@/lib/services/statistics.service"; // Importujemy główny typ
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress"; // Do wyświetlania np. współczynnika akceptacji

const StatisticsDashboard: React.FC = () => {
  const [stats, setStats] = useState<SystemStatistics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/statistics");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data: SystemStatistics = await response.json();
      setStats(data);
    } catch (e: any) {
      console.error("Błąd podczas pobierania statystyk systemowych:", e);
      setError(e.message || "Nie udało się pobrać statystyk systemowych.");
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  if (isLoading) {
    return <div className="text-center p-10">Ładowanie statystyk...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-6">
        <AlertTitle>Błąd ładowania statystyk</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!stats) {
    return <div className="text-center p-10">Brak dostępnych statystyk.</div>;
  }

  const { flashcardStats, engagementStats } = stats;

  return (
    <div className="space-y-6">
      {/* Statystyki Fiszki */}
      <Card>
        <CardHeader>
          <CardTitle>Statystyki Fiszek</CardTitle>
          <CardDescription>Ogólne informacje o fiszkach w systemie.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Całkowita liczba fiszek:</span>
            <span className="font-semibold text-lg">{flashcardStats.totalFlashcards}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Fiszki stworzone przez AI:</span>
            <span className="font-semibold text-lg">{flashcardStats.aiFlashcards}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Fiszki stworzone ręcznie:</span>
            <span className="font-semibold text-lg">{flashcardStats.manualFlashcards}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Zaakceptowane fiszki AI:</span>
            <span className="font-semibold text-lg">{flashcardStats.aiFlashcardsAccepted}</span>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-muted-foreground">Procent akceptacji fiszek AI:</span>
              <span className="font-semibold text-sm">
                {flashcardStats.aiAcceptanceRate !== null ? `${flashcardStats.aiAcceptanceRate.toFixed(2)}%` : "N/A"}
              </span>
            </div>
            {flashcardStats.aiAcceptanceRate !== null && (
              <Progress value={flashcardStats.aiAcceptanceRate} className="h-2" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statystyki Zaangażowania (MVP - tylko całkowita liczba kolekcji) */}
      <Card>
        <CardHeader>
          <CardTitle>Statystyki Zaangażowania</CardTitle>
          <CardDescription>Informacje o aktywności w systemie.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Całkowita liczba kolekcji fiszek:</span>
            <span className="font-semibold text-lg">{engagementStats.totalCollections}</span>
          </div>
          {/* Miejsce na przyszłe statystyki np. sesji nauki */}
        </CardContent>
      </Card>
    </div>
  );
};

export default StatisticsDashboard;
