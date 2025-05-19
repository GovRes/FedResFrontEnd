// ChatNavigation.ts
import { BaseItem } from "../../providers/chatContext";

/**
 * Finds the next item in the array that needs attention
 * @param items Array of items to search
 * @param currentIndex Current index in the array
 * @param nestedItemsKey Optional key for nested items
 * @returns The index of the next unconfirmed item, or -1 if all items are confirmed
 */
export function findNextUnconfirmedItem<T extends BaseItem>(
  items: T[],
  currentIndex: number,
  nestedItemsKey?: string
): number {
  if (!items || items.length === 0) return -1;

  // Start from the next item
  let startIndex = (currentIndex + 1) % items.length;
  let index = startIndex;

  do {
    const item = items[index];

    // For items with nested content
    if (nestedItemsKey && item[nestedItemsKey]) {
      const nestedItems = item[nestedItemsKey];
      if (
        Array.isArray(nestedItems) &&
        nestedItems.some((ni) => !ni.userConfirmed)
      ) {
        return index;
      }
    }
    // For regular items
    else if (!item.userConfirmed) {
      return index;
    }

    // Move to next item, wrapping around to the beginning if needed
    index = (index + 1) % items.length;
  } while (index !== startIndex);

  // If we've gone through the entire array and found nothing, return -1
  return -1;
}

/**
 * Determines if all items in an array are confirmed
 * @param items Array of items to check
 * @param nestedItemsKey Optional key for nested items
 * @returns true if all items (and nested items if applicable) are confirmed
 */
export function areAllItemsConfirmed<T extends BaseItem>(
  items: T[],
  nestedItemsKey?: string
): boolean {
  if (!items || items.length === 0) return true;

  for (const item of items) {
    // Check if the item itself is unconfirmed
    if (!item.userConfirmed) return false;

    // Check nested items if applicable
    if (nestedItemsKey && item[nestedItemsKey]) {
      const nestedItems = item[nestedItemsKey];
      if (
        Array.isArray(nestedItems) &&
        nestedItems.some((ni) => !ni.userConfirmed)
      ) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Maps an array of items to a flat array that includes nested items
 * @param items The parent items
 * @param nestedItemsKey The key for nested items
 * @returns A flat array of all items including nested ones
 */
export function flattenItems<T extends BaseItem>(
  items: T[],
  nestedItemsKey: string
): BaseItem[] {
  if (!items || items.length === 0) return [];

  const result: BaseItem[] = [];

  for (const item of items) {
    // Add the parent item
    result.push(item);

    // Add nested items if present
    if (item[nestedItemsKey] && Array.isArray(item[nestedItemsKey])) {
      result.push(...item[nestedItemsKey]);
    }
  }

  return result;
}

/**
 * Builds an initial message based on the current item
 * @param item The current item
 * @param jobString Information about the job being applied for
 * @returns A formatted initial message
 */
export function buildInitialMessage(item: BaseItem, jobString: string): string {
  return `I'm going to help you write a paragraph about ${item.title} to include in your application for ${jobString}. Can you tell me a bit about your experience?`;
}

/**
 * Determines the URL for the next item that needs attention
 * @param basePath The base URL path
 * @param items The array of items
 * @param currentId The ID of the current item
 * @param nestedItemsKey Optional key for nested items
 * @returns The URL for the next item, or null if all items are confirmed
 */
export function getNextItemUrl(
  basePath: string,
  items: BaseItem[],
  currentId: string,
  nestedItemsKey?: string
): string | null {
  if (!items || items.length === 0) return null;

  // Find the current index
  const currentIndex = items.findIndex((item) => item.id === currentId);
  if (currentIndex === -1) return null;

  // Find the next unconfirmed item
  const nextIndex = findNextUnconfirmedItem(
    items,
    currentIndex,
    nestedItemsKey
  );
  if (nextIndex === -1) return null;

  // Build the URL
  return `${basePath}/${items[nextIndex].id}`;
}
