import React from "react";
import { useChatContext, BaseItem } from "../../providers/chatContext";
import styles from "./chatInterface.module.css";
import { generateHeadingText } from "@/app/utils/stringBuilders";

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
  } = useChatContext();

  console.log(items);
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

  const renderSidebarItem = (item: BaseItem, index: number) => {
    const isActive = index === activeIndex;
    const content = generateItemContent(item);

    // Show progress/completion indicator
    const completionStatus = item.userConfirmed ? (
      <span className={styles.completedIndicator}>✓</span>
    ) : (
      <span className={styles.pendingIndicator}>○</span>
    );

    return (
      <div
        key={item.id}
        onClick={() => setActiveIndex(index)}
        className={`${styles.sidebarItem} ${isActive ? styles.active : ""}`}
      >
        <div className={styles.sidebarItemHeader}>
          {completionStatus} {generateHeadingText(item)}
        </div>
        {isActive && content ? (
          <div className={styles.sidebarItemContent}>{content}</div>
        ) : null}
      </div>
    );
  };

  return (
    <div className={styles.sidebar}>
      <h2 className={styles.sidebarTitle}>{title}</h2>
      <div className={styles.sidebarItems}>
        {displayItems.map((item, index) => renderSidebarItem(item, index))}
      </div>
    </div>
  );
}
