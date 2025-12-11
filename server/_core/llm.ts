import { ENV } from "./env";
import OpenAI from "openai";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4" ;
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message): OpenAI.Chat.ChatCompletionMessageParam => {
  const { role, name, tool_call_id } = message;

  if (role === "tool") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role: "tool",
      content,
      tool_call_id: tool_call_id || "",
    };
  }

  if (role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role: "function",
      name: name || "",
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    const textContent = contentParts[0].text;
    
    if (role === "system") {
      return { role: "system", content: textContent };
    }
    if (role === "user") {
      return { role: "user", content: textContent, ...(name ? { name } : {}) };
    }
    if (role === "assistant") {
      return { role: "assistant", content: textContent, ...(name ? { name } : {}) };
    }
  }

  // OpenAI SDK expects content as array of parts
  // Note: assistant role only supports text content, not images
  if (role === "user") {
    const userContent = contentParts.map(part => {
      if (part.type === "text") {
        return { type: "text" as const, text: part.text };
      }
      if (part.type === "image_url") {
        return { type: "image_url" as const, image_url: part.image_url };
      }
      // file_url is not directly supported by OpenAI SDK, convert to text
      return { type: "text" as const, text: `[File: ${(part as FileContent).file_url.url}]` };
    });
    return { role: "user", content: userContent, ...(name ? { name } : {}) };
  }
  
  if (role === "assistant") {
    // Assistant only supports text content
    const textContent = contentParts.map(part => {
      if (part.type === "text") {
        return part.text;
      }
      if (part.type === "image_url") {
        return `[Image: ${part.image_url.url}]`;
      }
      return `[File: ${(part as FileContent).file_url.url}]`;
    }).join("\n");
    return { role: "assistant", content: textContent, ...(name ? { name } : {}) };
  }
  
  // Fallback for system role (though system typically doesn't have multi-part content)
  const systemContent = contentParts.map(part => {
    if (part.type === "text") {
      return part.text;
    }
    if (part.type === "image_url") {
      return `[Image: ${part.image_url.url}]`;
    }
    return `[File: ${(part as FileContent).file_url.url}]`;
  }).join("\n");
  return { role: "system", content: systemContent };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): OpenAI.Chat.ChatCompletionToolChoiceOption | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice as OpenAI.Chat.ChatCompletionToolChoiceOption;
};

const assertApiKey = () => {
  if (!ENV.openaiApiKey && !ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY or BUILT_IN_FORGE_API_KEY is not configured");
  }
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();

  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    maxTokens,
    max_tokens,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
  } = params;

  // Prioritize OpenAI API if available
  if (ENV.openaiApiKey) {
    const openai = new OpenAI({
      apiKey: ENV.openaiApiKey,
    });

    const normalizedMessages = messages.map(normalizeMessage);
    const normalizedToolChoice = normalizeToolChoice(
      toolChoice || tool_choice,
      tools
    );
    const normalizedResponseFormat = normalizeResponseFormat({
      responseFormat,
      response_format,
      outputSchema,
      output_schema,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: normalizedMessages,
      ...(tools && tools.length > 0 ? { tools: tools as OpenAI.Chat.ChatCompletionTool[] } : {}),
      ...(normalizedToolChoice ? { tool_choice: normalizedToolChoice } : {}),
      ...(maxTokens || max_tokens ? { max_tokens: maxTokens || max_tokens } : {}),
      ...(normalizedResponseFormat ? { response_format: normalizedResponseFormat as any } : {}),
    });

    // Convert OpenAI response to InvokeResult format
    return {
      id: completion.id,
      created: completion.created,
      model: completion.model,
      choices: completion.choices.map(choice => ({
        index: choice.index,
        message: {
          role: choice.message.role as Role,
          content: choice.message.content || "",
          ...(choice.message.tool_calls ? { tool_calls: choice.message.tool_calls as ToolCall[] } : {}),
        },
        finish_reason: choice.finish_reason,
      })),
      usage: completion.usage ? {
        prompt_tokens: completion.usage.prompt_tokens,
        completion_tokens: completion.usage.completion_tokens,
        total_tokens: completion.usage.total_tokens,
      } : undefined,
    };
  }

  // Fallback to Manus Forge API
  const resolveApiUrl = () =>
    ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
      ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
      : "https://forge.manus.im/v1/chat/completions";

  const payload: Record<string, unknown> = {
    model: "gemini-2.5-flash",
    messages: messages.map(normalizeMessage),
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  payload.max_tokens = maxTokens || max_tokens || 32768;
  payload.thinking = {
    "budget_tokens": 128
  };

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }

  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  return (await response.json()) as InvokeResult;
}
