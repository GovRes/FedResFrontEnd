// UpdatedChatContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEditableParagraph } from "./editableParagraphContext";
import { PastJobType } from "../../lib/utils/responseSchemas";

// Generic item type that can be extended by specific item types
export type BaseItem = {
  id: string;
  title: string;
  description?: string;
  userConfirmed?: boolean;
  paragraph?: string | null;
  [key: string]: any;
};

type ChatContextType = {
  // Items state
  items: BaseItem[];
  currentIndex: number;
  currentItem: BaseItem | null;
  paragraphData: string | null;
  currentStepId: string;
  // Navigation
  setCurrentIndex: (index: number) => void;
  navigateToNextUnconfirmed: () => void;

  // Operations
  saveItem: (item: BaseItem) => Promise<void>;
  saveParagraph: () => Promise<void>;
  setParagraphData: (data: string | null) => void;

  // Meta info
  assistantName: string;
  assistantInstructions: string;
  additionalContext?: PastJobType[];
  jobString: string;

  // For nested structures
  nestedItems?: BaseItem[];
  nestedCurrentIndex?: number;
  setNestedCurrentIndex?: (index: number) => void;
  parentNavigate?: () => void;

  // Edit mode status
  isEditingExistingParagraph: boolean;
  isEditMode: boolean;
};

// Create context without a generic type parameter
const ChatContext = createContext<ChatContextType | null>(null);

