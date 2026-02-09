package com.example.blog_api;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ArticleRepository extends JpaRepository<Article, Long>, JpaSpecificationExecutor<Article> {

    @Query("SELECT a FROM Article a LEFT JOIN FETCH a.author WHERE a.id = :id")
    Optional<Article> findByIdWithAuthor(@Param("id") Long id);

    @Query("SELECT DISTINCT a.category FROM Article a WHERE a.category IS NOT NULL AND a.category != '' ORDER BY a.category")
    List<String> findDistinctCategories();

    @Query("SELECT COUNT(a) FROM Article a WHERE a.author.id = :authorId")
    long countByAuthorId(@Param("authorId") Long authorId);
}
