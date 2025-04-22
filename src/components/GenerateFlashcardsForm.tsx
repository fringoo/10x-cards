import React, { useState } from "react";
import { useForm, type ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { generateFlashcardsSchema } from "@/types"; // Assuming types.ts uses export const
import { Card, CardContent } from "@/components/ui/card";

// Use z.input to get the type before defaults are applied
type GenerateFlashcardsFormInput = z.input<typeof generateFlashcardsSchema>;
// Use z.output for the validated type after defaults
// We might not strictly need this output type if onSubmit receives input type
// type GenerateFlashcardsFormOutput = z.output<typeof generateFlashcardsSchema>;

export function GenerateFlashcardsForm() {
  // State for API error messages
  const [apiError, setApiError] = useState<string | null>(null);

  // Use the input type for useForm
  const form = useForm<GenerateFlashcardsFormInput>({
    resolver: zodResolver(generateFlashcardsSchema),
    defaultValues: {
      text: "",
      // maxCards is optional in input, Zod handles default
    },
    mode: "onChange", // Validate on change for better UX
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = form;

  // Watch the text field to calculate length for the description
  const textValue = watch("text");
  const currentLength = textValue?.length || 0;
  // Extract max length safely from Zod schema definition
  const maxLengthCheck = generateFlashcardsSchema.shape.text._def.checks.find((check) => check.kind === "max");
  const maxLength =
    typeof maxLengthCheck === "object" && maxLengthCheck !== null && "value" in maxLengthCheck
      ? maxLengthCheck.value
      : 5000;

  // Submit handler with API integration and debug logging
  async function onSubmit(values: GenerateFlashcardsFormInput) {
    console.log("Submitting...", values);
    setApiError(null);
    const validatedValues = values as z.output<typeof generateFlashcardsSchema>;
    console.log("Prepared payload:", validatedValues);
    try {
      const res = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedValues),
      });
      console.log("API response:", res);
      const data = await res.json();
      if (!res.ok) {
        console.error("API error:", data);
        setApiError(data.error?.message ?? "Nieznany błąd");
        return;
      }
      console.log("Redirecting to review...");
      window.location.href = "/generate/review";
    } catch (error) {
      console.error("Network error:", error);
      setApiError("Brak połączenia z serwerem. Spróbuj ponownie.");
    } finally {
      console.log("Reset isSubmitting");
    }
  }

  return (
    <Card className="max-w-2xl w-full mx-auto">
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Display API errors if present */}
            {apiError && <div className="text-red-600">{apiError}</div>}
            <FormField
              control={control}
              name="text"
              render={({ field }: { field: ControllerRenderProps<GenerateFlashcardsFormInput, "text"> }) => (
                <FormItem>
                  <FormLabel>Tekst źródłowy</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Wklej tutaj tekst, z którego chcesz wygenerować fiszki (min. 10, max. 5000 znaków)..."
                      className="min-h-[200px]" // Make textarea larger
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Wprowadzono {currentLength} / {maxLength} znaków.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <span className="mr-2 animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              )}
              Generuj fiszki
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default GenerateFlashcardsForm;
