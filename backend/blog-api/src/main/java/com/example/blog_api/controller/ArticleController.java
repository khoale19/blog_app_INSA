package com.example.blog_api.controller;

import com.example.blog_api.*;
import com.example.blog_api.dto.ArticleRequest;
import com.example.blog_api.service.ArticlePermissionService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/articles")
public class ArticleController {

    private final ArticleRepository articleRepository;
    private final UserRepository userRepository;
    private final ArticlePermissionService permissionService;

    public ArticleController(ArticleRepository articleRepository, UserRepository userRepository,
                             ArticlePermissionService permissionService) {
        this.articleRepository = articleRepository;
        this.userRepository = userRepository;
        this.permissionService = permissionService;
    }

    /**
     * GET /articles - List articles with pagination, sorting, search, and filters.
     * Query params: keyword, sort (date|popularity|title), order (asc|desc),
     *               authorId, category, tags (comma-separated), dateFrom, dateTo,
     *               publishedOnly (default true = only published), featured, pinned,
     *               page, size
     */
    @GetMapping
    public Page<Article> getAllArticles(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false, defaultValue = "desc") String order,
            @RequestParam(required = false) Long authorId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String tags,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false, defaultValue = "true") Boolean publishedOnly,
            @RequestParam(required = false) Boolean featured,
            @RequestParam(required = false) Boolean pinned,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {

        Specification<Article> spec = ArticleSpecification.combine(
                ArticleSpecification.withKeyword(keyword),
                ArticleSpecification.withAuthorId(authorId),
                ArticleSpecification.withCategory(category),
                tags == null || tags.isBlank()
                        ? ArticleSpecification.withTag(null)
                        : ArticleSpecification.withTags(parseTags(tags)),
                ArticleSpecification.createdAfter(dateFrom != null ? dateFrom.atStartOfDay() : null),
                ArticleSpecification.createdBefore(dateTo != null ? dateTo.atTime(LocalTime.MAX) : null),
                Boolean.TRUE.equals(publishedOnly) ? ArticleSpecification.publishedOnly(LocalDateTime.now()) : (root, q, cb) -> cb.conjunction(),
                ArticleSpecification.featuredOnly(featured),
                ArticleSpecification.pinnedOnly(pinned)
        );

        Sort.Direction direction = "asc".equalsIgnoreCase(order) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String sortField = switch (sort != null && !sort.isBlank() ? sort.toLowerCase() : "date") {
            case "popularity" -> "viewCount";
            case "title" -> "title";
            default -> "createdAt";
        };

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));
        return articleRepository.findAll(spec, pageable);
    }

    /**
     * GET /articles/categories - List distinct category names for filter dropdown.
     */
    @GetMapping("/categories")
    public List<String> getCategories() {
        return articleRepository.findDistinctCategories();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Article> getArticleById(@PathVariable Long id, Authentication auth) {
        Optional<Article> articleOpt = articleRepository.findByIdWithAuthor(id);
        if (articleOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Article article = articleOpt.get();
        // If not published, only author/editor/admin can see
        if (article.getPublishedAt() == null || article.getPublishedAt().isAfter(LocalDateTime.now())) {
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.notFound().build();
            }
            boolean canSee = permissionService.canUpdate(article, auth) || permissionService.canDelete(article, auth);
            if (!canSee) {
                return ResponseEntity.notFound().build();
            }
        }
        return ResponseEntity.ok(article);
    }

    @PostMapping
    public ResponseEntity<?> createArticle(@Valid @RequestBody ArticleRequest request, Authentication auth) {
        if (!permissionService.canCreate(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Insufficient role to create articles");
        }
        Long userId = permissionService.getCurrentUserId(auth);
        User author = userRepository.findById(userId).orElseThrow(() -> new IllegalStateException("User not found"));

        Article article = new Article();
        article.setTitle(request.getTitle());
        article.setContent(request.getContent());
        article.setCategory(request.getCategory());
        article.setTags(request.getTags());
        article.setAuthor(author);
        article.setCreatedAt(LocalDateTime.now());
        article.setUpdatedAt(LocalDateTime.now());
        article.setPublishedAt(request.getPublishedAt());
        article.setViewCount(0L);
        article.setFeatured(Boolean.TRUE.equals(request.getFeatured()));
        article.setPinned(Boolean.TRUE.equals(request.getPinned()));

        article = articleRepository.save(article);
        return ResponseEntity.status(HttpStatus.CREATED).body(article);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateArticle(@PathVariable Long id, @Valid @RequestBody ArticleRequest request, Authentication auth) {
        Optional<Article> articleOpt = articleRepository.findByIdWithAuthor(id);
        if (articleOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Article article = articleOpt.get();
        if (!permissionService.canUpdate(article, auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Cannot update this article");
        }
        article.setTitle(request.getTitle());
        article.setContent(request.getContent());
        if (request.getCategory() != null) article.setCategory(request.getCategory());
        if (request.getTags() != null) article.setTags(request.getTags());
        article.setUpdatedAt(LocalDateTime.now());
        if (request.getPublishedAt() != null) article.setPublishedAt(request.getPublishedAt());
        if (request.getFeatured() != null) article.setFeatured(request.getFeatured());
        if (request.getPinned() != null) article.setPinned(request.getPinned());
        article = articleRepository.save(article);
        return ResponseEntity.ok(article);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteArticle(@PathVariable Long id, Authentication auth) {
        Optional<Article> articleOpt = articleRepository.findByIdWithAuthor(id);
        if (articleOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Article article = articleOpt.get();
        if (!permissionService.canDelete(article, auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Cannot delete this article");
        }
        articleRepository.delete(article);
        return ResponseEntity.noContent().build();
    }

    private static List<String> parseTags(String tags) {
        if (tags == null || tags.isBlank()) return List.of();
        return Arrays.stream(tags.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }
}
