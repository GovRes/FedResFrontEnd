import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { BaseItem } from "./chatContext";

interface EditableParagraphContextType {
  // Editing state
  isEditing: boolean;
  itemBeingEdited: string | null; // ID of the item being edited
  originalParagraph: string | null;

  // Actions
  startEditing: (itemId: string, paragraph: string) => void;
  cancelEditing: () => void;
  finishEditing: () => void;

  // Chat mode vs. manual mode
  editMode: "chat" | "manual";
  setEditMode: (mode: "chat" | "manual") => void;
}

// Create the context
const EditableParagraphContext = createContext<
  EditableParagraphContextType | undefined
>(undefined);

// Provider component
export function EditableParagraphProvider({
  children,
}: {
  children: ReactNode;
}) {
  // State for tracking editing status
  const [isEditing, setIsEditing] = useState(false);
  const [itemBeingEdited, setItemBeingEdited] = useState<string | null>(null);
  const [originalParagraph, setOriginalParagraph] = useState<string | null>(
    null
  );
  const [editMode, setEditMode] = useState<"chat" | "manual">("chat");

  // Start editing a specific item
  const startEditing = (itemId: string, paragraph: string) => {
    setIsEditing(true);
    setItemBeingEdited(itemId);
    setOriginalParagraph(paragraph);
  };

  // Cancel editing and revert changes
  const cancelEditing = () => {
    setIsEditing(false);
    setItemBeingEdited(null);
    setOriginalParagraph(null);
  };

  // Finish editing (save is handled by the parent component)
  const finishEditing = () => {
    setIsEditing(false);
    setItemBeingEdited(null);
    setOriginalParagraph(null);
  };

  // Create the context value
  const contextValue: EditableParagraphContextType = {
    isEditing,
    itemBeingEdited,
    originalParagraph,
    startEditing,
    cancelEditing,
    finishEditing,
    editMode,
    setEditMode,
  };

  return (
    <EditableParagraphContext.Provider value={contextValue}>
      {children}
    </EditableParagraphContext.Provider>
  );
}

// Custom hook to use the editable paragraph context
export function useEditableParagraph() {
  const context = useContext(EditableParagraphContext);
  if (!context) {
    throw new Error(
      "useEditableParagraph must be used within an EditableParagraphProvider"
    );
  }
  return context;
}
