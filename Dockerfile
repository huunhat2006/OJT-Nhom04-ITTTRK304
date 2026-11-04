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

# Security: create user and app directory with logs
RUN addgroup -S bton && adduser -S bton -G bton \
    && mkdir -p /app/logs \
    && chown -R bton:bton /app

WORKDIR /app

# Copy the built jar from the builder stage
COPY --from=builder --chown=bton:bton /workspace/build/libs/*.jar app.jar

USER bton

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=45s --retries=5 \
    CMD wget -qO- http://localhost:8080/actuator/health || exit 1

# Use exec form to handle signals properly (graceful shutdown)
ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "app.jar"]
