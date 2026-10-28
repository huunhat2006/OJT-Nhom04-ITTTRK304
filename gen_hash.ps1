# Generate BCrypt hash for Admin@1234 using Spring Boot
$scriptDir = "D:\ThucTap_304\OJT"
$targetDir = "$scriptDir/src/main/java/com/example/bton"

# Create a simple Java class to generate the hash
$javaClass = @"
package com.example.bton;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ConfigurableApplicationContext;

public class PasswordHashGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(10);
        String hash = encoder.encode("Admin@1234");
        System.out.println("Hash: " + hash);
        
        // Also check if User@1234 matches
        System.out.println("Verify Admin@1234 against stored hash: " + encoder.matches("Admin@1234", hash));
        
        SpringApplication.exit(context);
    }
}
"@

# Write the Java file
$javaFile = "$targetDir/PasswordHashGenerator.java"
[System.IO.File]::WriteAllBytes("$javaFile", [System.Text.Encoding]::UTF8.GetBytes($javaClass))

# Compile and run
Write-Host "Java class created at $javaFile"