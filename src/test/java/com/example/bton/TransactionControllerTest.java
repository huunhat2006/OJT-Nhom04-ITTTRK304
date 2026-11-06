// Tác giả: Nguyễn Mạnh Thắng (QA/Tester & Báo cáo)
package com.example.bton;

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
class TransactionControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    private String token;
    private Long spaceId;
    private Long categoryId;
    private Long walletId; // wallet có balance lớn để test EXPENSE

    @BeforeEach
    void setUp() throws Exception {
        token = TestHelper.registerAndGetToken(mockMvc, objectMapper);
        spaceId = getPersonalSpaceId(token);

        // Tạo category (H2 không có system categories vì Flyway disabled)
        categoryId = createCategory(token, "Test Category", CategoryType.EXPENSE);

        // Tạo wallet với balance lớn để EXPENSE transaction không bị reject
        walletId = createWallet(token, spaceId, "Test Wallet", 100_000_000.0);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private Long getPersonalSpaceId(String t) throws Exception {
        MvcResult r = mockMvc.perform(get("/api/v1/spaces")
                        .header("Authorization", TestHelper.bearer(t)))
                .andExpect(status().isOk()).andReturn();
        return objectMapper.readTree(r.getResponse().getContentAsString()).get(0).get("id").asLong();
    }

    private Long createCategory(String t, String name, CategoryType type) throws Exception {
        CategoryRequest req = new CategoryRequest();
        req.setName(name);
        req.setType(type);
        MvcResult r = mockMvc.perform(post("/api/v1/categories")
                        .header("Authorization", TestHelper.bearer(t))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated()).andReturn();
        return objectMapper.readTree(r.getResponse().getContentAsString()).get("id").asLong();
    }

    private Long createWallet(String t, Long sid, String name, double initialBalance) throws Exception {
        WalletRequest req = new WalletRequest();
        req.setName(name);
        req.setWalletType(WalletType.CASH);
        req.setCurrency("VND");
        req.setInitialBalance(BigDecimal.valueOf(initialBalance));
        req.setSpaceId(sid);
        MvcResult r = mockMvc.perform(post("/api/v1/wallets")
                        .header("Authorization", TestHelper.bearer(t))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated()).andReturn();
        return objectMapper.readTree(r.getResponse().getContentAsString()).get("id").asLong();
    }

    private TransactionRequest buildRequest(TransactionType type, double amount) {
        TransactionRequest req = new TransactionRequest();
        req.setSpaceId(spaceId);
        req.setCategoryId(categoryId);
        req.setWalletId(walletId);
        req.setType(type);
        req.setAmount(BigDecimal.valueOf(amount));
        req.setTransactionDate(LocalDate.now());
        req.setDescription("Test " + type);
        return req;
    }

    private Long createTransaction(TransactionType type, double amount) throws Exception {
        MvcResult r = mockMvc.perform(post("/api/v1/transactions")
                        .header("Authorization", TestHelper.bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildRequest(type, amount))))
                .andExpect(status().isCreated()).andReturn();
        return objectMapper.readTree(r.getResponse().getContentAsString()).get("id").asLong();
    }

    // ── tests ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /transactions - tạo INCOME → 201")
    void createTransaction_income_returns201() throws Exception {
        mockMvc.perform(post("/api/v1/transactions")
                        .header("Authorization", TestHelper.bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildRequest(TransactionType.INCOME, 1_000_000))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.type").value("INCOME"))
                .andExpect(jsonPath("$.amount").value(1_000_000));
    }

    @Test
    @DisplayName("POST /transactions - tạo EXPENSE → 201")
    void createTransaction_expense_returns201() throws Exception {
        mockMvc.perform(post("/api/v1/transactions")
                        .header("Authorization", TestHelper.bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildRequest(TransactionType.EXPENSE, 500_000))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("EXPENSE"));
    }

    @Test
    @DisplayName("POST /transactions - thiếu amount → 400")
    void createTransaction_missingAmount_returns400() throws Exception {
        TransactionRequest req = buildRequest(TransactionType.INCOME, 100);
        req.setAmount(null);
        mockMvc.perform(post("/api/v1/transactions")
                        .header("Authorization", TestHelper.bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /transactions - không có token → 401")
    void createTransaction_noToken_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildRequest(TransactionType.INCOME, 100))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /transactions - phân trang → 200 có content + totalElements")
    void getTransactions_pagination_returns200() throws Exception {
        createTransaction(TransactionType.INCOME, 1_000_000);
        createTransaction(TransactionType.EXPENSE, 200_000);
        mockMvc.perform(get("/api/v1/transactions")
                        .header("Authorization", TestHelper.bearer(token))
                        .param("spaceId", spaceId.toString())
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").isNumber());
    }

    @Test
    @DisplayName("GET /transactions - filter theo type INCOME")
    void getTransactions_filterByType_returnsOnlyIncome() throws Exception {
        createTransaction(TransactionType.INCOME, 1_000_000);
        createTransaction(TransactionType.EXPENSE, 200_000);
        mockMvc.perform(get("/api/v1/transactions")
                        .header("Authorization", TestHelper.bearer(token))
                        .param("spaceId", spaceId.toString())
                        .param("type", "INCOME"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].type", everyItem(is("INCOME"))));
    }

    @Test
    @DisplayName("GET /transactions/{id} - lấy chi tiết → 200")
    void getTransactionById_returns200() throws Exception {
        Long id = createTransaction(TransactionType.INCOME, 750_000);
        mockMvc.perform(get("/api/v1/transactions/" + id)
                        .header("Authorization", TestHelper.bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id));
    }

    @Test
    @DisplayName("GET /transactions/{id} - không tồn tại → 404")
    void getTransactionById_notFound_returns404() throws Exception {
        mockMvc.perform(get("/api/v1/transactions/999999")
                        .header("Authorization", TestHelper.bearer(token)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT /transactions/{id} - cập nhật → 200")
    void updateTransaction_returns200() throws Exception {
        Long id = createTransaction(TransactionType.INCOME, 500_000);
        TransactionRequest updated = buildRequest(TransactionType.INCOME, 800_000);
        updated.setDescription("Updated");
        mockMvc.perform(put("/api/v1/transactions/" + id)
                        .header("Authorization", TestHelper.bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updated)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(800_000));
    }

    @Test
    @DisplayName("DELETE /transactions/{id} - xóa → 204")
    void deleteTransaction_returns204() throws Exception {
        Long id = createTransaction(TransactionType.EXPENSE, 100_000);
        mockMvc.perform(delete("/api/v1/transactions/" + id)
                        .header("Authorization", TestHelper.bearer(token)))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /transactions/{id} - không có token → 401")
    void deleteTransaction_noToken_returns401() throws Exception {
        // Tạo INCOME (không cần balance check)
        Long id = createTransaction(TransactionType.INCOME, 100_000);
        mockMvc.perform(delete("/api/v1/transactions/" + id))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("User khác không thấy transaction của user này")
    void getTransactions_otherUser_cannotSeeTransactions() throws Exception {
        createTransaction(TransactionType.INCOME, 1_000_000);
        String otherToken = TestHelper.registerAndGetToken(mockMvc, objectMapper);
        Long otherSpaceId = getPersonalSpaceId(otherToken);
        mockMvc.perform(get("/api/v1/transactions")
                        .header("Authorization", TestHelper.bearer(otherToken))
                        .param("spaceId", otherSpaceId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)));
    }
}
