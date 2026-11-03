// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.controller;

import com.example.bton.dto.request.FinancialSpaceRequest;
import com.example.bton.dto.response.FamilyMemberResponse;
import com.example.bton.dto.response.FinancialSpaceResponse;
import com.example.bton.enums.FamilyRole;
import com.example.bton.security.UserPrincipal;
import com.example.bton.service.impl.FinancialSpaceServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/spaces")
@RequiredArgsConstructor
@Tag(name = "Financial Spaces", description = "Financial space and family member management")
@SecurityRequirement(name = "bearerAuth")
public class FinancialSpaceController {

    private final FinancialSpaceServiceImpl spaceService;

    @GetMapping
    @Operation(summary = "Get all accessible financial spaces")
    public ResponseEntity<List<FinancialSpaceResponse>> getSpaces(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(spaceService.getAccessibleSpaces(currentUser.getId()));
    }

    @PostMapping
    @Operation(summary = "Create a new financial space")
    public ResponseEntity<FinancialSpaceResponse> createSpace(
            @Valid @RequestBody FinancialSpaceRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(spaceService.createSpace(request, currentUser.getId()));
    }

    @PostMapping("/join")
    @Operation(summary = "Join family space using invite code (UC09)")
    public ResponseEntity<FinancialSpaceResponse> joinFamily(
            @RequestParam String inviteCode,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(spaceService.joinFamilyByInviteCode(inviteCode, currentUser.getId()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a financial space by ID")
    public ResponseEntity<FinancialSpaceResponse> getSpace(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(spaceService.getSpaceById(id, currentUser.getId()));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a financial space")
    public ResponseEntity<FinancialSpaceResponse> updateSpace(
            @PathVariable Long id,
            @Valid @RequestBody FinancialSpaceRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(spaceService.updateSpace(id, request, currentUser.getId()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete (deactivate) a financial space")
    public ResponseEntity<Void> deleteSpace(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        spaceService.deleteSpace(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/members")
    @Operation(summary = "Get members of a family space")
    public ResponseEntity<List<FamilyMemberResponse>> getMembers(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(spaceService.getMembers(id, currentUser.getId()));
    }

    @PostMapping("/{id}/members")
    @Operation(summary = "Add a member to a family space")
    public ResponseEntity<FamilyMemberResponse> addMember(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        String usernameOrEmail = body.get("usernameOrEmail");
        String roleStr = body.get("role");
        FamilyRole role = roleStr != null ? FamilyRole.valueOf(roleStr) : FamilyRole.MEMBER;
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(spaceService.addMember(id, usernameOrEmail, role, currentUser.getId()));
    }

    @DeleteMapping("/{id}/members/{userId}")
    @Operation(summary = "Remove a member from a family space")
    public ResponseEntity<Void> removeMember(
            @PathVariable Long id,
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        spaceService.removeMember(id, userId, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/leave")
    @Operation(summary = "Leave a family space (FIN-NB12)")
    public ResponseEntity<Void> leaveFamily(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        spaceService.leaveFamily(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}
