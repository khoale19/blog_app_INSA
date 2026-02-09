package com.example.blog_api;

/**
 * User roles with granular permissions:
 * - ADMIN: full access (create/update/delete any article, manage users)
 * - EDITOR: create/update/delete any article
 * - AUTHOR: create own articles, update/delete own articles
 * - READER: read only
 */
public enum Role {
    ADMIN,
    EDITOR,
    AUTHOR,
    READER
}
