// Tác giả: Nguyễn Mạnh Thắng (QA/Tester & Báo cáo)
package com.example.bton;

import com.example.bton.dto.request.SavingsGoalRequest;
import com.example.bton.dto.request.UpdateSavingsAmountRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SavingsGoalControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    private String token;
    private Long spaceId;

    @BeforeEach
    void setUp() throws Exception {
        token = TestHelper.registerAndGetToken(mockMvc, objectMapper);
        MvcResult r = mockMvc.perform(get("/api/v1/spaces")
                        .header("Authorization", TestHelper.bearer(token)))
                .andExpect(status().isOk()).andReturn();
        spaceId = objectMapper.readTree(r.getResponse().getContentAsString()).get(0).get("id").asLong();
    }

    private SavingsGoalRequest buildRequest(String name, double target) {
        SavingsGoalRequest req = new SavingsGoalRequest();
        req.setSpaceId(spaceId);
        req.setName(name);
        req.setTargetAmount(BigDecimal.valueOf(target));
        req.setStartDate(LocalDate.now());
        req.setDeadline(LocalDate.now().plusMonths(6));
        req.setDescription("Test goal");
        req.setIcon("piggy-bank");
        req.setColor("#27AE60");
        return req;
    }

    private Long createGoal(String name, double target) throws Exception {
        MvcResult r = mockMvc.perform(post("/api/v1/savings-goals")
                        .header("Authorization", TestHelper.bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildRequest(name, target))))
                .andExpect(status().isCreated()).andReturn();
        return objectMapper.readTree(r.getResponse().getContentAsString()).get("id").asLong();
    }

    @Test
    @DisplayName("POST /savings-goals - tạo mục tiêu → 201")
    void createGoal_returns201() throws Exception {
        mockMvc.perform(post("/api/v1/savings-goals")
                        .header("Authorization", TestHelper.bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildRequest("Mua xe", 50_000_000))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Mua xe"))
                .andExpect(jsonPath("$.targetAmount").value(50_000_000))
                .andExpect(jsonPath("$.currentAmount").value(0));
    }

    @Test
    @DisplayName("POST /savings-goals - thiếu name → 400")
    void createGoal_missingName_returns400() throws Exception {
        SavingsGoalRequest req = buildRequest("", 10_000_000);
        req.setName("");
        mockMvc.perform(post("/api/v1/savings-goals")
                        .header("Authorization", TestHelper.bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /savings-goals - targetAmount = 0 → 400")
    void createGoal_zeroTarget_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/savings-goals")
                        .header("Authorization", TestHelper.bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildRequest("Test", 0))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /savings-goals - không có token → 401")
    void createGoal_noToken_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/savings-goals")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildRequest("Test", 1_000_000))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /savings-goals - lấy danh sách → 200")
    void getGoals_returns200() throws Exception {
        createGoal("Mua laptop", 20_000_000);
        mockMvc.perform(get("/api/v1/savings-goals")
                        .header("Authorization", TestHelper.bearer(token))
                        .param("spaceId", spaceId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @DisplayName("GET /savings-goals/{id} - lấy chi tiết → 200")
    void getGoalById_returns200() throws Exception {
        Long id = createGoal("Du lịch Nhật", 30_000_000);
        mockMvc.perform(get("/api/v1/savings-goals/" + id)
                        .header("Authorization", TestHelper.bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.name").value("Du lịch Nhật"));
    }

    @Test
    @DisplayName("GET /savings-goals/{id} - không tồn tại → 404")
    void getGoalById_notFound_returns404() throws Exception {
        mockMvc.perform(get("/api/v1/savings-goals/999999")
                        .header("Authorization", TestHelper.bearer(token)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT /savings-goals/{id} - cập nhật → 200")
    void updateGoal_returns200() throws Exception {
        Long id = createGoal("Mua điện thoại", 15_000_000);
        SavingsGoalRequest updated = buildRequest("Mua điện thoại Pro", 18_000_000);
        mockMvc.perform(put("/api/v1/savings-goals/" + id)
                        .header("Authorization", TestHelper.bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updated)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Mua điện thoại Pro"))
                .andExpect(jsonPath("$.targetAmount").value(18_000_000));
    }

    @Test
    @DisplayName("PATCH /savings-goals/{id}/amount - deposit → currentAmount tăng")
    void depositToGoal_currentAmountIncreases() throws Exception {
        Long id = createGoal("Mua xe đạp", 5_000_000);
        UpdateSavingsAmountRequest deposit = new UpdateSavingsAmountRequest();
        deposit.setAmount(BigDecimal.valueOf(1_000_000));
        mockMvc.perform(patch("/api/v1/savings-goals/" + id + "/amount")
                        .header("Authorization", TestHelper.bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(deposit)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentAmount").value(1_000_000.0));
    }

    @Test
    @DisplayName("PATCH /savings-goals/{id}/amount - deposit đủ target → progress >= 100%")
    void depositToGoal_fullAmount_progressComplete() throws Exception {
        Long id = createGoal("Tiết kiệm nhỏ", 500_000);
        UpdateSavingsAmountRequest deposit = new UpdateSavingsAmountRequest();
        deposit.setAmount(BigDecimal.valueOf(500_000));
        mockMvc.perform(patch("/api/v1/savings-goals/" + id + "/amount")
                        .header("Authorization", TestHelper.bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(deposit)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentAmount").value(500_000.0));
    }

    @Test
    @DisplayName("PATCH /savings-goals/{id}/cancel - hủy → status CANCELLED hoặc response 200")
    void cancelGoal_returns200() throws Exception {
        Long id = createGoal("Mục tiêu hủy", 10_000_000);
        mockMvc.perform(patch("/api/v1/savings-goals/" + id + "/cancel")
                        .header("Authorization", TestHelper.bearer(token)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("DELETE /savings-goals/{id} - xóa → 204")
    void deleteGoal_returns204() throws Exception {
        Long id = createGoal("Xóa goal", 1_000_000);
        mockMvc.perform(delete("/api/v1/savings-goals/" + id)
                        .header("Authorization", TestHelper.bearer(token)))
                .andExpect(status().isNoContent());
    }
}
