# Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
# ============================================================
# Dockerfile — Backend (Spring Boot 3 / Java 21)
# Multi-stage build: builder → runtime
# ============================================================

# ── Stage 1: Build ────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder

# Cài Gradle 8.12 trực tiếp vào image — không dùng wrapper download để tránh timeout CI
ARG GRADLE_VERSION=8.12
ENV GRADLE_HOME=/opt/gradle
ENV PATH="${GRADLE_HOME}/bin:${PATH}"

RUN apk add --no-cache wget unzip curl \
    && for i in 1 2 3; do \
         wget -q --tries=3 --timeout=120 --waitretry=5 \
             "https://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-bin.zip" \
             -O /tmp/gradle.zip && break || \
         echo "Download attempt $i failed, retrying..."; \
         sleep 5; \
       done \
    && unzip -q /tmp/gradle.zip -d /opt \
    && mv /opt/gradle-${GRADLE_VERSION} ${GRADLE_HOME} \
    && rm /tmp/gradle.zip \
    && gradle --version

WORKDIR /workspace

# Copy dependency manifests (cache layer — chỉ rebuild khi các file này thay đổi)
COPY build.gradle settings.gradle gradle.properties ./
COPY gradle/ gradle/

# Download dependencies trước khi copy source (tận dụng Docker layer cache)
RUN GRADLE_OPTS="-Xmx512m -Xms256m" gradle dependencies --no-daemon -q || true

# Copy source và build fat jar
COPY src/ src/
RUN GRADLE_OPTS="-Xmx512m -Xms256m" gradle bootJar --no-daemon -x test --stacktrace

# ── Stage 2: Runtime ──────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runtime

# Security: install fonts for PDF/charts generation, create user and app directory with logs
RUN apk add --no-cache font-dejavu ttf-dejavu fontconfig \
    && addgroup -S bton && adduser -S bton -G bton \
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
    "-Djava.awt.headless=true", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "app.jar"]
