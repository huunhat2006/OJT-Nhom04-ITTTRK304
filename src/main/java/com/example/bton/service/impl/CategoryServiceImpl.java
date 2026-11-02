// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.service.impl;

import com.example.bton.dto.request.CategoryRequest;
import com.example.bton.dto.response.CategoryResponse;
import com.example.bton.entity.Category;
import com.example.bton.entity.User;
import com.example.bton.enums.CategoryType;
import com.example.bton.exception.AccessDeniedException;
import com.example.bton.exception.DuplicateResourceException;
import com.example.bton.exception.ResourceNotFoundException;
import com.example.bton.repository.CategoryRepository;
import com.example.bton.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAvailableCategories(Long userId) {
        return categoryRepository.findAvailableForUser(userId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getCategoriesByType(Long userId, CategoryType type) {
        return categoryRepository.findAvailableForUserByType(userId, type)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getSystemCategories() {
        return categoryRepository.findByIsSystemTrueAndIsActiveTrue()
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public CategoryResponse createCategory(Long userId, CategoryRequest request) {
        if (categoryRepository.existsByNameAndUserIdAndIsActiveTrue(request.getName(), userId)) {
            throw new DuplicateResourceException("Category '" + request.getName() + "' already exists");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Category category = Category.builder()
                .name(request.getName())
                .nameVi(request.getNameVi())
                .type(request.getType())
                .icon(request.getIcon())
                .color(request.getColor())
                .isSystem(false)
                .user(user)
                .isActive(true)
                .displayOrder(100)
                .build();

        return mapToResponse(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse updateCategory(Long categoryId, Long userId, CategoryRequest request) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", categoryId));

        if (category.getIsSystem()) {
            throw new AccessDeniedException("Cannot modify system categories");
        }
        if (!category.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("You don't own this category");
        }

        category.setName(request.getName());
        if (request.getNameVi() != null) category.setNameVi(request.getNameVi());
        if (request.getType() != null) category.setType(request.getType());
        if (request.getIcon() != null) category.setIcon(request.getIcon());
        if (request.getColor() != null) category.setColor(request.getColor());

        return mapToResponse(categoryRepository.save(category));
    }

    @Transactional
    public void deleteCategory(Long categoryId, Long userId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", categoryId));

        if (category.getIsSystem()) {
            throw new AccessDeniedException("Cannot delete system categories");
        }
        if (!category.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("You don't own this category");
        }

        category.setIsActive(false);
        categoryRepository.save(category);
    }

    // Admin: update system category
    @Transactional
    public CategoryResponse adminUpdateCategory(Long categoryId, CategoryRequest request) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", categoryId));
        category.setName(request.getName());
        if (request.getNameVi() != null) category.setNameVi(request.getNameVi());
        if (request.getIcon() != null) category.setIcon(request.getIcon());
        if (request.getColor() != null) category.setColor(request.getColor());
        return mapToResponse(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse adminCreateCategory(CategoryRequest request) {
        Category category = Category.builder()
                .name(request.getName())
                .nameVi(request.getNameVi())
                .type(request.getType())
                .icon(request.getIcon())
                .color(request.getColor())
                .isSystem(true)
                .isActive(true)
                .displayOrder(100)
                .build();
        return mapToResponse(categoryRepository.save(category));
    }

    @Transactional
    public void adminToggleCategory(Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", categoryId));
        category.setIsActive(!category.getIsActive());
        categoryRepository.save(category);
    }

    public CategoryResponse mapToResponse(Category category) {
        return mapCategoryStatic(category);
    }

    public static CategoryResponse mapCategoryStatic(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .nameVi(category.getNameVi())
                .type(category.getType())
                .icon(category.getIcon())
                .color(category.getColor())
                .isSystem(category.getIsSystem())
                .displayOrder(category.getDisplayOrder())
                .build();
    }
}
