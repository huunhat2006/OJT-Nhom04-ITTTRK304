// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpendingAnalysisResponse {
    private List<SpendingAlertResponse> alerts;
    private SpendingHealthScoreResponse healthScore;
    private List<SpendingRecommendationResponse> recommendations;
    private String analysisDate;
    private Long spaceId;
    private int month;
    private int year;
}

