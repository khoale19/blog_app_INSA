package com.example.blog_api.service;

import com.example.blog_api.Article;
import com.example.blog_api.Role;
import com.example.blog_api.security.UserDetailsImpl;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * Granular permissions: create/update/delete based on roles.
 * - ADMIN, EDITOR: can create any, update/delete any article.
 * - AUTHOR: can create; update/delete only own articles.
 * - READER: no create/update/delete.
 */
@Service
public class ArticlePermissionService {

    public boolean canCreate(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return false;
        return hasRole(auth, Role.ADMIN, Role.EDITOR, Role.AUTHOR);
    }

    public boolean canUpdate(Article article, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return false;
        if (hasRole(auth, Role.ADMIN, Role.EDITOR)) return true;
        if (hasRole(auth, Role.AUTHOR)) return isOwnArticle(article, auth);
        return false;
    }

    public boolean canDelete(Article article, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return false;
        if (hasRole(auth, Role.ADMIN, Role.EDITOR)) return true;
        if (hasRole(auth, Role.AUTHOR)) return isOwnArticle(article, auth);
        return false;
    }

    public Long getCurrentUserId(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UserDetailsImpl)) {
            return null;
        }
        return ((UserDetailsImpl) auth.getPrincipal()).getId();
    }

    public Authentication getCurrentAuthentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }

    private boolean hasRole(Authentication auth, Role... roles) {
        if (auth.getPrincipal() instanceof UserDetailsImpl userDetails) {
            Role r = userDetails.getRole();
            for (Role role : roles) {
                if (r == role) return true;
            }
        }
        return false;
    }

    private boolean isOwnArticle(Article article, Authentication auth) {
        if (article == null || article.getAuthor() == null) return false;
        Long currentId = getCurrentUserId(auth);
        return currentId != null && currentId.equals(article.getAuthor().getId());
    }
}
