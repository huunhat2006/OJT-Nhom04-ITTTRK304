// Tác giả: Nguyễn Mạnh Thắng (QA/Tester & Báo cáo)
package com.example.bton;

import com.example.bton.dto.request.BudgetRequest;
import com.example.bton.dto.request.CategoryRequest;
import com.example.bton.dto.request.TransactionRequest;
import com.example.bton.dto.request.WalletRequest;
import com.example.bton.enums.CategoryType;
import com.example.bton.enums.TransactionType;
import com.example.bton.enums.WalletType;
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
class BudgetControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    private String token;
    private Long spaceId;
    private Long categoryId;
    private Long walletId;
    private int currentMonth;
    private int currentYear;

    @BeforeEach
    void setUp() throws Exception {
        token = TestHelper.registerAndGetToken(mockMvc, objectMapper);
        spaceId = getPersonalSpaceId();

        // Tạo category (H2 không có system categories vì Flyway disabled)
        CategoryRequest catReq = new CategoryRequest();
        catReq.setName("Budget Test Category");
        catReq.setType(CategoryType.EXPENSE);
        MvcResult catResult = mockMvc.perform(post("/api/v1/categories")
                        .header("Authorization", TestHelper.bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(catReq)))
                .andExpect(status().isCreated()).andReturn();
        categoryId = objectMapper.readTree(catResult.getResponse().getContentAsString()).get("id").asLong();

        // Tạo wallet với balance lớn để EXPENSE transaction không bị reject
        WalletRequest walletReq = new WalletRequest();
        walletReq.setName("Budget Test Wallet");
        walletReq.setWalletType(WalletType.CASH);
        walletReq.setCurrency("VND");
        walletReq.setInitialBalance(BigDecimal.valueOf(100_000_000));
        walletReq.setSpaceId(spaceId);
        MvcResult walletResult = mockMvc.perform(post("/api/v1/wallets")
                        .header("Authorization", TestHelper.bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(walletReq)))
                .andExpect(status().isCreated()).andReturn();
        walletId = objectMapper.readTree(walletResult.getResponse().getContentAsString()).get("id").asLong();

        currentMonth = LocalDate.now().getMonthValue();
        currentYear = LocalDate.now().getYear();
    }

    private Long getPersonalSpaceId() throws Exception {
        MvcResult r = mockMvc.perform(get("/api/v1/spaces")
                        .header("Authorization", TestHelper.bearer(token)))
                .andExpect(status().isOk()).andReturn();
        return objectMapper.readTree(r.getResponse().getContentAsString())
                .get(0).get("id").asLong();
    }

    private BudgetRequest buildBudgetRequest(double amount) {
        BudgetRequest req = new BudgetRequest();
        req.setSpaceId(spaceId);
        req.setCategoryId(categoryId);
        req.setAmount(BigDecimal.valueOf(amount));
        req.setMonth(currentMonth);
        req.setYear(currentYear);
        req.setWarningThreshold(BigDecimal.valueOf(80));
        return req;
    }

    private Long createBudget(double amount) throws Exception {
        MvcResult r = mockMvc.perform(post("/api/v1/budgets")
                        .header("Authorization", TestHelper.bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildBudgetRequest(amount))))
                .andExpect(status().isCreated()).andReturn();
        return objectMapper.readTree(r.getResponse().getContentAsString()).get("id").asLong();
    }

    // ── tests ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /budgets - tạo budget → 201")
    void createBudget_returns201() throws Exception {
        mockMvc.perform(post("/api/v1/budgets")
                        .header("Authorization", TestHelper.bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildBudgetRequest(5_000_000))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.amount").value(5_000_000));
    }

    @Test
    @DisplayName("POST /budgets - thiếu categoryId → 400")
    void createBudget_missingCategory_returns400() throws Exception {
        BudgetRequest req = buildBudgetRequest(1_000_000);
        req.setCategoryId(null);
        mockMvc.perform(post("/api/v1/budgets")
                        .header("Authorization", TestHelper.bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /budgets - amount = 0 → 400")
    void createBudget_zeroAmount_returns400() throws Exception {
        BudgetRequest req = buildBudgetRequest(0);
        mockMvc.perform(post("/api/v1/budgets")
                        .header("Authorization", TestHelper.bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /budgets - không có token → 401")
    void createBudget_noToken_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/budgets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildBudgetRequest(1_000_000))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /budgets - lấy danh sách budget theo tháng → 200")
    void getBudgets_returns200() throws Exception {
        createBudget(3_000_000);
        mockMvc.perform(get("/api/v1/budgets")
                        .header("Authorization", TestHelper.bearer(token))
                        .param("spaceId", spaceId.toString())
                        .param("month", String.valueOf(currentMonth))
                        .param("year", String.valueOf(currentYear)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /budgets/status - lấy trạng thái budget → 200 có budgetList")
    void getBudgetStatus_returns200() throws Exception {
        createBudget(2_000_000);
        mockMvc.perform(get("/api/v1/budgets/status")
                        .header("Authorization", TestHelper.bearer(token))
                        .param("spaceId", spaceId.toString())
                        .param("month", String.valueOf(currentMonth))
                        .param("year", String.valueOf(currentYear)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.budgetList").isArray());
    }

    @Test
    @DisplayName("GET /budgets/overview - lấy tổng quan budget → 200")
    void getBudgetOverview_returns200() throws Exception {
        createBudget(4_000_000);
        mockMvc.perform(get("/api/v1/budgets/overview")
                        .header("Authorization", TestHelper.bearer(token))
                        .param("spaceId", spaceId.toString())
                        .param("month", String.valueOf(currentMonth))
                        .param("year", String.valueOf(currentYear)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalBudget").isNumber())
                .andExpect(jsonPath("$.totalSpent").isNumber());
    }

    @Test
    @DisplayName("Budget status EXCEEDED khi chi tiêu vượt ngân sách")
    void budgetStatus_exceeded_whenSpendingOverLimit() throws Exception {
        createBudget(100_000);

        TransactionRequest txReq = new TransactionRequest();
        txReq.setSpaceId(spaceId);
        txReq.setCategoryId(categoryId);
        txReq.setWalletId(walletId);
        txReq.setType(TransactionType.EXPENSE);
        txReq.setAmount(BigDecimal.valueOf(200_000));
        txReq.setTransactionDate(LocalDate.now());

        mockMvc.perform(post("/api/v1/transactions")
                        .header("Authorization", TestHelper.bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(txReq)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/budgets/status")
                        .header("Authorization", TestHelper.bearer(token))
                        .param("spaceId", spaceId.toString())
                        .param("month", String.valueOf(currentMonth))
                        .param("year", String.valueOf(currentYear)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.budgetList").isArray())
                .andExpect(jsonPath("$.budgetList[0].status").value("EXCEEDED"));
    }

    @Test
    @DisplayName("PUT /budgets/{id} - cập nhật budget → 200")
    void updateBudget_returns200() throws Exception {
        Long id = createBudget(2_000_000);
        BudgetRequest updated = buildBudgetRequest(3_000_000);
        mockMvc.perform(put("/api/v1/budgets/" + id)
                        .header("Authorization", TestHelper.bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updated)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(3_000_000));
    }

    @Test
    @DisplayName("DELETE /budgets/{id} - xóa budget → 204")
    void deleteBudget_returns204() throws Exception {
        Long id = createBudget(1_500_000);
        mockMvc.perform(delete("/api/v1/budgets/" + id)
                        .header("Authorization", TestHelper.bearer(token)))
                .andExpect(status().isNoContent());
    }
}
