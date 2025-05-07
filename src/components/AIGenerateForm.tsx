import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { generateFlashcardsSchema } from "@/types"; // Walidacja Zod
import type { GenerateFlashcardsCommand, GeneratedFlashcardDTO } from "@/types";

interface AIGenerateFormProps {
  // Funkcja do przekazywania wygenerowanych fiszek do komponentu nadrzędnego lub innego komponentu
  onFlashcardsGenerated: (flashcards: GeneratedFlashcardDTO[]) => void;
  // Dodatkowe propsy w razie potrzeby
}

const AIGenerateForm: React.FC<AIGenerateFormProps> = ({ onFlashcardsGenerated }) => {
  const [text, setText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [charCount, setCharCount] = useState<number>(0);

  const MAX_CHARS = generateFlashcardsSchema.shape.text._def.checks.find(c => c.kind === "max")?.value || 5000;
  const MIN_CHARS = generateFlashcardsSchema.shape.text._def.checks.find(c => c.kind === "min")?.value || 10;


  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = event.target.value;
    setText(newText);
    setCharCount(newText.length);
    if (error) {
      setError(null); // Resetuj błąd przy zmianie tekstu
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const validationResult = generateFlashcardsSchema.safeParse({ text });
    if (!validationResult.success) {
      setError(validationResult.error.errors.map(e => e.message).join(", "));
      return;
    }

    setIsLoading(true);
    try {
      // Symulacja wywołania API
      console.log("Wysyłanie tekstu do API:", text);
      // const response = await fetch("/api/flashcards/generate", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ text } as GenerateFlashcardsCommand),
      // });

      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.error?.message || "Nie udało się wygenerować fiszek.");
      // }

      // const generatedFlashcards: GeneratedFlashcardDTO[] = await response.json();
      
      // Placeholder - symulacja odpowiedzi API
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockFlashcards: GeneratedFlashcardDTO[] = [
        { front: "Przykładowy Front 1 z tekstu: " + text.substring(0,10), back: "Przykładowy Tył 1" },
        { front: "Przykładowy Front 2", back: "Przykładowy Tył 2" },
      ];
      
      console.log("Otrzymano fiszki:", mockFlashcards);
      // onFlashcardsGenerated(mockFlashcards); // Odkomentuj, gdy będzie gotowy handler
      
      // Emitowanie zdarzenia do strony Astro - bardziej skomplikowane i wymaga obsługi po stronie Astro
      const customEvent = new CustomEvent('flashcardsGenerated', { detail: { flashcards: mockFlashcards } });
      document.dispatchEvent(customEvent);


    } catch (err: any) {
      setError(err.message || "Wystąpił nieoczekiwany błąd.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 border rounded-lg shadow-sm bg-card">
      <div>
        <Label htmlFor="source-text" className="block text-sm font-medium text-gray-700 mb-1">
          Wprowadź tekst źródłowy do wygenerowania fiszek:
        </Label>
        <Textarea
          id="source-text"
          value={text}
          onChange={handleTextChange}
          placeholder="Wklej tutaj swój tekst, notatki lub artykuł (min. 10 znaków, max. 5000 znaków)..."
          rows={10}
          className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary"
          maxLength={MAX_CHARS}
          required
        />
        <div className="text-sm text-gray-500 mt-1 text-right">
          {charCount}/{MAX_CHARS} znaków (min. {MIN_CHARS})
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive text-destructive rounded-md">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <Button type="submit" disabled={isLoading || charCount < MIN_CHARS || charCount > MAX_CHARS} className="w-full">
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generowanie...
          </>
        ) : (
          "Generuj Fiszki"
        )}
      </Button>
    </form>
  );
};

export default AIGenerateForm; 