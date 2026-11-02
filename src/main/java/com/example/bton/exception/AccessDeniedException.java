// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.FORBIDDEN)
public class AccessDeniedException extends RuntimeException {
    public AccessDeniedException(String message) {
        super(message);
    }

    public AccessDeniedException() {
        super("You don't have permission to access this resource");
    }
}
