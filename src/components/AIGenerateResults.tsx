import React, { useState, useEffect } from "react";
import type {
  GeneratedFlashcardDTO,
  FlashcardInCollectionDTO,
  SaveFlashcardCollectionCommand,
  SaveFlashcardCollectionResponseDTO,
} from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// Local interface extending GeneratedFlashcardDTO to include UI-specific state
interface EditableFlashcard extends GeneratedFlashcardDTO {
  id: string | number; // Using index as key for now
  modified?: boolean;
  approvalStatus: "pending" | "accepted" | "rejected"; // Status relative to AI generation
}

interface AIGenerateResultsProps {
  generatedFlashcards: GeneratedFlashcardDTO[];
}

const AIGenerateResults: React.FC<AIGenerateResultsProps> = ({ generatedFlashcards: initialFlashcards }) => {
  const [flashcards, setFlashcards] = useState<EditableFlashcard[]>(
    initialFlashcards.map((card, index) => ({ ...card, id: index, modified: false, approvalStatus: "pending" }))
  );
  // const [selectedFlashcards, setSelectedFlashcards] = useState<EditableFlashcard[]>([]); // Commented out: unused for now
  const [editingFlashcardIndex, setEditingFlashcardIndex] = useState<number | null>(null);
  const [currentEdit, setCurrentEdit] = useState<{ front: string; back: string } | null>(null);

  // State for Save Collection Modal
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [collectionName, setCollectionName] = useState("");
  const [flashcardsToSave, setFlashcardsToSave] = useState<EditableFlashcard[] | null>(null);
  const [saveMode, setSaveMode] = useState<"accepted" | "all" | null>(null);
  const [isSaving, setIsSaving] = useState(false); // For loading state on save button

  useEffect(() => {
    const handleNewFlashcards = (event: Event) => {
      const customEvent = event as CustomEvent<{ flashcards: GeneratedFlashcardDTO[] }>;
      if (customEvent.detail && customEvent.detail.flashcards) {
        console.log("[AIGenerateResults] Received new flashcards via event:", customEvent.detail.flashcards);
        setFlashcards(
          customEvent.detail.flashcards.map((card, index) => ({
            ...card,
            id: index,
            modified: false,
            approvalStatus: "pending",
          }))
        );
        // setSelectedFlashcards([]); // Commented out
        setEditingFlashcardIndex(null);
        setCurrentEdit(null);
        // Reset save modal related states if new cards arrive
        setIsSaveModalOpen(false);
        setCollectionName("");
        setFlashcardsToSave(null);
        setSaveMode(null);
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
      const updatedFlashcards = flashcards.map((card, index) =>
        index === editingFlashcardIndex
          ? { ...card, front: currentEdit.front, back: currentEdit.back, modified: true }
          : card
      );
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

  const handleApprovalChange = (indexToUpdate: number, status: "accepted" | "rejected") => {
    setFlashcards((prevFlashcards) =>
      prevFlashcards.map((card, index) => (index === indexToUpdate ? { ...card, approvalStatus: status } : card))
    );
    console.log(`[AIGenerateResults] Flashcard at index ${indexToUpdate} status changed to ${status}.`);
  };

  const openSaveDialog = (mode: "accepted" | "all") => {
    setSaveMode(mode);
    if (mode === "accepted") {
      setFlashcardsToSave(flashcards.filter((f) => f.approvalStatus === "accepted"));
    } else {
      setFlashcardsToSave(flashcards);
    }
    setCollectionName(""); // Reset name field
    setIsSaveModalOpen(true);
  };

  const handleSaveCollection = async () => {
    if (!collectionName.trim()) {
      alert("Nazwa kolekcji nie może być pusta."); // Simple validation for now
      return;
    }
    if (!flashcardsToSave || flashcardsToSave.length === 0) {
      alert("Brak fiszek do zapisania.");
      setIsSaveModalOpen(false);
      return;
    }

    setIsSaving(true);

    const commandBody: SaveFlashcardCollectionCommand = {
      collectionName: collectionName.trim(),
      flashcards: flashcardsToSave.map((fc) => ({
        front: fc.front,
        back: fc.back,
        source: "ai", // Assuming all are AI for now
        aiGeneratedDetails: {
          modified: !!fc.modified, // Ensure boolean
          approvalStatus: fc.approvalStatus,
        },
      })),
    };

    try {
      console.log("[AIGenerateResults] Attempting to save collection:", commandBody);
      const response = await fetch("/api/collections/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commandBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: "Nieznany błąd serwera" } }));
        console.error("[AIGenerateResults] API error saving collection:", errorData);
        alert(`Błąd zapisu kolekcji: ${errorData.error?.message || response.statusText}`);
        // Do not close modal on API error, allow user to retry or cancel
        return; // Return early to keep modal open
      }

      const result: SaveFlashcardCollectionResponseDTO = await response.json();
      console.log("[AIGenerateResults] Collection saved successfully:", result);
      alert(result.message || `Kolekcja "${commandBody.collectionName}" zapisana pomyślnie!`);

      // Optionally, reset/clear the generated cards from UI after successful save
      // setFlashcards([]);
      // Or trigger an event to inform parent page
    } catch (error) {
      console.error("[AIGenerateResults] Network or other error saving collection:", error);
      alert("Wystąpił błąd sieci lub inny problem podczas zapisu kolekcji.");
      // Do not close modal on error
      return; // Return early to keep modal open
    } finally {
      setIsSaving(false);
      // Only close modal and reset if successful or if explicitly cancelled by user (DialogClose handles cancel)
      // If we reached here after a successful save, close and reset.
      // The error cases above return early.
      if (document.querySelector('[data-state="open"]')) {
        // Check if modal is still programmatically open
        // This check might be tricky; successful save path should handle closing.
      }
      // Reset states IF a successful save happened.
      // The modal will be closed by setting isSaveModalOpen to false, or DialogClose for cancel.
      // We should only fully reset if the operation was definitively successful and we want to clear form.
      // For now, let's only close it explicitly after successful alert.
      setIsSaveModalOpen(false);
      setCollectionName("");
      setFlashcardsToSave(null);
      setSaveMode(null);
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

  const getStatusBadge = (card: EditableFlashcard) => {
    let label = "";
    let customClasses = "text-xs whitespace-nowrap"; // Base classes for all badges

    if (card.approvalStatus === "accepted") {
      label = card.modified ? "Zmodyfikowana i Zaakceptowana" : "AI - Zaakceptowana";
      // Apply green styling for accepted states
      customClasses += " bg-green-100 text-green-700 border border-green-300";
    } else if (card.approvalStatus === "rejected") {
      label = card.modified ? "Zmodyfikowana i Odrzucona" : "AI - Odrzucona";
      // Apply red styling for rejected states (using destructive variant might be an option too)
      customClasses += " bg-red-100 text-red-700 border border-red-300";
    } else if (card.modified) {
      // Pending, but modified
      label = "Zmodyfikowana (oczekuje)";
      // Apply blue/default styling for modified & pending states
      customClasses += " bg-blue-100 text-blue-700 border border-blue-300";
    } else {
      return null; // No badge for default pending (unmodified) AI card
    }
    // Using Badge component with a base variant (like outline or default) and then applying custom classes for specific colors
    return (
      <Badge variant="outline" className={customClasses}>
        {label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTitle>Wygenerowane Fiszki ({flashcards.length})</AlertTitle>
        <AlertDescription>Przejrzyj poniższe fiszki. Możesz je zaakceptować, edytować lub odrzucić.</AlertDescription>
      </Alert>

      <Dialog open={isSaveModalOpen} onOpenChange={setIsSaveModalOpen}>
        <div className="space-y-2 mb-4 flex flex-wrap gap-2">
          <Button
            onClick={() => openSaveDialog("accepted")}
            variant="outline"
            size="sm"
            disabled={flashcards.filter((f) => f.approvalStatus === "accepted").length === 0 || isSaving}
          >
            Zapisz Zaakceptowane ({flashcards.filter((f) => f.approvalStatus === "accepted").length})
          </Button>
          <Button
            onClick={() => openSaveDialog("all")}
            variant="default"
            size="sm"
            disabled={flashcards.length === 0 || isSaving}
          >
            Zapisz Wszystkie ({flashcards.length})
          </Button>
        </div>

        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Zapisz kolekcję fiszek</DialogTitle>
            <DialogDescription>
              Podaj nazwę dla swojej nowej kolekcji fiszek. Tryb:{" "}
              {saveMode === "accepted" ? "Tylko zaakceptowane" : "Wszystkie wygenerowane"}. Liczba fiszek do zapisania:{" "}
              {flashcardsToSave?.length || 0}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="collection-name" className="text-right">
                Nazwa
              </Label>
              <Input
                id="collection-name"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                className="col-span-3"
                placeholder="Np. TypeScript - zaawansowane koncepty"
                disabled={isSaving}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSaving}>
                Anuluj
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={handleSaveCollection}
              disabled={!collectionName.trim() || (flashcardsToSave?.length || 0) === 0 || isSaving}
            >
              {isSaving ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Zapisywanie...
                </>
              ) : (
                "Zapisz kolekcję"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {flashcards.map((card, index) => (
          <Card
            key={card.id || index}
            className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col"
          >
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex justify-between items-start gap-2">
                <span>Flashcard #{index + 1}</span>
                <div className="flex flex-col items-end gap-1">{getStatusBadge(card)}</div>
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
                      rows={4}
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
                      rows={4}
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
                  <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={isSaving}>
                    Anuluj
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleConfirmEdit}
                    disabled={!currentEdit?.front.trim() || !currentEdit?.back.trim() || isSaving}
                  >
                    Zatwierdź
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApprovalChange(index, "rejected")}
                    disabled={card.approvalStatus === "rejected" || isSaving}
                  >
                    {card.approvalStatus === "rejected" ? "Odrzucona" : "Odrzuć"}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEditClick(index)}
                    disabled={card.approvalStatus === "accepted" || card.approvalStatus === "rejected" || isSaving}
                  >
                    Edytuj
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleApprovalChange(index, "accepted")}
                    disabled={card.approvalStatus === "accepted" || isSaving}
                  >
                    {card.approvalStatus === "accepted" ? "Zaakceptowana" : "Zaakceptuj"}
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
