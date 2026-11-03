// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.service.impl;

import com.example.bton.dto.request.FinancialSpaceRequest;
import com.example.bton.dto.response.FamilyMemberResponse;
import com.example.bton.dto.response.FinancialSpaceResponse;
import com.example.bton.entity.FamilyMember;
import com.example.bton.entity.FinancialSpace;
import com.example.bton.entity.User;
import com.example.bton.enums.FamilyRole;
import com.example.bton.enums.SpaceType;
import com.example.bton.exception.AccessDeniedException;
import com.example.bton.exception.BadRequestException;
import com.example.bton.exception.ResourceNotFoundException;
import com.example.bton.repository.FamilyMemberRepository;
import com.example.bton.repository.FinancialSpaceRepository;
import com.example.bton.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FinancialSpaceServiceImpl {

    private final FinancialSpaceRepository spaceRepository;
    private final FamilyMemberRepository memberRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<FinancialSpaceResponse> getAccessibleSpaces(Long userId) {
        return spaceRepository.findAccessibleSpaces(userId)
                .stream().map(s -> mapToResponse(s, false)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FinancialSpaceResponse getSpaceById(Long spaceId, Long userId) {
        FinancialSpace space = spaceRepository.findAccessibleSpaceById(userId, spaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Financial space", "id", spaceId));
        return mapToResponse(space, true);
    }

    @Transactional
    public FinancialSpaceResponse createSpace(FinancialSpaceRequest request, Long userId) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        String inviteCode = null;
        if (request.getType() == SpaceType.FAMILY) {
            inviteCode = "FAM-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }

        FinancialSpace space = FinancialSpace.builder()
                .name(request.getName())
                .description(request.getDescription())
                .type(request.getType() != null ? request.getType() : SpaceType.PERSONAL)
                .currency(request.getCurrency() != null ? request.getCurrency() : "VND")
                .owner(owner)
                .inviteCode(inviteCode)
                .isActive(true)
                .build();

        space = spaceRepository.save(space);

        // If family space, add owner as OWNER member
        if (space.getType() == SpaceType.FAMILY) {
            FamilyMember ownerMember = FamilyMember.builder()
                    .space(space)
                    .user(owner)
                    .role(FamilyRole.OWNER)
                    .isActive(true)
                    .build();
            memberRepository.save(ownerMember);
        }

        return mapToResponse(space, false);
    }

    @Transactional
    public FinancialSpaceResponse joinFamilyByInviteCode(String inviteCode, Long userId) {
        if (inviteCode == null || inviteCode.trim().isEmpty()) {
            throw new BadRequestException("Mã mời không được để trống (FIN-NB08)");
        }
        FinancialSpace space = spaceRepository.findByInviteCodeAndIsActiveTrue(inviteCode.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Mã mời gia đình không hợp lệ hoặc không tồn tại (FIN-NB08)"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Kiểm tra đã là thành viên chưa
        boolean alreadyMember = memberRepository.findBySpaceIdAndUserId(space.getId(), userId).isPresent();
        if (!alreadyMember && !space.getOwner().getId().equals(userId)) {
            FamilyMember newMember = FamilyMember.builder()
                    .space(space)
                    .user(user)
                    .role(FamilyRole.MEMBER)
                    .isActive(true)
                    .build();
            memberRepository.save(newMember);
        }

        return mapToResponse(space, true);
    }

    @Transactional
    public FinancialSpaceResponse updateSpace(Long spaceId, FinancialSpaceRequest request, Long userId) {
        FinancialSpace space = getSpaceWithOwnerCheck(spaceId, userId);
        space.setName(request.getName());
        if (request.getDescription() != null) space.setDescription(request.getDescription());
        if (request.getCurrency() != null) space.setCurrency(request.getCurrency());
        return mapToResponse(spaceRepository.save(space), false);
    }

    @Transactional
    public void deleteSpace(Long spaceId, Long userId) {
        FinancialSpace space = getSpaceWithOwnerCheck(spaceId, userId);
        space.setIsActive(false);
        spaceRepository.save(space);
    }

    @Transactional
    public FamilyMemberResponse addMember(Long spaceId, String usernameOrEmail, FamilyRole role, Long requesterId) {
        FinancialSpace space = getSpaceWithOwnerCheck(spaceId, requesterId);
        if (space.getType() != SpaceType.FAMILY) {
            throw new BadRequestException("Cannot add members to a personal space");
        }

        User newMember = userRepository.findByUsernameOrEmail(usernameOrEmail, usernameOrEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + usernameOrEmail));

        if (memberRepository.existsBySpaceIdAndUserIdAndIsActiveTrue(spaceId, newMember.getId())) {
            throw new BadRequestException("User is already a member of this space");
        }

        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", requesterId));

        FamilyMember member = FamilyMember.builder()
                .space(space)
                .user(newMember)
                .role(role != null ? role : FamilyRole.MEMBER)
                .invitedBy(requester)
                .isActive(true)
                .build();

        member = memberRepository.save(member);
        return mapMemberToResponse(member);
    }

    @Transactional
    public void removeMember(Long spaceId, Long memberId, Long requesterId) {
        FinancialSpace space = getSpaceWithOwnerCheck(spaceId, requesterId);
        FamilyMember member = memberRepository.findBySpaceIdAndUserIdAndIsActiveTrue(spaceId, memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in this space"));

        if (member.getRole() == FamilyRole.OWNER) {
            throw new BadRequestException("Cannot remove the owner from the space");
        }

        member.setIsActive(false);
        memberRepository.save(member);
    }

    /**
     * FIN-NB12: A member leaves a family space on their own.
     * The owner cannot leave — they must delete the space instead.
     */
    @Transactional
    public void leaveFamily(Long spaceId, Long userId) {
        FinancialSpace space = spaceRepository.findByIdAndIsActiveTrue(spaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Financial space", "id", spaceId));

        if (space.getType() != SpaceType.FAMILY) {
            throw new BadRequestException("Chỉ có thể rời khỏi nhóm gia đình");
        }
        if (space.getOwner().getId().equals(userId)) {
            throw new BadRequestException(
                    "Chủ hộ không thể rời nhóm. Vui lòng xóa nhóm gia đình hoặc chuyển quyền chủ hộ (FIN-NB12)");
        }

        FamilyMember member = memberRepository.findBySpaceIdAndUserIdAndIsActiveTrue(spaceId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Bạn không phải thành viên của nhóm gia đình này"));

        member.setIsActive(false);
        memberRepository.save(member);
    }

    @Transactional(readOnly = true)
    public List<FamilyMemberResponse> getMembers(Long spaceId, Long userId) {
        // Check access
        spaceRepository.findAccessibleSpaceById(userId, spaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Financial space", "id", spaceId));
        return memberRepository.findBySpaceIdAndIsActiveTrue(spaceId)
                .stream().map(this::mapMemberToResponse).collect(Collectors.toList());
    }

    public void verifySpaceAccess(Long spaceId, Long userId) {
        boolean hasAccess = spaceRepository.findAccessibleSpaceById(userId, spaceId).isPresent();
        if (!hasAccess) {
            throw new AccessDeniedException("You don't have access to this financial space");
        }
    }

    private FinancialSpace getSpaceWithOwnerCheck(Long spaceId, Long userId) {
        FinancialSpace space = spaceRepository.findByIdAndIsActiveTrue(spaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Financial space", "id", spaceId));

        boolean isOwner = space.getOwner().getId().equals(userId);
        boolean isAdmin = memberRepository.findRoleBySpaceIdAndUserId(spaceId, userId)
                .map(role -> role == FamilyRole.OWNER || role == FamilyRole.ADMIN)
                .orElse(false);

        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("You don't have permission to modify this space");
        }
        return space;
    }

    private FinancialSpaceResponse mapToResponse(FinancialSpace space, boolean includeMembers) {
        var builder = FinancialSpaceResponse.builder()
                .id(space.getId())
                .name(space.getName())
                .description(space.getDescription())
                .type(space.getType())
                .currency(space.getCurrency())
                .ownerId(space.getOwner().getId())
                .ownerName(space.getOwner().getFullName())
                .inviteCode(space.getInviteCode())
                .isActive(space.getIsActive())
                .createdAt(space.getCreatedAt());

        if (includeMembers && space.getType() == SpaceType.FAMILY) {
            builder.members(memberRepository.findBySpaceIdAndIsActiveTrue(space.getId())
                    .stream().map(this::mapMemberToResponse).collect(Collectors.toList()));
        }

        return builder.build();
    }

    private FamilyMemberResponse mapMemberToResponse(FamilyMember member) {
        return FamilyMemberResponse.builder()
                .id(member.getId())
                .userId(member.getUser().getId())
                .username(member.getUser().getUsername())
                .fullName(member.getUser().getFullName())
                .email(member.getUser().getEmail())
                .avatarUrl(member.getUser().getAvatarUrl())
                .role(member.getRole())
                .joinedAt(member.getJoinedAt())
                .isActive(member.getIsActive())
                .build();
    }
}
