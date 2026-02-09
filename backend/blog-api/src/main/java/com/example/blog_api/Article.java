package com.example.blog_api;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.hibernate.annotations.BatchSize;

import java.time.LocalDateTime;

@Entity
@BatchSize(size = 20)
@Table(name = "articles", indexes = {
    @Index(columnList = "createdAt"),
    @Index(columnList = "publishedAt"),
    @Index(columnList = "viewCount"),
    @Index(columnList = "category"),
    @Index(columnList = "featured"),
    @Index(columnList = "pinned")
})
public class Article {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    @Column(columnDefinition = "TEXT")
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    /** When null, article is draft; when set, article is published (and visible if <= now). */
    private LocalDateTime publishedAt;
    private Long viewCount = 0L;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    @JsonIgnore
    private User author;

    /** Author ID stored directly to avoid lazy loading when serializing. */
    @Column(name = "author_id", insertable = false, updatable = false)
    private Long authorId;

    private String category;
    private String tags; // comma-separated, e.g. "java,spring,boot"

    private boolean featured;
    private boolean pinned;

    public Article() {}

    public Article(String title, String content) {
        this.title = title;
        this.content = content;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(LocalDateTime publishedAt) { this.publishedAt = publishedAt; }

    public Long getViewCount() { return viewCount; }
    public void setViewCount(Long viewCount) { this.viewCount = viewCount; }

    public User getAuthor() { return author; }
    public void setAuthor(User author) { 
        this.author = author;
        // Sync authorId when author is set
        if (author != null) {
            this.authorId = author.getId();
        }
    }

    /** Author id for API; reads from column directly to avoid lazy loading. */
    public Long getAuthorId() {
        // Prefer the direct column value to avoid lazy loading
        // Fallback to author.getId() only if authorId is null (shouldn't happen in normal flow)
        return authorId != null ? authorId : (author != null ? author.getId() : null);
    }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public boolean isFeatured() { return featured; }
    public void setFeatured(boolean featured) { this.featured = featured; }

    public boolean isPinned() { return pinned; }
    public void setPinned(boolean pinned) { this.pinned = pinned; }
}