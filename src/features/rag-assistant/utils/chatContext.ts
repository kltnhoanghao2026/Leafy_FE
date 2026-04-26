import type { Location } from "react-router-dom";
import type { DiseaseDiagnosisChatContext } from "../types";

export interface AiAssistantLocationState {
  diseaseContext?: DiseaseDiagnosisChatContext;
}

export const buildDiseaseAdvicePrompt = (
  context: DiseaseDiagnosisChatContext,
) => {
  const confidence = Math.round(context.confidence * 100);

  if (context.plantName || context.farmPlotName || context.farmZoneName) {
    const plantPart = context.plantName ? ` của cây ${context.plantName}` : "";
    const plotPart = context.farmPlotName
      ? ` trong vườn ${context.farmPlotName}`
      : "";
    const zonePart = context.farmZoneName
      ? `, khu vực ${context.farmZoneName}`
      : "";
    return `Ảnh lá cà phê${plantPart}${plotPart}${zonePart} được chẩn đoán là ${context.diseaseLabel} với độ tin cậy ${confidence}%. Hãy tư vấn cách xử lý, phòng ngừa và lập kế hoạch chăm sóc phù hợp.`;
  }

  return `Ảnh lá cà phê được chẩn đoán là ${context.diseaseLabel} với độ tin cậy ${confidence}%. Hãy tư vấn cách xử lý, phòng ngừa và lịch chăm sóc phù hợp.`;
};

export const getDiseaseContextFromLocation = (
  location: Location,
): DiseaseDiagnosisChatContext | null => {
  const state = location.state as AiAssistantLocationState | null;
  return state?.diseaseContext ?? null;
};
