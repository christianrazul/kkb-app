FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /workspace

COPY gradle gradle
COPY gradlew gradlew
COPY gradlew.bat gradlew.bat
COPY settings.gradle.kts settings.gradle.kts
COPY build.gradle.kts build.gradle.kts
COPY src src

RUN chmod +x gradlew && ./gradlew bootJar --no-daemon

FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S kkb && adduser -S kkb -G kkb

WORKDIR /app
COPY --from=build /workspace/build/libs/kkb-backend-0.1.0.jar app.jar

USER kkb
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
