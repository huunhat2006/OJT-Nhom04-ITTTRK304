// Tác giả: Nguyễn Mạnh Thắng (QA/Tester & Báo cáo)
package com.example.bton;

import com.example.bton.dto.request.FinancialSpaceRequest;
import com.example.bton.enums.SpaceType;
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

import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class FamilySpaceControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    private static final AtomicInteger memberCounter = new AtomicInteger(1000);

    private String ownerToken;
    private String memberToken;
    private String memberUsername;

    @BeforeEach
    void setUp() throws Exception {
        ownerToken = TestHelper.registerAndGetToken(mockMvc, objectMapper);
        int uid = memberCounter.incrementAndGet();
        memberUsername = "fmember_" + uid;
        memberToken = TestHelper.registerAndGetToken(mockMvc, objectMapper,
                memberUsername, memberUsername + "@example.com");
    }

    private Long createFamilySpace(String name) throws Exception {
        FinancialSpaceRequest req = new FinancialSpaceRequest();
        req.setName(name);
        req.setType(SpaceType.FAMILY);
        req.setDescription("Family test space");
        req.setCurrency("VND");
        MvcResult r = mockMvc.perform(post("/api/v1/spaces")
                        .header("Authorization", TestHelper.bearer(ownerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated()).andReturn();
        return objectMapper.readTree(r.getResponse().getContentAsString()).get("id").asLong();
    }

    @Test
    @DisplayName("GET /spaces - user mới có ít nhất 1 personal space → 200")
    void getSpaces_newUser_hasPersonalSpace() throws Exception {
        mockMvc.perform(get("/api/v1/spaces")
                        .header("Authorization", TestHelper.bearer(ownerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @DisplayName("POST /spaces - tạo PERSONAL space → 201")
    void createPersonalSpace_returns201() throws Exception {
        FinancialSpaceRequest req = new FinancialSpaceRequest();
        req.setName("Không gian cá nhân 2");
        req.setType(SpaceType.PERSONAL);
        mockMvc.perform(post("/api/v1/spaces")
                        .header("Authorization", TestHelper.bearer(ownerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Không gian cá nhân 2"))
                .andExpect(jsonPath("$.type").value("PERSONAL"));
    }

    @Test
    @DisplayName("POST /spaces - không có token → 401")
    void createSpace_noToken_returns401() throws Exception {
        FinancialSpaceRequest req = new FinancialSpaceRequest();
        req.setName("Test Space");
        req.setType(SpaceType.PERSONAL);
        mockMvc.perform(post("/api/v1/spaces")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /spaces - thiếu name → 400")
    void createSpace_missingName_returns400() throws Exception {
        FinancialSpaceRequest req = new FinancialSpaceRequest();
        req.setType(SpaceType.PERSONAL);
        mockMvc.perform(post("/api/v1/spaces")
                        .header("Authorization", TestHelper.bearer(ownerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /spaces - tạo FAMILY space → 201 có inviteCode")
    void createFamilySpace_hasInviteCode() throws Exception {
        FinancialSpaceRequest req = new FinancialSpaceRequest();
        req.setName("Gia đình Nguyễn");
        req.setType(SpaceType.FAMILY);
        req.setCurrency("VND");
        mockMvc.perform(post("/api/v1/spaces")
                        .header("Authorization", TestHelper.bearer(ownerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("FAMILY"))
                .andExpect(jsonPath("$.inviteCode").isNotEmpty());
    }

    @Test
    @DisplayName("GET /spaces/{id} - lấy chi tiết → 200")
    void getSpaceById_returns200() throws Exception {
        Long id = createFamilySpace("Gia đình test");
        mockMvc.perform(get("/api/v1/spaces/" + id)
                        .header("Authorization", TestHelper.bearer(ownerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id));
    }

    @Test
    @DisplayName("GET /spaces/{id} - không tồn tại → 404")
    void getSpaceById_notFound_returns404() throws Exception {
        mockMvc.perform(get("/api/v1/spaces/999999")
                        .header("Authorization", TestHelper.bearer(ownerToken)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT /spaces/{id} - cập nhật space → 200")
    void updateSpace_returns200() throws Exception {
        Long id = createFamilySpace("Gia đình cũ");
        FinancialSpaceRequest req = new FinancialSpaceRequest();
        req.setName("Gia đình mới");
        req.setType(SpaceType.FAMILY);
        mockMvc.perform(put("/api/v1/spaces/" + id)
                        .header("Authorization", TestHelper.bearer(ownerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Gia đình mới"));
    }

    @Test
    @DisplayName("POST /{id}/members - mời thành viên → 201")
    void addMember_returns201() throws Exception {
        Long familyId = createFamilySpace("Gia đình mời");
        Map<String, String> body = Map.of("usernameOrEmail", memberUsername, "role", "MEMBER");
        mockMvc.perform(post("/api/v1/spaces/" + familyId + "/members")
                        .header("Authorization", TestHelper.bearer(ownerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value(memberUsername));
    }

    @Test
    @DisplayName("GET /{id}/members - danh sách thành viên → 200 gồm owner + member")
    void getMembers_includesOwnerAndMember() throws Exception {
        Long familyId = createFamilySpace("Gia đình thành viên");
        Map<String, String> body = Map.of("usernameOrEmail", memberUsername, "role", "MEMBER");
        mockMvc.perform(post("/api/v1/spaces/" + familyId + "/members")
                        .header("Authorization", TestHelper.bearer(ownerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated());
        mockMvc.perform(get("/api/v1/spaces/" + familyId + "/members")
                        .header("Authorization", TestHelper.bearer(ownerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(2))));
    }

    @Test
    @DisplayName("DELETE /{id}/members/{userId} - kick thành viên → 204")
    void removeMember_returns204() throws Exception {
        Long familyId = createFamilySpace("Gia đình kick");
        Map<String, String> addBody = Map.of("usernameOrEmail", memberUsername, "role", "MEMBER");
        MvcResult addResult = mockMvc.perform(post("/api/v1/spaces/" + familyId + "/members")
                        .header("Authorization", TestHelper.bearer(ownerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addBody)))
                .andExpect(status().isCreated()).andReturn();
        Long memberId = objectMapper.readTree(addResult.getResponse().getContentAsString())
                .get("userId").asLong();
        mockMvc.perform(delete("/api/v1/spaces/" + familyId + "/members/" + memberId)
                        .header("Authorization", TestHelper.bearer(ownerToken)))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("POST /join - tham gia bằng invite code → 200")
    void joinFamilyByInviteCode_returns200() throws Exception {
        FinancialSpaceRequest req = new FinancialSpaceRequest();
        req.setName("Gia đình invite");
        req.setType(SpaceType.FAMILY);
        MvcResult createResult = mockMvc.perform(post("/api/v1/spaces")
                        .header("Authorization", TestHelper.bearer(ownerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated()).andReturn();
        String inviteCode = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("inviteCode").asText();
        mockMvc.perform(post("/api/v1/spaces/join")
                        .header("Authorization", TestHelper.bearer(memberToken))
                        .param("inviteCode", inviteCode))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("FAMILY"));
    }

    @Test
    @DisplayName("POST /join - invite code sai → 4xx")
    void joinFamily_wrongInviteCode_returnsError() throws Exception {
        int status = mockMvc.perform(post("/api/v1/spaces/join")
                        .header("Authorization", TestHelper.bearer(memberToken))
                        .param("inviteCode", "INVALID_CODE_XYZ"))
                .andReturn().getResponse().getStatus();
        Assertions.assertTrue(status == 400 || status == 404,
                "Expected 400 or 404, got: " + status);
    }

    @Test
    @DisplayName("POST /{id}/leave - rời khỏi family → 204")
    void leaveFamily_returns204() throws Exception {
        Long familyId = createFamilySpace("Gia đình rời");
        Map<String, String> body = Map.of("usernameOrEmail", memberUsername, "role", "MEMBER");
        mockMvc.perform(post("/api/v1/spaces/" + familyId + "/members")
                        .header("Authorization", TestHelper.bearer(ownerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/v1/spaces/" + familyId + "/leave")
                        .header("Authorization", TestHelper.bearer(memberToken)))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /spaces/{id} - owner xóa space → 204")
    void deleteSpace_returns204() throws Exception {
        Long id = createFamilySpace("Gia đình xóa");
        mockMvc.perform(delete("/api/v1/spaces/" + id)
                        .header("Authorization", TestHelper.bearer(ownerToken)))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /spaces/{id} - non-owner không xóa được → 403 hoặc 404")
    void deleteSpace_notOwner_forbidden() throws Exception {
        Long id = createFamilySpace("Gia đình bảo vệ");
        int status = mockMvc.perform(delete("/api/v1/spaces/" + id)
                        .header("Authorization", TestHelper.bearer(memberToken)))
                .andReturn().getResponse().getStatus();
        Assertions.assertTrue(status == 403 || status == 404,
                "Expected 403 or 404, got: " + status);
    }
}
