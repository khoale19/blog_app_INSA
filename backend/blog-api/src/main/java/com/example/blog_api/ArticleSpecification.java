package com.example.blog_api;

import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA Specifications for dynamic Article search, filtering, and criteria building.
 */
public final class ArticleSpecification {

    private ArticleSpecification() {}

    public static Specification<Article> withKeyword(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return (root, query, cb) -> cb.conjunction();
        }
        String pattern = "%" + keyword.toLowerCase().trim() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("title")), pattern),
                cb.like(cb.lower(root.get("content")), pattern)
        );
    }

    /** Filter by author id (uses author.id join). */
    public static Specification<Article> withAuthorId(Long authorId) {
        if (authorId == null) {
            return (root, query, cb) -> cb.conjunction();
        }
        return (root, query, cb) -> cb.and(
                cb.isNotNull(root.get("author")),
                cb.equal(root.get("author").get("id"), authorId)
        );
    }

    public static Specification<Article> withCategory(String category) {
        if (category == null || category.isBlank()) {
            return (root, query, cb) -> cb.conjunction();
        }
        return (root, query, cb) -> cb.equal(cb.lower(root.get("category")), category.toLowerCase().trim());
    }

    public static Specification<Article> withTag(String tag) {
        if (tag == null || tag.isBlank()) {
            return (root, query, cb) -> cb.conjunction();
        }
        String pattern = "%" + tag.toLowerCase().trim() + "%";
        return (root, query, cb) -> cb.like(cb.lower(root.get("tags")), pattern);
    }

    public static Specification<Article> withTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return (root, query, cb) -> cb.conjunction();
        }
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            for (String tag : tags) {
                if (tag != null && !tag.isBlank()) {
                    String pattern = "%" + tag.toLowerCase().trim() + "%";
                    predicates.add(cb.like(cb.lower(root.get("tags")), pattern));
                }
            }
            return predicates.isEmpty() ? cb.conjunction() : cb.or(predicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<Article> createdAfter(LocalDateTime dateFrom) {
        if (dateFrom == null) {
            return (root, query, cb) -> cb.conjunction();
        }
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), dateFrom);
    }

    public static Specification<Article> createdBefore(LocalDateTime dateTo) {
        if (dateTo == null) {
            return (root, query, cb) -> cb.conjunction();
        }
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), dateTo);
    }

    /** Only articles that are published (publishedAt != null and publishedAt <= now). */
    public static Specification<Article> publishedOnly(LocalDateTime now) {
        if (now == null) {
            return (root, query, cb) -> cb.conjunction();
        }
        return (root, query, cb) -> cb.and(
                cb.isNotNull(root.get("publishedAt")),
                cb.lessThanOrEqualTo(root.get("publishedAt"), now)
        );
    }

    public static Specification<Article> featuredOnly(Boolean featured) {
        if (featured == null || !featured) {
            return (root, query, cb) -> cb.conjunction();
        }
        return (root, query, cb) -> cb.isTrue(root.get("featured"));
    }

    public static Specification<Article> pinnedOnly(Boolean pinned) {
        if (pinned == null || !pinned) {
            return (root, query, cb) -> cb.conjunction();
        }
        return (root, query, cb) -> cb.isTrue(root.get("pinned"));
    }

    public static Specification<Article> combine(Specification<Article>... specs) {
        Specification<Article> result = (root, query, cb) -> cb.conjunction();
        for (Specification<Article> spec : specs) {
            if (spec != null) {
                result = result.and(spec);
            }
        }
        return result;
    }
}
