import { 
  TrajectoryItem, 
  AgentStateChange, 
  UserMessage, 
  AssistantMessage, 
  CommandAction, 
  CommandObservation, 
  IPythonAction, 
  IPythonObservation, 
  FinishAction, 
  ErrorObservation, 
  ReadAction, 
  ReadObservation, 
  EditAction, 
  EditObservation,
  ThinkAction,
  ThinkObservation
} from '../types/share';

// OpenHands index history format checkers
export const isEnvironmentEvent = (data: any): boolean =>
  data?.source === "environment" && data?.key !== undefined;

export const isAgentContextEvent = (data: any): boolean =>
  data?.source === "environment" && 
  data?.key === "full_state" && 
  data?.value?.agent?.agent_context?.skills?.length > 0;

export const isSystemPrompt = (data: any): boolean =>
  data?.source === "agent" && data?.system_prompt !== undefined;

export const isUserLLMMessage = (data: any): boolean =>
  data?.source === "user" && data?.llm_message !== undefined;

export const isAgentThought = (data: any): boolean =>
  data?.source === "agent" && data?.thought !== undefined;

export const isAgentAction = (data: any): boolean =>
  data?.source === "agent" && data?.action !== undefined && data?.tool_name !== undefined;

export const isConversationStateUpdate = (data: any): boolean =>
  data?.source === "environment" && data?.kind === "ConversationStateUpdateEvent";

export const isModelResponse = (data: any): boolean =>
  data?.source === "environment" && data?.kind === "ModelResponseEvent";

export const isAgentStateChange = (data: TrajectoryItem): data is AgentStateChange =>
  "observation" in data && 
  data.observation === "agent_state_changed" &&
  (data.source === "environment" || data.source === "agent");

export const isUserMessage = (data: TrajectoryItem): data is UserMessage =>
  ("action" in data && data.action === "message" && 
   ((!("source" in data)) || data.source === "user"));

export const isAssistantMessage = (data: TrajectoryItem): data is AssistantMessage =>
  "action" in data && data.action === "message" && "source" in data && data.source === "agent";

export const isCommandAction = (data: TrajectoryItem): data is CommandAction =>
  "action" in data && data.action === "run" && data.source === "agent";

export const isCommandObservation = (data: TrajectoryItem): data is CommandObservation =>
  "observation" in data && data.observation === "run" && data.source === "agent";

export const isIPythonAction = (data: TrajectoryItem): data is IPythonAction =>
  "action" in data && data.action === "run_ipython" && data.source === "agent";

export const isIPythonObservation = (data: TrajectoryItem): data is IPythonObservation =>
  "observation" in data && data.observation === "run_ipython" && data.source === "agent";

export const isFinishAction = (data: TrajectoryItem): data is FinishAction =>
  "action" in data && data.action === "finish" && data.source === "agent";

export const isErrorObservation = (data: TrajectoryItem): data is ErrorObservation =>
  "observation" in data && data.observation === "error" && data.source === "agent";

export const isReadAction = (data: TrajectoryItem): data is ReadAction =>
  "action" in data && data.action === "read" && "source" in data && data.source === "agent";

export const isReadObservation = (data: TrajectoryItem): data is ReadObservation =>
  "observation" in data && data.observation === "read" && "source" in data && data.source === "agent";

export const isEditAction = (data: TrajectoryItem): data is EditAction =>
  "action" in data && data.action === "edit" && "source" in data && data.source === "agent";

export const isEditObservation = (data: TrajectoryItem): data is EditObservation =>
  "observation" in data && data.observation === "edit" && "source" in data && data.source === "agent";

export const isThinkAction = (data: TrajectoryItem): data is ThinkAction =>
  "action" in data && data.action === "think" && "source" in data && data.source === "agent";

export const isThinkObservation = (data: TrajectoryItem): data is ThinkObservation =>
  "observation" in data && data.observation === "think" && "source" in data && data.source === "agent";

