package com.example.blog_api.controller;

import com.example.blog_api.dto.UpdateProfileRequest;
import com.example.blog_api.dto.UserProfileResponse;
import com.example.blog_api.service.ArticlePermissionService;
import com.example.blog_api.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
public class UserController {

    private final AuthService authService;
    private final ArticlePermissionService permissionService;

    public UserController(AuthService authService, ArticlePermissionService permissionService) {
        this.authService = authService;
        this.permissionService = permissionService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMyProfile(
            org.springframework.security.core.Authentication auth) {
        Long userId = permissionService.getCurrentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(403).build();
        }
        UserProfileResponse profile = authService.getProfile(userId);
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMyProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            org.springframework.security.core.Authentication auth) {
        Long userId = permissionService.getCurrentUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(403).build();
        }
        try {
            UserProfileResponse profile = authService.updateProfile(userId, request);
            return ResponseEntity.ok(profile);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
