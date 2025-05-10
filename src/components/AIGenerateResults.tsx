import React, { useState, useEffect } from "react";
import type { GeneratedFlashcardDTO } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AIGenerateResultsProps {
  generatedFlashcards: GeneratedFlashcardDTO[]; // For initial flashcards, though events are primary update mechanism
}

const AIGenerateResults: React.FC<AIGenerateResultsProps> = ({ generatedFlashcards: initialFlashcards }) => {
  const [flashcards, setFlashcards] = useState<GeneratedFlashcardDTO[]>(initialFlashcards);
  const [selectedFlashcards, setSelectedFlashcards] = useState<GeneratedFlashcardDTO[]>([]);

  useEffect(() => {
    const handleNewFlashcards = (event: Event) => {
      const customEvent = event as CustomEvent<{ flashcards: GeneratedFlashcardDTO[] }>;
      if (customEvent.detail && customEvent.detail.flashcards) {
        console.log("[AIGenerateResults] Received new flashcards via event:", customEvent.detail.flashcards);
        setFlashcards(customEvent.detail.flashcards);
        setSelectedFlashcards([]); // Resetuj zaznaczenie po otrzymaniu nowych fiszek
      }
    };

    console.log("[AIGenerateResults] Adding event listener for 'flashcardsGenerated'.");
    document.addEventListener("flashcardsGenerated", handleNewFlashcards);

    // Cleanup listener on component unmount
    return () => {
      console.log("[AIGenerateResults] Removing event listener for 'flashcardsGenerated'.");
      document.removeEventListener("flashcardsGenerated", handleNewFlashcards);
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount and cleans up on unmount

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="text-center py-10 bg-muted/30 p-6 rounded-lg border border-dashed">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mx-auto mb-4 text-muted-foreground"
        >
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
          <circle cx="12" cy="10" r="3"></circle>
          <path d="M12 2L12 4"></path>
          <path d="M12 20L12 22"></path>
          <path d="M20 12L22 12"></path>
          <path d="M2 12L4 12"></path>
          <path d="M18.3645 18.3645L19.7787 19.7787"></path>
          <path d="M4.2218 4.2218L5.63601 5.63601"></path>
          <path d="M18.3645 5.63601L19.7787 4.2218"></path>
          <path d="M4.2218 19.7787L5.63601 18.3645"></path>
        </svg>
        <h3 className="text-xl font-semibold text-muted-foreground mb-2">No Flashcards Yet</h3>
        <p className="text-muted-foreground">
          Your generated flashcards will appear here once you submit some text above.
        </p>
      </div>
    );
  }

  // TODO: Dodać logikę dla akcji: Zatwierdź, Edytuj, Odrzuć, Zapisz zaakceptowane, Zapisz wszystkie

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTitle>Wygenerowane Fiszki ({flashcards.length})</AlertTitle>
        <AlertDescription>
          Przejrzyj poniższe fiszki. Możesz je zaakceptować, edytować (funkcja wkrótce) lub odrzucić.
        </AlertDescription>
      </Alert>

      <div className="space-y-2 mb-4 flex flex-wrap gap-2">
        <Button
          onClick={() => console.log("Zapisz zaakceptowane", selectedFlashcards)}
          variant="outline"
          size="sm"
          disabled={selectedFlashcards.length === 0}
        >
          Zapisz Zaakceptowane ({selectedFlashcards.length})
        </Button>
        <Button onClick={() => console.log("Zapisz wszystkie", flashcards)} variant="default" size="sm">
          Zapisz Wszystkie ({flashcards.length})
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {flashcards.map((card, index) => (
          <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle>Flashcard #{index + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  Front
                </CardDescription>
                <p className="text-card-foreground min-h-[4em]">{card.front}</p>
              </div>
              <div className="border-t pt-3">
                <CardDescription className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  Back
                </CardDescription>
                <p className="text-card-foreground min-h-[4em]">{card.back}</p>
              </div>
            </CardContent>
            <div className="p-3 border-t flex justify-end space-x-2 bg-muted/30">
              {/* TODO: Dodać logikę zaznaczania fiszek */}
              <Button variant="outline" size="sm" onClick={() => console.log("Odrzuć", card)}>
                Odrzuć
              </Button>
              <Button variant="secondary" size="sm" onClick={() => console.log("Edytuj", card)}>
                Edytuj
              </Button>
              <Button variant="default" size="sm" onClick={() => console.log("Zaakceptuj", card)}>
                Zaakceptuj
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AIGenerateResults;
