@echo off
cd D:\ThucTap_304\OJT
java -cp "target/classes;target/test-classes;$(dir lib/*.jar /b | tr '\n' ';')" -Dspring.datasource.url=jdbc:mysql://localhost:3306/bton_db?createDatabaseIfNotExist=true DOTNET:?,DOTNET:? org.springframework.boot.loader.JarLauncher 2>/dev/null || echo "Trying different approach"