import React, { useEffect, useState } from 'react';
import type { GeneratedFlashcardDTO } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AIGenerateResultsProps {
  generatedFlashcardsInitial?: GeneratedFlashcardDTO[];
}

const AIGenerateResults: React.FC<AIGenerateResultsProps> = ({ generatedFlashcardsInitial = [] }) => {
  const [flashcards, setFlashcards] = useState<GeneratedFlashcardDTO[]>(generatedFlashcardsInitial);
  const [selectedFlashcards, setSelectedFlashcards] = useState<GeneratedFlashcardDTO[]>([]);

  useEffect(() => {
    const handleFlashcards = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.flashcards) {
        setFlashcards(customEvent.detail.flashcards);
        setSelectedFlashcards([]); // Resetuj zaznaczenie po otrzymaniu nowych fiszek
      }
    };

    document.addEventListener('flashcardsGenerated', handleFlashcards);
    return () => {
      document.removeEventListener('flashcardsGenerated', handleFlashcards);
    };
  }, []);

  if (!flashcards.length) {
    return (
      <div className="p-6 border rounded-lg shadow-sm bg-card text-center text-muted-foreground">
        <p>Wygenerowane fiszki pojawią się tutaj.</p>
        <p className="text-sm">Wprowadź tekst powyżej i kliknij "Generuj Fiszki".</p>
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
        <Button onClick={() => console.log("Zapisz zaakceptowane", selectedFlashcards)} variant="outline" size="sm" disabled={selectedFlashcards.length === 0}>
          Zapisz Zaakceptowane ({selectedFlashcards.length})
        </Button>
        <Button onClick={() => console.log("Zapisz wszystkie", flashcards)} variant="default" size="sm">
          Zapisz Wszystkie ({flashcards.length})
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {flashcards.map((card, index) => (
          <Card key={index} className="flex flex-col">
            <CardHeader>
              <CardTitle>Fiszka #{index + 1}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow space-y-3 p-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">PRZÓD</p>
                <p className="text-sm p-3 border rounded bg-background min-h-[60px]">{card.front}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">TYŁ</p>
                <p className="text-sm p-3 border rounded bg-background min-h-[60px]">{card.back}</p>
              </div>
            </CardContent>
            <div className="p-3 border-t flex justify-end space-x-2 bg-muted/30">
                {/* TODO: Dodać logikę zaznaczania fiszek */}
                <Button variant="outline" size="sm" onClick={() => console.log("Odrzuć", card)}>Odrzuć</Button>
                <Button variant="secondary" size="sm" onClick={() => console.log("Edytuj", card)}>Edytuj</Button>
                <Button variant="default" size="sm" onClick={() => console.log("Zaakceptuj", card)}>Zaakceptuj</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AIGenerateResults; 