import { describe, expect, it } from "vitest";
import {
  buildCreateTreatmentPlanRequest,
  buildInitialTreatmentPlanFormValues,
} from "./treatmentPlanMapper";

describe("treatmentPlanMapper", () => {
  it("maps a full RAG plan into CreateTreatmentPlanRequest", () => {
    const ragPlan = {
      planId: "rag-plan-1",
      question: "Lá cà phê bị gỉ sắt xử lý thế nào?",
      diseaseName: "Gỉ sắt",
      summary: "Xử lý trong 7 ngày.",
      plan: {
        source: "documents",
        requiredInputs: ["Kéo tỉa", "Thuốc nấm"],
      },
      schedule: [
        {
          title: "Tỉa lá bệnh",
          description: "Loại bỏ lá bị nhiễm nặng.",
          dayOffset: 0,
          eventType: "PRUNING",
        },
        {
          title: "Phun thuốc",
          description: "Phun theo khuyến cáo.",
          dayOffset: 2,
          eventType: "TREATMENT_APPLICATION",
          phiDays: 14,
        },
      ],
    };

    const values = buildInitialTreatmentPlanFormValues(
      ragPlan,
      "2026-04-26",
    );
    const payload = buildCreateTreatmentPlanRequest(ragPlan, {
      ...values,
      plantId: "plant-1",
      farmPlotId: "plot-1",
      farmZoneId: "zone-1",
    });

    expect(payload).toMatchObject({
      ragPlanId: "rag-plan-1",
      question: "Lá cà phê bị gỉ sắt xử lý thế nào?",
      plantId: "plant-1",
      farmPlotId: "plot-1",
      farmZoneId: "zone-1",
      diseaseName: "Gỉ sắt",
    });
    expect(payload.schedule).toHaveLength(2);
    expect(payload.schedule?.[0]).toMatchObject({
      eventType: "PRUNING",
      note: "Tỉa lá bệnh",
      daysFromNow: 0,
      calculatedStartDate: "2026-04-26",
    });
    expect(payload.schedule?.[1]).toMatchObject({
      eventType: "TREATMENT_APPLICATION",
      daysFromNow: 2,
      calculatedStartDate: "2026-04-28",
      phiDays: 14,
    });
  });

  it("keeps a RAG plan without schedule reviewable but creates no events", () => {
    const ragPlan = {
      planId: "rag-plan-2",
      diseaseName: "Nhện đỏ",
      summary: "Theo dõi và xử lý thủ công.",
    };

    const values = buildInitialTreatmentPlanFormValues(
      ragPlan,
      "2026-04-26",
    );
    const payload = buildCreateTreatmentPlanRequest(ragPlan, {
      ...values,
      farmPlotId: "plot-1",
    });

    expect(values.schedule).toEqual([]);
    expect(payload.schedule).toEqual([]);
    expect(payload.diseaseName).toBe("Nhện đỏ");
  });
});
