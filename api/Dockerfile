FROM gradle:8.10.2-jdk17

WORKDIR /app

COPY . .

RUN gradle bootJar --no-daemon

FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=0 /app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]