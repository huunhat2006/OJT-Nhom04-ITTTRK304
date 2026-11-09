// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.config;

import com.example.bton.security.CookieOAuth2AuthorizationRequestRepository;
import com.example.bton.security.CustomUserDetailsService;
import com.example.bton.security.JwtAuthenticationFilter;
import com.example.bton.security.JwtTokenProvider;
import com.example.bton.security.OAuth2LoginSuccessHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final JwtTokenProvider jwtTokenProvider;
    private final CookieOAuth2AuthorizationRequestRepository cookieRepo;
    private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;

    public SecurityConfig(CustomUserDetailsService userDetailsService,
                          JwtTokenProvider jwtTokenProvider,
                          CookieOAuth2AuthorizationRequestRepository cookieRepo,
                          @Lazy OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler) {
        this.userDetailsService = userDetailsService;
        this.jwtTokenProvider = jwtTokenProvider;
        this.cookieRepo = cookieRepo;
        this.oAuth2LoginSuccessHandler = oAuth2LoginSuccessHandler;
    }

    @Value("${app.cors.allowed-origins:*}")
    private String allowedOrigins;

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter(jwtTokenProvider, userDetailsService);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.setStatus(401);
                            Map<String, Object> body = new HashMap<>();
                            body.put("status", 401);
                            body.put("error", "Unauthorized");
                            body.put("message", "Authentication is required to access this resource");
                            body.put("path", request.getRequestURI());
                            new ObjectMapper().writeValue(response.getOutputStream(), body);
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.setStatus(403);
                            Map<String, Object> body = new HashMap<>();
                            body.put("status", 403);
                            body.put("error", "Forbidden");
                            body.put("message", "You don't have permission to access this resource");
                            body.put("path", request.getRequestURI());
                            new ObjectMapper().writeValue(response.getOutputStream(), body);
                        }))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers("/swagger-ui/**", "/swagger-ui.html",
                                "/api-docs/**", "/v3/api-docs/**")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/actuator/health", "/actuator/metrics", "/actuator/metrics/**", "/actuator/info").permitAll()
                        // Admin only
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                        // All other requests need authentication
                        .anyRequest().authenticated())
                .oauth2Login(oauth2 -> oauth2
                        .authorizationEndpoint(ep -> ep
                                .baseUri("/api/v1/auth/oauth2/authorize")
                                .authorizationRequestRepository(cookieRepo))
                        .redirectionEndpoint(ep -> ep
                                .baseUri("/api/v1/auth/oauth2/callback/*"))
                        .successHandler(oAuth2LoginSuccessHandler)
                        .failureHandler((request, response, exception) -> {
                            org.slf4j.LoggerFactory.getLogger(SecurityConfig.class)
                                    .error("OAuth2 authentication failure: ", exception);
                            String msg = exception.getMessage() != null 
                                    ? java.net.URLEncoder.encode(exception.getMessage(), java.nio.charset.StandardCharsets.UTF_8) 
                                    : "oauth2_failure";
                            response.sendRedirect("https://budgivee.online/login?error=" + msg);
                        }))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter(),
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());

        if (origins.isEmpty() || origins.contains("*")) {
            configuration.setAllowedOriginPatterns(List.of("*"));
        } else {
            List<String> patternList = new ArrayList<>(origins);
            if (!patternList.contains("http://localhost:*")) {
                patternList.add("http://localhost:*");
                patternList.add("http://127.0.0.1:*");
            }
            configuration.setAllowedOriginPatterns(patternList);
        }

        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization", "Link", "X-Total-Count"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
