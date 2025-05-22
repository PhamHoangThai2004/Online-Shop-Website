package com.group_2.onlineshop.repository;

import com.group_2.onlineshop.entity.ProductReview;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {
}