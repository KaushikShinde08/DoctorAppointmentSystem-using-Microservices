package com.hospital.auth_service.service.impl;


import com.hospital.auth_service.dto.AuthResponse;
import com.hospital.auth_service.dto.LoginRequest;
import com.hospital.auth_service.dto.RegisterRequest;
import com.hospital.auth_service.entity.Role;
import com.hospital.auth_service.entity.User;
import com.hospital.auth_service.exception.InvalidCredentialsException;
import com.hospital.auth_service.exception.UserAlreadyExistsException;
import com.hospital.auth_service.exception.UserNotFoundException;
import com.hospital.auth_service.repository.UserRepository;
import com.hospital.auth_service.security.JwtUtil;
import com.hospital.auth_service.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Override
    public void register(RegisterRequest request) {
        if(userRepository.existsByEmail(request.getEmail())){
            throw new UserAlreadyExistsException("Email already registered");
        }
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(encodedPassword)
                .role(Role.PATIENT)  // by default, all registered users are patients.
                // Admins should be created manually in the database.
                .build();

        userRepository.save(user);
    }

    @Override
    public AuthResponse login(LoginRequest request){
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        if(!passwordEncoder.matches(request.getPassword(), user.getPassword())){
            // Hotfix for manually inserted DB users: check if it's plaintext.
            if (user.getPassword().equals(request.getPassword()) && user.getRole() == Role.ADMIN) {
                // Upgrade password to BCrypt hash
                user.setPassword(passwordEncoder.encode(request.getPassword()));
                userRepository.save(user);
            } else {
                throw new InvalidCredentialsException("Invalid credentials");
            }
        }

        String token = jwtUtil.generateToken(user);
        return new AuthResponse(token);
    }
}
