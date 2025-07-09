import React from "react";
import { useChatContext, BaseItem } from "@/app/providers/chatContext";
import { useEditableParagraph } from "@/app/providers/editableParagraphContext";
import styles from "./chatInterface.module.css";

type SidebarProps = {
  title: string;
  displayNestedItems?: boolean;
};

export default function Sidebar({
  title,
  displayNestedItems = false,
}: SidebarProps) {
  const {
    items,
    currentIndex,
    setCurrentIndex,
    nestedItems,
    nestedCurrentIndex,
    setNestedCurrentIndex,
    isEditingExistingParagraph,
  } = useChatContext();

  const { startEditing, itemBeingEdited } = useEditableParagraph();

  // Determine which items to display (parent or nested)
  const displayItems = displayNestedItems && nestedItems ? nestedItems : items;
  const activeIndex =
    displayNestedItems && nestedCurrentIndex !== undefined
      ? nestedCurrentIndex
      : currentIndex;
  const setActiveIndex =
    displayNestedItems && setNestedCurrentIndex
      ? setNestedCurrentIndex
      : setCurrentIndex;

  // Generate item content for sidebar
  const generateItemContent = (item: BaseItem) => {
    if (item.keywords && Array.isArray(item.keywords)) {
      return (
        <ul>
          {item.keywords.map((kw: string) => (
            <li key={kw}>{kw}</li>
          ))}
        </ul>
      );
    } else if (item.description) {
      return <div>{item.description}</div>;
    }
    return null;
  };

  // Handle edit button click
  const handleEditClick = (item: BaseItem, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent activating the item when clicking the edit button

    if (item.paragraph) {
      startEditing(item.id, item.paragraph);
    }
  };

  const renderSidebarItem = (item: BaseItem, index: number) => {
    const isActive = index === activeIndex;
    const isBeingEdited = item.id === itemBeingEdited;
    const content = generateItemContent(item);

    // Determine status indicator
    let statusIndicator;
    if (isBeingEdited) {
      statusIndicator = <span className={styles.editingIndicator}>✎</span>;
    } else if (item.userConfirmed) {
      statusIndicator = <span className={styles.completedIndicator}>✓</span>;
    } else {
      statusIndicator = <span className={styles.pendingIndicator}>○</span>;
    }

    return (
      <div
        key={item.id}
        onClick={() => !isEditingExistingParagraph && setActiveIndex(index)}
        className={`${styles.sidebarItem} ${isActive ? styles.active : ""} ${
          isBeingEdited ? styles.editing : ""
        } ${item.userConfirmed ? styles.confirmed : ""} ${
          isEditingExistingParagraph && !isBeingEdited ? styles.disabled : ""
        }`}
      >
        <div className={styles.sidebarItemHeader}>
          <div className={styles.sidebarItemTitle}>
            {statusIndicator} {item.title}
          </div>

          {/* Show edit button for confirmed paragraphs */}
          {item.userConfirmed &&
            item.paragraph &&
            !isEditingExistingParagraph && (
              <button
                onClick={(e) => handleEditClick(item, e)}
                className={styles.editButton}
                title="Edit this paragraph"
              >
                Edit
              </button>
            )}
        </div>

        {isActive && content ? (
          <div className={styles.sidebarItemContent}>{content}</div>
        ) : null}

        {/* Show paragraph preview for confirmed items */}
        {item.userConfirmed &&
          item.paragraph &&
          (isActive || isBeingEdited) && (
            <div className={styles.paragraphPreview}>
              {item.paragraph.substring(0, 100)}
              {item.paragraph.length > 100 ? "..." : ""}
            </div>
          )}
      </div>
    );
  };

  return (
    <div className={styles.sidebar}>
      <h2 className={styles.sidebarTitle}>{title}</h2>
      <div className={styles.sidebarItems}>
        {displayItems.map((item, index) => renderSidebarItem(item, index))}
      </div>

      {/* Show navigation help message during editing */}
      {isEditingExistingParagraph && (
        <div className={styles.editingHelp}>
          <p>
            You are currently editing a paragraph. Complete or cancel editing to
            navigate between items.
          </p>
        </div>
      )}
    </div>
  );
}
