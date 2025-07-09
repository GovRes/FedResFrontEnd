import { TopicType } from "@/app/utils/responseSchemas";

export default function TopicLI(topic: TopicType) {
  return (
    <li key={topic.id}>
      <h4>{topic.title}</h4>
      <ul>
        {topic.keywords.map((keyword: string, index: number) => (
          <li key={index}>{keyword}</li>
        ))}
      </ul>
    </li>
  );
}
