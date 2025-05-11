import React, { useState, useEffect, useCallback } from 'react';
import type { CollectionBasicInfo, FlashcardDetailsDTO } from '@/lib/services/collection.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"; // Może być potrzebne do edycji
// TODO: Rozważyć Dialog do potwierdzenia usunięcia
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogClose,
// } from "@/components/ui/dialog";

// Typy dla stanu komponentu
interface EditingFlashcardState {
  id: string;
  front: string;
  back: string;
}

const CollectionManager: React.FC = () => {
  const [collections, setCollections] = useState<CollectionBasicInfo[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardDetailsDTO[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState<boolean>(false);
  const [isLoadingFlashcards, setIsLoadingFlashcards] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [editingFlashcard, setEditingFlashcard] = useState<EditingFlashcardState | null>(null);
  const [updatingFlashcardId, setUpdatingFlashcardId] = useState<string | null>(null); // Do śledzenia ładowania konkretnej fiszki

  // Pobieranie kolekcji użytkownika
  const fetchCollections = useCallback(async () => {
    setIsLoadingCollections(true);
    setError(null);
    try {
      const response = await fetch('/api/collections');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data: CollectionBasicInfo[] = await response.json();
      setCollections(data);
    } catch (e: any) {
      console.error("Błąd podczas pobierania kolekcji:", e);
      setError(e.message || 'Nie udało się pobrać kolekcji.');
      setCollections([]); // Wyczyść kolekcje w przypadku błędu
    } finally {
      setIsLoadingCollections(false);
    }
  }, []);

  // Pobieranie fiszek dla wybranej kolekcji
  const fetchFlashcards = useCallback(async (collectionId: string) => {
    if (!collectionId) return;
    setIsLoadingFlashcards(true);
    setError(null);
    try {
      const response = await fetch(`/api/collections/${collectionId}/flashcards`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data: FlashcardDetailsDTO[] = await response.json();
      setFlashcards(data);
    } catch (e: any) {
      console.error(`Błąd podczas pobierania fiszek dla kolekcji ${collectionId}:`, e);
      setError(e.message || 'Nie udało się pobrać fiszek.');
      setFlashcards([]); // Wyczyść fiszki w przypadku błędu
    } finally {
      setIsLoadingFlashcards(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  useEffect(() => {
    if (selectedCollectionId) {
      setFlashcards([]); // Wyczyść poprzednie fiszki przed załadowaniem nowych
      fetchFlashcards(selectedCollectionId);
    } else {
      setFlashcards([]); // Wyczyść fiszki, jeśli żadna kolekcja nie jest wybrana
    }
  }, [selectedCollectionId, fetchFlashcards]);

  // --- Obsługa Edycji --- 
  const handleEditClick = (flashcard: FlashcardDetailsDTO) => {
    setEditingFlashcard({ id: flashcard.id, front: flashcard.front, back: flashcard.back });
  };

  const handleCancelEdit = () => {
    setEditingFlashcard(null);
  };

  const handleSaveEdit = async () => {
    if (!editingFlashcard) return;
    setError(null);
    setUpdatingFlashcardId(editingFlashcard.id);
    try {
      const response = await fetch(`/api/flashcards/${editingFlashcard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          front: editingFlashcard.front, 
          back: editingFlashcard.back, 
          ai_modified_by_user: true // Edycja treści zawsze oznacza modyfikację przez użytkownika
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const updatedFlashcard: FlashcardDetailsDTO = await response.json();
      setFlashcards(prevFlashcards => 
        prevFlashcards.map(fc => fc.id === updatedFlashcard.id ? updatedFlashcard : fc)
      );
      setEditingFlashcard(null);
    } catch (e: any) {
      console.error(`Błąd podczas zapisywania fiszki ${editingFlashcard.id}:`, e);
      setError(e.message || 'Nie udało się zapisać zmian w fiszce.');
    } finally {
      setUpdatingFlashcardId(null);
    }
  };

  const handleEditingChange = (field: 'front' | 'back', value: string) => {
    if (editingFlashcard) {
      setEditingFlashcard(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  // --- Obsługa Usuwania --- 
  const handleDeleteClick = async (flashcardId: string) => {
    // TODO: Dodać modal potwierdzenia
    if (!confirm("Czy na pewno chcesz usunąć tę fiszkę? Tej operacji nie można cofnąć.")) {
      return;
    }
    setError(null);
    setUpdatingFlashcardId(flashcardId);
    try {
      const response = await fetch(`/api/flashcards/${flashcardId}`, {
        method: 'DELETE',
      });
      if (!response.ok && response.status !== 204) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      setFlashcards(prevFlashcards => prevFlashcards.filter(fc => fc.id !== flashcardId));
    } catch (e: any) {
      console.error(`Błąd podczas usuwania fiszki ${flashcardId}:`, e);
      setError(e.message || 'Nie udało się usunąć fiszki.');
    } finally {
      setUpdatingFlashcardId(null);
    }
  };
  
  const handleApprovalStatusChange = async (flashcardId: string, newStatus: 'approved' | 'rejected') => {
    setError(null);
    setUpdatingFlashcardId(flashcardId);
    try {
      const response = await fetch(`/api/flashcards/${flashcardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_approval_status: newStatus }), 
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const updatedFlashcard: FlashcardDetailsDTO = await response.json();
      setFlashcards(prevFlashcards => 
        prevFlashcards.map(fc => fc.id === updatedFlashcard.id ? updatedFlashcard : fc)
      );
    } catch (e: any) {
      console.error(`Błąd podczas aktualizacji statusu fiszki ${flashcardId}:`, e);
      setError(e.message || 'Nie udało się zaktualizować statusu fiszki.');
    } finally {
      setUpdatingFlashcardId(null);
    }
  };

  // --- Renderowanie --- 

  if (isLoadingCollections) {
    return <div className="text-center p-4">Ładowanie kolekcji...</div>;
  }

  // Renderowanie głównego błędu (np. problem z pobraniem kolekcji)
  if (error && collections.length === 0) {
      return <Alert variant="destructive" className="my-4">
          <AlertTitle>Błąd</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
      </Alert>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="collection-select" className="text-sm font-medium">Wybierz kolekcję:</Label>
        <Select 
          value={selectedCollectionId || ''} 
          onValueChange={(value: string) => setSelectedCollectionId(value === '' ? null : value)}
          disabled={collections.length === 0 || isLoadingCollections}
        >
          <SelectTrigger id="collection-select" className="w-full md:w-[300px] mt-1">
            <SelectValue placeholder="Wybierz kolekcję..." />
          </SelectTrigger>
          <SelectContent>
            {isLoadingCollections ? (
                <SelectItem value="" disabled>Ładowanie...</SelectItem>
            ) : collections.length === 0 ? (
                <SelectItem value="" disabled>Brak dostępnych kolekcji</SelectItem>
            ) : (
                collections.map(col => (
                <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>
                ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Komunikat o błędzie podczas ładowania fiszek lub operacji na fiszkach */}
      {error && <Alert variant="destructive" className="my-2">
          <AlertTitle>Błąd</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
      </Alert>}

      {isLoadingFlashcards && <div className="text-center p-4">Ładowanie fiszek...</div>}

      {!isLoadingFlashcards && selectedCollectionId && flashcards.length === 0 && (
        <div className="text-center py-10 bg-muted/30 p-6 rounded-lg border border-dashed mt-4">
          <h3 className="text-xl font-semibold text-muted-foreground mb-2">Brak fiszek w tej kolekcji</h3>
          <p className="text-muted-foreground">Ta kolekcja jest pusta lub nie udało się załadować fiszek.</p>
        </div>
      )}

      {flashcards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {flashcards.map(fc => (
            <Card key={fc.id} className="flex flex-col">
              <CardHeader className="pb-3">
                {editingFlashcard?.id === fc.id ? (
                  <CardTitle className="text-lg">Edytujesz fiszkę...</CardTitle>
                ) : (
                  <CardTitle className="text-lg truncate" title={fc.front}> {/* Pokaż tylko część przodu */}
                    {fc.front.substring(0, 100) + (fc.front.length > 100 ? '...' : '')}
                  </CardTitle>
                )}
                <div className="flex space-x-2 pt-1 flex-wrap gap-y-1">
                    {fc.source === 'ai' && (
                        <Badge 
                            variant={fc.ai_approval_status === 'rejected' ? 'destructive' : fc.ai_approval_status === 'pending' || !fc.ai_approval_status ? 'secondary' : 'default'}
                            className={fc.ai_approval_status === 'approved' ? 'bg-green-100 text-green-700 border border-green-300' : ''}
                        >
                            AI: {fc.ai_approval_status || 'pending'}
                        </Badge>
                    )}
                    {fc.ai_modified_by_user && (
                        <Badge variant="outline">Zmodyfikowana</Badge>
                    )}
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                {editingFlashcard?.id === fc.id ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor={`edit-front-${fc.id}`}>Przód</Label>
                      <Textarea 
                        id={`edit-front-${fc.id}`}
                        value={editingFlashcard.front} 
                        onChange={e => handleEditingChange('front', e.target.value)} 
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-back-${fc.id}`}>Tył</Label>
                      <Textarea 
                        id={`edit-back-${fc.id}`}
                        value={editingFlashcard.back} 
                        onChange={e => handleEditingChange('back', e.target.value)} 
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground min-h-[60px]">
                    {fc.back.substring(0, 150) + (fc.back.length > 150 ? '...' : '')}
                  </p>
                )}
              </CardContent>
              <div className="p-4 pt-2 border-t mt-auto">
                {editingFlashcard?.id === fc.id ? (
                  <div className="flex justify-end space-x-2 mt-2">
                    <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={updatingFlashcardId === fc.id}>Anuluj</Button>
                    <Button size="sm" onClick={handleSaveEdit} disabled={updatingFlashcardId === fc.id}>
                      {updatingFlashcardId === fc.id && editingFlashcard ? 'Zapisywanie...' : 'Zapisz'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditClick(fc)} disabled={!!updatingFlashcardId}>Edytuj</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(fc.id)} disabled={!!updatingFlashcardId}>
                            {updatingFlashcardId === fc.id && !editingFlashcard ? 'Usuwanie...' : 'Usuń'}
                        </Button>
                    </div>
                    {fc.source === 'ai' && (
                        <div className="flex justify-end space-x-2 pt-2 border-t mt-2">
                            <Button 
                                variant={fc.ai_approval_status === 'approved' ? "default" : "outline"} 
                                size="sm" 
                                onClick={() => handleApprovalStatusChange(fc.id, 'approved')} 
                                disabled={!!updatingFlashcardId || fc.ai_approval_status === 'approved'}
                                className={fc.ai_approval_status === 'approved' ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                            >
                                {updatingFlashcardId === fc.id ? '...' : 'Zaakceptuj'}
                            </Button>
                            <Button 
                                variant={fc.ai_approval_status === 'rejected' ? "destructive" : "outline"} 
                                size="sm" 
                                onClick={() => handleApprovalStatusChange(fc.id, 'rejected')} 
                                disabled={!!updatingFlashcardId || fc.ai_approval_status === 'rejected'}
                            >
                                {updatingFlashcardId === fc.id ? '...' : 'Odrzuć'}
                            </Button>
                        </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollectionManager; 