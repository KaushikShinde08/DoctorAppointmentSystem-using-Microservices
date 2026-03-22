package com.hospital.doctor.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 404 - Doctor/Slot not found
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        return build(ex.getMessage(), 404, HttpStatus.NOT_FOUND);
    }

    // 400 - Slot already booked or unavailable
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(IllegalStateException ex) {
        return build(ex.getMessage(), 400, HttpStatus.BAD_REQUEST);
    }

    // 400 - Wrong type passed for a query param (e.g., LocalDate, Mode enum)
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String message = String.format("The parameter '%s' should be of type '%s'",
                ex.getName(), ex.getRequiredType().getSimpleName());
        return build(message, 400, HttpStatus.BAD_REQUEST);
    }

    // 409 - Race condition on slot booking
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ErrorResponse> handleOptimisticLocking(ObjectOptimisticLockingFailureException ex) {
        return build("This slot was just booked by someone else. Please choose another slot.", 409, HttpStatus.CONFLICT);
    }

    // 500 - Unexpected errors (must be LAST)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        ex.printStackTrace();
        return build("An unexpected error occurred: " + ex.getMessage(), 500, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private ResponseEntity<ErrorResponse> build(String message, int code, HttpStatus status) {
        return new ResponseEntity<>(new ErrorResponse(message, code, LocalDateTime.now()), status);
    }
}
