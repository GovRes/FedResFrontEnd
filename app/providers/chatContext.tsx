// ChatContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Generic item type that can be extended by specific item types
export type BaseItem = {
  id: string;
  title: string;
  description?: string;
  userConfirmed?: boolean;
  [key: string]: any;
};

type ChatContextType = {
  // Items state
  items: BaseItem[];
  currentIndex: number;
  currentItem: BaseItem | null;
  paragraphData: string | null;

  // Navigation
  setCurrentIndex: (index: number) => void;
  navigateToNextUnconfirmed: () => void;

  // Operations
  saveItem: (item: BaseItem) => void;
  saveParagraph: () => void;
  setParagraphData: (data: string | null) => void;

  // Meta info
  assistantName: string;
  assistantInstructions: string;
  jobString: string;

  // For nested structures
  nestedItems?: BaseItem[];
  nestedCurrentIndex?: number;
  setNestedCurrentIndex?: (index: number) => void;
  parentNavigate?: () => void;
};
// Create context without a generic type parameter
const ChatContext = createContext<ChatContextType | null>(null);

// Provider component with a generic type parameter
export function ChatProvider<T extends BaseItem>({
  children,
  initialItems,
  initialAssistantName,
  initialAssistantInstructions,
  initialJobString,
  saveFunction,
  onComplete,
  nestedItemsKey,
  parentId,
}: {
  children: React.ReactNode;
  initialItems: T[];
  initialAssistantName: string;
  initialAssistantInstructions: string;
  initialJobString: string;
  saveFunction: (item: T) => Promise<void>;
  onComplete: () => void;
  nestedItemsKey?: string;
  parentId?: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState<T[]>(initialItems);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentItem, setCurrentItem] = useState<T | null>(() => {
    const unconfirmedIndex = items.findIndex(
      (item) => item.userConfirmed === false
    );
    return unconfirmedIndex >= 0
      ? items[unconfirmedIndex]
      : items.length > 0
      ? items[0]
      : null;
  });
  const [paragraphData, setParagraphData] = useState<string | null>(null);

  // For nested views
  const [nestedItems, setNestedItems] = useState<BaseItem[] | undefined>(
    nestedItemsKey && currentItem ? currentItem[nestedItemsKey] : undefined
  );
  const [nestedCurrentIndex, setNestedCurrentIndex] = useState(0);

  // Update current item when index changes
  useEffect(() => {
    if (items.length > 0 && currentIndex >= 0 && currentIndex < items.length) {
      setCurrentItem(items[currentIndex]);

      // If we have nested items, update those too
      if (nestedItemsKey && items[currentIndex][nestedItemsKey]) {
        setNestedItems(items[currentIndex][nestedItemsKey]);
      }
    }
  }, [currentIndex, items, nestedItemsKey]);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);
  // Save the current item
  const saveItem = async (item: T) => {
    const updatedItems = items.map((i) => (i.id === item.id ? item : i));
    setItems(updatedItems);

    // If we're in a nested view, we need to update the parent item
    if (nestedItemsKey && parentId) {
      // Find the parent item
      const parentItem = items.find((i) => i.id === parentId);
      if (parentItem) {
        // Update the nested items
        const nestedArray = (parentItem as any)[nestedItemsKey] as BaseItem[];
        (parentItem as any)[nestedItemsKey] = nestedArray.map((ni: BaseItem) =>
          ni.id === item.id ? item : ni
        );
        // Save the parent item
        await saveFunction(parentItem);
      }
    } else {
      // Save directly
      await saveFunction(item);
    }
  };

  // Save paragraph to the current item
  const saveParagraph = async () => {
    if (!paragraphData || !currentItem) return;

    const updatedItem = {
      ...currentItem,
      paragraph: paragraphData,
      userConfirmed: true,
    };

    await saveItem(updatedItem as T);
    setParagraphData(null);

    // Navigate to next unconfirmed item
    navigateToNextUnconfirmed();
  };

  // Find the next unconfirmed item
  const navigateToNextUnconfirmed = () => {
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
    items: items as unknown as BaseItem[],
    currentIndex,
    currentItem: currentItem as unknown as BaseItem | null,
    paragraphData,
    setCurrentIndex,
    navigateToNextUnconfirmed,
    saveItem: (item: BaseItem) => saveItem(item as unknown as T),
    saveParagraph,
    setParagraphData,
    assistantName: initialAssistantName,
    assistantInstructions: initialAssistantInstructions,
    jobString: initialJobString,
  };

  // Add nested properties if we're in a nested view
  if (nestedItemsKey && nestedItems) {
    contextValue.nestedItems = nestedItems;
    contextValue.nestedCurrentIndex = nestedCurrentIndex;
    contextValue.setNestedCurrentIndex = setNestedCurrentIndex;
    contextValue.parentNavigate = () => {
      // Navigate back to parent view
      if (parentId) {
        router.push(`/ally/past-experience/past-job-details/${parentId}`);
      }
    };
  }

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
}

// Custom hook to use the chat context
export function useChatContext<T extends BaseItem = BaseItem>() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  // This cast tells TypeScript that we're using specific type T
  // It's safe as long as we're always providing the correct type when using the hook
  return context as unknown as ChatContextType & {
    items: T[];
    currentItem: T | null;
    saveItem: (item: T) => void;
    nestedItems?: T[];
  };
}
