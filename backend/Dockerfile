FROM maven:3.9-eclipse-temurin-21 AS test
WORKDIR /workspace
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src src
CMD ["mvn", "-B", "test"]

FROM test AS build
RUN mvn -B package -DskipTests

FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app
RUN useradd --system --uid 10001 appuser
COPY --from=build /workspace/target/orchestration-race-1.0.0.jar app.jar
USER appuser
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
