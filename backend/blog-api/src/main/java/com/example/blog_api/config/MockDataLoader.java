package com.example.blog_api.config;

import com.example.blog_api.Article;
import com.example.blog_api.ArticleRepository;
import com.example.blog_api.Role;
import com.example.blog_api.User;
import com.example.blog_api.UserRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Loads mock users and articles when the DB is empty (dev profile only).
 * See README for test accounts and how to test all features.
 */
@Configuration
@Profile("dev")
public class MockDataLoader {

    @Bean
    ApplicationRunner loadMockData(UserRepository userRepository,
                                   ArticleRepository articleRepository,
                                   PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.count() > 0) return; // already has data

            User testUser = new User("test", "test@email.com", passwordEncoder.encode("123456"), Role.AUTHOR);
            User mockUser = new User("mockuser", "mockuser@example.com", passwordEncoder.encode("mock123"), Role.AUTHOR);
            userRepository.saveAll(List.of(testUser, mockUser));

            LocalDateTime now = LocalDateTime.now();
            LocalDateTime past = now.minusDays(30);
            LocalDateTime future = now.plusDays(2);

            String[] categories = { "Tech", "Science", "Voyage", "Culture", "Sport" };
            String[] tagSets = { "java,spring,boot", "react,typescript", "voyage,photo", "culture,art", "sport,sante" };

            for (int i = 1; i <= 22; i++) {
                Article a = new Article();
                a.setTitle("Article de démo #" + i + " – " + (i % 2 == 0 ? "Titre plus long pour tester" : "Court"));
                a.setContent("Contenu de l'article " + i + ". Ceci permet de tester la recherche par mot-clé, la pagination, le tri et les filtres.\n\nParagraphe supplémentaire pour le rendu.");
                a.setAuthor(mockUser);
                a.setCreatedAt(past.plusDays(i));
                a.setUpdatedAt(past.plusDays(i).plusHours(1));
                a.setCategory(categories[i % categories.length]);
                a.setTags(tagSets[i % tagSets.length]);
                a.setViewCount((long) (i * 10));
                a.setFeatured(i <= 3);
                a.setPinned(i == 1 || i == 2);
                if (i <= 18) {
                    a.setPublishedAt(past.plusDays(i));
                } else if (i == 19) {
                    a.setPublishedAt(null); // draft
                } else {
                    a.setPublishedAt(future.plusHours(i)); // scheduled
                }
                articleRepository.save(a);
            }
        };
    }
}