// Provider component
export function ChatProvider({
  children,
  additionalContext,
  initialItems,
  initialAssistantName,
  initialAssistantInstructions,
  initialJobString,
  saveFunction,
  onComplete,
  currentStepId,
  nestedItemsKey,
  parentId,
  isEditMode = false, // New prop
}: {
  children: React.ReactNode;
  additionalContext?: PastJobType[];
  initialItems: BaseItem[];
  currentStepId: string;
  initialAssistantName: string;
  initialAssistantInstructions: string;
  initialJobString: string;
  saveFunction: (item: BaseItem) => Promise<void>;
  onComplete: () => void;
  nestedItemsKey?: string;
  parentId?: string;
  isEditMode?: boolean; // Indicate if we're in edit mode
}) {
  const router = useRouter();
  const [items, setItems] = useState<BaseItem[]>(initialItems);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentItem, setCurrentItem] = useState<BaseItem | null>(
    items.length > 0 ? items[0] : null
  );
  const [paragraphData, setParagraphData] = useState<string | null>(null);

  // For nested views
  const [nestedItems, setNestedItems] = useState<BaseItem[] | undefined>(
    nestedItemsKey && currentItem ? currentItem[nestedItemsKey] : undefined
  );
  const [nestedCurrentIndex, setNestedCurrentIndex] = useState(0);

  // Get the editable paragraph context
  const {
    isEditing,
    itemBeingEdited,
    originalParagraph,
    startEditing,
    cancelEditing,
    finishEditing,
  } = useEditableParagraph();

  // Computed value to determine if we're editing an existing paragraph
  const isEditingExistingParagraph = isEditing && itemBeingEdited !== null;

  // Effect to initialize paragraph data from item
  useEffect(() => {
    if (currentItem) {
      // If we're editing a specific item and it matches the current item
      if (isEditingExistingParagraph && itemBeingEdited === currentItem.id) {
        setParagraphData(originalParagraph);
      }
      // Or if item has a paragraph and we're not editing anything
      else if (currentItem.paragraph && !isEditingExistingParagraph) {
        setParagraphData(currentItem.paragraph);
      }
      // Otherwise, start with empty paragraph data
      else if (!isEditingExistingParagraph) {
        setParagraphData(null);
      }
    }
  }, [
    currentItem,
    isEditingExistingParagraph,
    itemBeingEdited,
    originalParagraph,
  ]);

  // Update current item when index changes
  useEffect(() => {
    if (items.length > 0 && currentIndex >= 0 && currentIndex < items.length) {
      const newCurrentItem = items[currentIndex];
      setCurrentItem(newCurrentItem);

      // If we're editing a specific item and it matches the new current item
      if (isEditingExistingParagraph && itemBeingEdited === newCurrentItem.id) {
        setParagraphData(originalParagraph);
      }
      // Otherwise, use the item's paragraph if available
      else if (newCurrentItem.paragraph && !isEditingExistingParagraph) {
        setParagraphData(newCurrentItem.paragraph);
      }
      // Otherwise clear paragraph data
      else if (!isEditingExistingParagraph) {
        setParagraphData(null);
      }

      // If we have nested items, update those too
      if (nestedItemsKey && items[currentIndex][nestedItemsKey]) {
        setNestedItems(items[currentIndex][nestedItemsKey]);
      }
    }
  }, [
    currentIndex,
    items,
    nestedItemsKey,
    isEditingExistingParagraph,
    itemBeingEdited,
    originalParagraph,
  ]);

  // Save the current item
  const saveItem = async (item: BaseItem) => {
    try {
      const updatedItems = items.map((i) => (i.id === item.id ? item : i));
      console.log(168, updatedItems);
      setItems(updatedItems);

      // Always use the saveFunction - it now handles nested logic in the parent component
      console.log(186, "saving item", item);
      await saveFunction(item);

      // If we were editing this item, finish editing
      if (isEditingExistingParagraph && itemBeingEdited === item.id) {
        finishEditing();
      }

      return Promise.resolve();
    } catch (error) {
      console.error("Error saving item:", error);
      return Promise.reject(error);
    }
  };
  // Save paragraph to the current item
  const saveParagraph = async () => {
    if (!paragraphData || !currentItem)
      return Promise.reject("No paragraph data or current item");
    console.log("saving paragraph for item:", currentItem.id);
    const updatedItem = {
      ...currentItem,
      paragraph: paragraphData,
      userConfirmed: true,
    };
    console.log("Updated item:", updatedItem);

    const res = await saveItem(updatedItem);
    console.log(res);

    // Only clear paragraph data if we're not in edit mode
    if (!isEditingExistingParagraph) {
      setParagraphData(null);
    }

    // If we're editing an existing paragraph, finish editing
    if (isEditingExistingParagraph) {
      finishEditing();
    } else {
      // Otherwise navigate to next unconfirmed item
      navigateToNextUnconfirmed();
    }

    return Promise.resolve();
  };

  // Find the next unconfirmed item
  const navigateToNextUnconfirmed = () => {
    // Don't navigate if we're in edit mode
    if (isEditingExistingParagraph) {
      return;
    }

    // If we're in a nested view
    if (nestedItemsKey && nestedItems) {
      // Check if there are any unconfirmed nested items
      const nextNestedIndex = findNextUnconfirmedIndex(
        nestedItems,
        nestedCurrentIndex
      );

      if (nextNestedIndex !== -1) {
        // Navigate to the next unconfirmed nested item
        setNestedCurrentIndex(nextNestedIndex);
        return;
      }

      // If all nested items are confirmed, move to the next parent item
      const nextParentIndex = findNextUnconfirmedIndex(
        items,
        currentIndex,
        nestedItemsKey
      );

      if (nextParentIndex !== -1) {
        // Navigate to the next parent item with unconfirmed nested items
        setCurrentIndex(nextParentIndex);
        // Reset nested index
        setNestedCurrentIndex(0);
        return;
      }
    } else {
      // Regular flat view - find next unconfirmed item
      const nextIndex = findNextUnconfirmedIndex(items, currentIndex);

      if (nextIndex !== -1) {
        // Navigate to the next unconfirmed item
        setCurrentIndex(nextIndex);
        return;
      }
    }

    // If we reach here, all items are confirmed - complete
    onComplete();
  };

  // Helper to find the next unconfirmed item
  const findNextUnconfirmedIndex = (
    itemArray: BaseItem[],
    startIndex: number,
    nestedKey?: string
  ) => {
    if (itemArray.length === 0) return -1;

    for (let i = 0; i < itemArray.length; i++) {
      const index = (startIndex + i + 1) % itemArray.length;
      const item = itemArray[index];

      // For nested items, check if any nested item is unconfirmed
      if (nestedKey && item[nestedKey]) {
        const nestedUnconfirmed = item[nestedKey].some(
          (ni: BaseItem) => !ni.userConfirmed
        );
        if (nestedUnconfirmed) return index;
      }
      // For flat items, just check if the item is unconfirmed
      else if (!item.userConfirmed) {
        return index;
      }
    }

    return -1; // All items confirmed
  };

  // Create the context value - cast to make TypeScript happy
  const contextValue: ChatContextType = {
    items: items,
    additionalContext: additionalContext,
    currentIndex,
    currentItem,
    currentStepId,
    paragraphData,
    setCurrentIndex,
    navigateToNextUnconfirmed,
    saveItem,
    saveParagraph,
    setParagraphData,
    assistantName: initialAssistantName,
    assistantInstructions: initialAssistantInstructions,
    jobString: initialJobString,
    isEditingExistingParagraph,
    isEditMode,
  };

  // Add nested properties if we're in a nested view
  if (nestedItemsKey && nestedItems) {
    contextValue.nestedItems = nestedItems;
    contextValue.nestedCurrentIndex = nestedCurrentIndex;
    contextValue.setNestedCurrentIndex = setNestedCurrentIndex;
    contextValue.parentNavigate = () => {
      // Navigate back to parent view
      if (parentId) {
        router.push(`/ally/${currentStepId}/${parentId}`);
      }
    };
  }

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
}

// Custom hook to use the chat context
export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
