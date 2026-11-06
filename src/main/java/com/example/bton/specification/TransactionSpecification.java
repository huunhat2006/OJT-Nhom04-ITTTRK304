// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.specification;

import com.example.bton.entity.Category;
import com.example.bton.entity.Transaction;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

public class TransactionSpecification {

    private TransactionSpecification() {
        // Utility class
    }

    public static Specification<Transaction> search(Long spaceId, Long userId, String keyword) {
        return (root, query, cb) -> {
            Predicate predicate = cb.conjunction();

            // Only active (not soft-deleted) transactions
            predicate = cb.and(predicate, cb.or(cb.isNull(root.get("isDeleted")), cb.isFalse(root.get("isDeleted"))));

            // Scope filter: by space if specified, otherwise by user
            if (spaceId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("space").get("id"), spaceId));
            } else if (userId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("user").get("id"), userId));
            }

            // Keyword filter matching: note, description, category.name, category.nameVi
            if (keyword != null && !keyword.trim().isEmpty()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                Join<Transaction, Category> categoryJoin = root.join("category", JoinType.LEFT);

                Predicate noteMatch = cb.like(cb.lower(root.get("note")), pattern);
                Predicate descMatch = cb.like(cb.lower(root.get("description")), pattern);
                Predicate catNameMatch = cb.like(cb.lower(categoryJoin.get("name")), pattern);
                Predicate catNameViMatch = cb.like(cb.lower(categoryJoin.get("nameVi")), pattern);

                Predicate keywordMatch = cb.or(noteMatch, descMatch, catNameMatch, catNameViMatch);
                predicate = cb.and(predicate, keywordMatch);
            }

            return predicate;
        };
    }
}
