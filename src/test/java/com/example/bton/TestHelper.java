// Tác giả: Nguyễn Mạnh Thắng (QA/Tester & Báo cáo)
package com.example.bton;

import com.example.bton.dto.request.LoginRequest;
import com.example.bton.dto.request.RegisterRequest;
import com.example.bton.dto.response.AuthResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.concurrent.atomic.AtomicInteger;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Utility class cung cấp helpers dùng chung cho integration tests.
 */
public class TestHelper {

    private static final AtomicInteger counter = new AtomicInteger(0);

    public static String registerAndGetToken(MockMvc mockMvc, ObjectMapper mapper) throws Exception {
        int id = counter.incrementAndGet();
        return registerAndGetToken(mockMvc, mapper, "testuser_" + id, "testuser_" + id + "@example.com");
    }

    public static String registerAndGetToken(MockMvc mockMvc, ObjectMapper mapper,
                                              String username, String email) throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setUsername(username);
        req.setEmail(email);
        req.setPassword("Test@1234");
        req.setFullName("User " + username);

        MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        return mapper.readValue(result.getResponse().getContentAsString(), AuthResponse.class)
                .getAccessToken();
    }

    public static String loginAndGetToken(MockMvc mockMvc, ObjectMapper mapper,
                                           String usernameOrEmail, String password) throws Exception {
        LoginRequest req = new LoginRequest();
        req.setUsernameOrEmail(usernameOrEmail);
        req.setPassword(password);

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();

        return mapper.readValue(result.getResponse().getContentAsString(), AuthResponse.class)
                .getAccessToken();
    }

    public static String bearer(String token) {
        return "Bearer " + token;
    }
}
