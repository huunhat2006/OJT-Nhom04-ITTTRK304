# Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
# ============================================================
# Dockerfile — Backend (Spring Boot 3 / Java 21)
# Multi-stage build: builder → runtime
# ============================================================

# ── Stage 1: Build ────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /workspace

# Copy Gradle wrapper and dependency manifests first (cache layer)
COPY gradlew gradlew.bat ./
COPY gradle/ gradle/
COPY build.gradle settings.gradle ./

# Download dependencies (cached unless build files change)
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon -q || true

# Copy source and build the fat jar
COPY src/ src/
RUN ./gradlew bootJar --no-daemon -x test

# ── Stage 2: Runtime ──────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runtime

# Security: run as non-root
RUN addgroup -S bton && adduser -S bton -G bton

WORKDIR /app

# Copy the built jar from the builder stage
COPY --from=builder /workspace/build/libs/*.jar app.jar

# Change ownership
RUN chown bton:bton app.jar

USER bton

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -qO- http://localhost:8080/actuator/health || exit 1

# Use exec form to handle signals properly (graceful shutdown)
ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "app.jar"]
