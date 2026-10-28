// Tác giả: Nguyễn Mạnh Thắng (QA/Tester & Báo cáo)
package com.example.bton;

import com.example.bton.dto.request.LoginRequest;
import com.example.bton.dto.request.RegisterRequest;
import com.example.bton.dto.response.AuthResponse;
import com.example.bton.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Test
    void register_withValidData_returnsTokenAndCreatesPersonalSpace() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("testuser123");
        request.setEmail("testuser123@example.com");
        request.setPassword("Test@1234");
        request.setFullName("Test User");

        MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.role").value("USER"))
                .andReturn();

        AuthResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(), AuthResponse.class);
        assertThat(response.getUsername()).isEqualTo("testuser123");
        assertThat(userRepository.existsByUsername("testuser123")).isTrue();
    }

    @Test
    void register_withDuplicateUsername_returns409() throws Exception {
        // Register first user
        RegisterRequest first = new RegisterRequest();
        first.setUsername("duplicate_user");
        first.setEmail("first@example.com");
        first.setPassword("Test@1234");
        first.setFullName("First User");
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(first)))
                .andExpect(status().isCreated());

        // Try same username
        RegisterRequest second = new RegisterRequest();
        second.setUsername("duplicate_user");
        second.setEmail("second@example.com");
        second.setPassword("Test@1234");
        second.setFullName("Second User");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(second)))
                .andExpect(status().isConflict());
    }

    @Test
    void register_cannotSetAdminRole() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("hacker_admin");
        request.setEmail("hacker@example.com");
        request.setPassword("Test@1234");
        request.setFullName("Hacker");

        MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(), AuthResponse.class);
        // Must always be USER role
        assertThat(response.getRole().name()).isEqualTo("USER");
    }

    @Test
    void login_withValidCredentials_returnsToken() throws Exception {
        // Register first
        RegisterRequest reg = new RegisterRequest();
        reg.setUsername("logintest");
        reg.setEmail("logintest@example.com");
        reg.setPassword("Test@1234");
        reg.setFullName("Login Test");
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated());

        LoginRequest login = new LoginRequest();
        login.setUsernameOrEmail("logintest");
        login.setPassword("Test@1234");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty());
    }

    @Test
    void login_withWrongPassword_returns401() throws Exception {
        LoginRequest login = new LoginRequest();
        login.setUsernameOrEmail("admin");
        login.setPassword("WrongPassword123");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void accessProtectedEndpoint_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void accessAdminEndpoint_withUserToken_returns403() throws Exception {
        // Register user
        RegisterRequest reg = new RegisterRequest();
        reg.setUsername("normaluser_test");
        reg.setEmail("normaluser_test@example.com");
        reg.setPassword("Test@1234");
        reg.setFullName("Normal User");
        MvcResult regResult = mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated())
                .andReturn();
        String token = objectMapper.readValue(
                regResult.getResponse().getContentAsString(), AuthResponse.class).getAccessToken();

        // Try to access admin endpoint
        mockMvc.perform(get("/api/v1/admin/dashboard")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }
}
