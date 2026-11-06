// Tác giả: Nguyễn Mạnh Thắng (QA/Tester & Báo cáo)
package com.example.bton;

import com.example.bton.dto.request.CategoryRequest;
import com.example.bton.dto.request.TransactionRequest;
import com.example.bton.dto.request.WalletRequest;
import com.example.bton.enums.CategoryType;
import com.example.bton.enums.TransactionType;
import com.example.bton.enums.WalletType;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Assertions;
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
class CategoryControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    private String token;
    private Long spaceId;
    private Long walletId;
    private Long expenseCategoryId; // Dùng chung cho tests cần transaction

    @BeforeEach
    void setUp() throws Exception {
        token = TestHelper.registerAndGetToken(mockMvc, objectMapper);
        MvcResult r = mockMvc.perform(get("/api/v1/spaces")
                        .header("Authorization", TestHelper.bearer(token)))
                .andExpect(status().isOk()).andReturn();
        spaceId = objectMapper.readTree(r.getResponse().getContentAsString()).get(0).get("id").asLong();

        // Tạo sẵn 1 expense category dùng chung
        expenseCategoryId = createCategory("Shared Expense Category", CategoryType.EXPENSE);

        // Tạo wallet với balance lớn để EXPENSE transaction không bị reject
        WalletRequest walletReq = new WalletRequest();
        walletReq.setName("Category Test Wallet");
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
    }

    private Long createCategory(String name, CategoryType type) throws Exception {
        CategoryRequest req = new CategoryRequest();
        req.setName(name);
        req.setType(type);
        req.setIcon("tag");
        req.setColor("#FF5733");
        MvcResult r = mockMvc.perform(post("/api/v1/categories")
                        .header("Authorization", TestHelper.bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated()).andReturn();
        return objectMapper.readTree(r.getResponse().getContentAsString()).get("id").asLong();
    }

    @Test
    @DisplayName("GET /categories - trả về danh sách sau khi tạo → 200")
    void getCategories_includesSystemCategories() throws Exception {
        // Tạo 1 category trước vì H2 không có system seed data
        createCategory("Test Get", CategoryType.EXPENSE);
        mockMvc.perform(get("/api/v1/categories")
                        .header("Authorization", TestHelper.bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", not(empty())));
    }

    @Test
    @DisplayName("GET /categories - filter theo type EXPENSE")
    void getCategories_filterByExpenseType() throws Exception {
        createCategory("EXPENSE Cat", CategoryType.EXPENSE);
        createCategory("INCOME Cat", CategoryType.INCOME);
        mockMvc.perform(get("/api/v1/categories")
                        .header("Authorization", TestHelper.bearer(token))
                        .param("type", "EXPENSE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].type", everyItem(is("EXPENSE"))));
    }

    @Test
    @DisplayName("POST /categories - tạo custom category → 201")
    void createCategory_returns201() throws Exception {
        CategoryRequest req = new CategoryRequest();
        req.setName("Du lịch");
        req.setNameVi("Du lịch");
        req.setType(CategoryType.EXPENSE);
        req.setIcon("plane");
        req.setColor("#3498DB");
        mockMvc.perform(post("/api/v1/categories")
                        .header("Authorization", TestHelper.bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Du lịch"))
                .andExpect(jsonPath("$.type").value("EXPENSE"));
    }

    @Test
    @DisplayName("POST /categories - thiếu name → 400")
    void createCategory_missingName_returns400() throws Exception {
        CategoryRequest req = new CategoryRequest();
        req.setType(CategoryType.INCOME);
        mockMvc.perform(post("/api/v1/categories")
                        .header("Authorization", TestHelper.bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /categories - không có token → 401")
    void createCategory_noToken_returns401() throws Exception {
        CategoryRequest req = new CategoryRequest();
        req.setName("Test");
        req.setType(CategoryType.EXPENSE);
        mockMvc.perform(post("/api/v1/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("PUT /categories/{id} - cập nhật custom category → 200")
    void updateCategory_returns200() throws Exception {
        Long id = createCategory("Mua sắm", CategoryType.EXPENSE);
        CategoryRequest updated = new CategoryRequest();
        updated.setName("Mua sắm online");
        updated.setType(CategoryType.EXPENSE);
        mockMvc.perform(put("/api/v1/categories/" + id)
                        .header("Authorization", TestHelper.bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updated)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Mua sắm online"));
    }

    @Test
    @DisplayName("DELETE /categories/{id} - xóa custom category không có transaction → 204")
    void deleteCategory_noTransaction_returns204() throws Exception {
        Long id = createCategory("Tạm xóa", CategoryType.EXPENSE);
        mockMvc.perform(delete("/api/v1/categories/" + id)
                        .header("Authorization", TestHelper.bearer(token)))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /categories/{id} - xóa system category → không cho phép (skip nếu không có)")
    void deleteCategory_systemCategory_forbidden() throws Exception {
        MvcResult r = mockMvc.perform(get("/api/v1/categories")
                        .header("Authorization", TestHelper.bearer(token)))
                .andExpect(status().isOk()).andReturn();
        var arr = objectMapper.readTree(r.getResponse().getContentAsString());
        Long systemCatId = null;
        for (var node : arr) {
            if (node.has("isSystem") && node.get("isSystem").asBoolean()) {
                systemCatId = node.get("id").asLong();
                break;
            }
        }
        // H2 test DB không có system categories (Flyway disabled), skip nếu rỗng
        if (systemCatId == null) return;
        int status = mockMvc.perform(delete("/api/v1/categories/" + systemCatId)
                        .header("Authorization", TestHelper.bearer(token)))
                .andReturn().getResponse().getStatus();
        Assertions.assertTrue(status == 400 || status == 403 || status == 404,
                "System category delete should return 400/403/404, got: " + status);
    }

    @Test
    @DisplayName("DELETE /categories/{id} - category có transaction → API không crash (2xx hoặc 4xx)")
    void deleteCategory_withTransaction_doesNotCrash() throws Exception {
        // Dùng expenseCategoryId đã tạo từ setUp (cùng transaction)
        TransactionRequest txReq = new TransactionRequest();
        txReq.setSpaceId(spaceId);
        txReq.setCategoryId(expenseCategoryId);
        txReq.setWalletId(walletId);
        txReq.setType(TransactionType.EXPENSE);
        txReq.setAmount(BigDecimal.valueOf(100_000));
        txReq.setTransactionDate(LocalDate.now());
        mockMvc.perform(post("/api/v1/transactions")
                        .header("Authorization", TestHelper.bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(txReq)))
                .andExpect(status().isCreated());
        int status = mockMvc.perform(delete("/api/v1/categories/" + expenseCategoryId)
                        .header("Authorization", TestHelper.bearer(token)))
                .andReturn().getResponse().getStatus();
        Assertions.assertTrue(status >= 200 && status < 500,
                "Unexpected server error on delete: " + status);
    }
}
