import type { TextPartData } from "../schemas/text";

interface ChatTextProps {
  data: TextPartData;
}

export function ChatText({ data }: ChatTextProps) {
  return <p className="whitespace-pre-wrap">{data.content}</p>;
}
