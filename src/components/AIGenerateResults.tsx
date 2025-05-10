import React, { useState, useEffect } from "react";
import type { GeneratedFlashcardDTO } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Local interface extending GeneratedFlashcardDTO to include UI-specific state
interface EditableFlashcard extends GeneratedFlashcardDTO {
  modified?: boolean;
  id?: string | number; // Assuming an ID might be useful, using index as key for now
}

interface AIGenerateResultsProps {
  generatedFlashcards: GeneratedFlashcardDTO[];
}

const AIGenerateResults: React.FC<AIGenerateResultsProps> = ({ generatedFlashcards: initialFlashcards }) => {
  const [flashcards, setFlashcards] = useState<EditableFlashcard[]>(
    initialFlashcards.map((card, index) => ({ ...card, id: index })) // Add an ID for keying if needed
  );
  const [selectedFlashcards, setSelectedFlashcards] = useState<EditableFlashcard[]>([]);
  const [editingFlashcardIndex, setEditingFlashcardIndex] = useState<number | null>(null);
  const [currentEdit, setCurrentEdit] = useState<{ front: string; back: string } | null>(null);

  useEffect(() => {
    const handleNewFlashcards = (event: Event) => {
      const customEvent = event as CustomEvent<{ flashcards: GeneratedFlashcardDTO[] }>;
      if (customEvent.detail && customEvent.detail.flashcards) {
        console.log("[AIGenerateResults] Received new flashcards via event:", customEvent.detail.flashcards);
        setFlashcards(customEvent.detail.flashcards.map((card, index) => ({ ...card, id: index, modified: false })));
        setSelectedFlashcards([]);
        setEditingFlashcardIndex(null); // Reset editing state when new cards arrive
        setCurrentEdit(null);
      }
    };

    console.log("[AIGenerateResults] Adding event listener for 'flashcardsGenerated'.");
    document.addEventListener("flashcardsGenerated", handleNewFlashcards);

    return () => {
      console.log("[AIGenerateResults] Removing event listener for 'flashcardsGenerated'.");
      document.removeEventListener("flashcardsGenerated", handleNewFlashcards);
    };
  }, []);

  const handleEditClick = (index: number) => {
    setEditingFlashcardIndex(index);
    setCurrentEdit({ front: flashcards[index].front, back: flashcards[index].back });
  };

  const handleCancelEdit = () => {
    setEditingFlashcardIndex(null);
    setCurrentEdit(null);
  };

  const handleConfirmEdit = () => {
    if (editingFlashcardIndex !== null && currentEdit) {
      const updatedFlashcards = [...flashcards];
      updatedFlashcards[editingFlashcardIndex] = {
        ...updatedFlashcards[editingFlashcardIndex],
        front: currentEdit.front,
        back: currentEdit.back,
        modified: true,
      };
      setFlashcards(updatedFlashcards);
      setEditingFlashcardIndex(null);
      setCurrentEdit(null);
      console.log("[AIGenerateResults] Flashcard at index", editingFlashcardIndex, "confirmed edit.");
    }
  };

  const handleCurrentEditChange = (field: "front" | "back", value: string) => {
    if (currentEdit) {
      setCurrentEdit({ ...currentEdit, [field]: value });
    }
  };

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

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTitle>Wygenerowane Fiszki ({flashcards.length})</AlertTitle>
        <AlertDescription>Przejrzyj poniższe fiszki. Możesz je zaakceptować, edytować lub odrzucić.</AlertDescription>
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
          <Card
            key={card.id || index}
            className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col"
          >
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex justify-between items-center">
                <span>Flashcard #{index + 1}</span>
                {card.modified && (
                  <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    ZMODYFIKOWANA
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 flex-grow">
              {editingFlashcardIndex === index ? (
                <>
                  <div>
                    <Label
                      htmlFor={`edit-front-${index}`}
                      className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1"
                    >
                      Front
                    </Label>
                    <Textarea
                      id={`edit-front-${index}`}
                      value={currentEdit?.front || ""}
                      onChange={(e) => handleCurrentEditChange("front", e.target.value)}
                      className="min-h-[6em] text-sm"
                    />
                  </div>
                  <div className="border-t pt-3">
                    <Label
                      htmlFor={`edit-back-${index}`}
                      className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1"
                    >
                      Back
                    </Label>
                    <Textarea
                      id={`edit-back-${index}`}
                      value={currentEdit?.back || ""}
                      onChange={(e) => handleCurrentEditChange("back", e.target.value)}
                      className="min-h-[6em] text-sm"
                    />
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
            </CardContent>
            <div className="p-3 border-t flex-shrink-0 flex justify-end space-x-2 bg-muted/30">
              {editingFlashcardIndex === index ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                    Anuluj
                  </Button>
                  <Button variant="default" size="sm" onClick={handleConfirmEdit}>
                    Zatwierdź
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => console.log("Odrzuć", card)}>
                    Odrzuć
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleEditClick(index)}>
                    Edytuj
                  </Button>
                  <Button variant="default" size="sm" onClick={() => console.log("Zaakceptuj", card)}>
                    Zaakceptuj
                  </Button>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AIGenerateResults;
