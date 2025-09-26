import { TopicType } from "@/lib/utils/responseSchemas";
import {
  AwaitedReactNode,
  JSXElementConstructor,
  Key,
  ReactElement,
  ReactNode,
  ReactPortal,
  useState,
} from "react";
import { GrDown, GrNext } from "react-icons/gr";
import styles from "./topicAccordionItem.module.css";
export default function TopicAccordionItem({ topic }: { topic: TopicType }) {
  const [isActive, setIsActive] = useState(false);
  return (
    <div className="accordion">
      <div
        className={`${styles.accordionItem} ${isActive ? styles.active : ""}`}
      >
        <div
          className={styles.accordionTitle}
          onClick={() => setIsActive(!isActive)}
        >
          <div>
            {topic.title} {isActive ? <GrDown /> : <GrNext />}
          </div>
        </div>
        {isActive && (
          <div>
            <div className={styles.accordionContent}>
              {topic.description}

              {topic.keywords && topic.keywords.length > 0 && (
                <ul>
                  {topic.keywords.map((keyword: string, index: Key) => (
                    <li key={index} className={styles.keywordItem}>
                      {keyword}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
