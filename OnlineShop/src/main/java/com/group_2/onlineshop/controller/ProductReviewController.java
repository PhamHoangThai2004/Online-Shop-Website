package com.group_2.onlineshop.controller;

import com.group_2.onlineshop.entity.Product;
import com.group_2.onlineshop.entity.ProductReview;
import com.group_2.onlineshop.entity.User;
import com.group_2.onlineshop.repository.ProductRepository;
import com.group_2.onlineshop.repository.ProductReviewRepository;
import com.group_2.onlineshop.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class ProductReviewController {

    @Autowired
    private ProductReviewRepository productReviewRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    // Create a product review
    @PostMapping("/products/{id}/reviews")
    public ResponseEntity<ProductReview> createReview(
            @PathVariable Long id,
            @RequestBody ProductReviewRequest reviewRequest) {
        // Check if product exists
        Optional<Product> product = productRepository.findById(id);
        if (!product.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        // Check if user exists
        Optional<User> user = userRepository.findById(reviewRequest.getUserId());
        if (!user.isPresent()) {
            return ResponseEntity.badRequest().build();
        }

        // Validate rating (1-5)
        if (reviewRequest.getRating() < 1 || reviewRequest.getRating() > 5) {
            return ResponseEntity.badRequest().build();
        }

        // Create review
        ProductReview review = new ProductReview();
        review.setProduct(product.get());
        review.setUser(user.get());
        review.setRating(reviewRequest.getRating());
        review.setComment(reviewRequest.getComment());
        review.setCreatedAt(LocalDateTime.now());

        // Save review
        ProductReview savedReview = productReviewRepository.save(review);
        return ResponseEntity.ok(savedReview);
    }

    // Update a product review
    @PutMapping("/reviews/{reviewId}")
    public ResponseEntity<ProductReview> updateReview(
            @PathVariable Long reviewId,
            @RequestBody ProductReviewRequest reviewRequest) {
        // Check if review exists
        Optional<ProductReview> existingReview = productReviewRepository.findById(reviewId);
        if (!existingReview.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        // Check if user exists and owns the review
        Optional<User> user = userRepository.findById(reviewRequest.getUserId());
        if (!user.isPresent() || !existingReview.get().getUser().getId().equals(reviewRequest.getUserId())) {
            return ResponseEntity.badRequest().build();
        }

        // Validate rating (1-5)
        if (reviewRequest.getRating() < 1 || reviewRequest.getRating() > 5) {
            return ResponseEntity.badRequest().build();
        }

        // Update review
        ProductReview review = existingReview.get();
        review.setRating(reviewRequest.getRating());
        review.setComment(reviewRequest.getComment());
        review.setCreatedAt(LocalDateTime.now()); // Update timestamp

        // Save updated review
        ProductReview updatedReview = productReviewRepository.save(review);
        return ResponseEntity.ok(updatedReview);
    }

    // Get all reviews for a product
    @GetMapping("/products/{id}/reviews")
    public ResponseEntity<List<ProductReview>> getReviewsByProduct(@PathVariable Long id) {
        // Check if product exists
        Optional<Product> product = productRepository.findById(id);
        if (!product.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        // Get reviews
        List<ProductReview> reviews = productReviewRepository.findAll().stream()
                .filter(review -> review.getProduct().getId().equals(id))
                .toList();
        return ResponseEntity.ok(reviews);
    }

    // Delete a product review
    @DeleteMapping("/reviews/{reviewId}")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Long reviewId,
            @RequestBody DeleteReviewRequest deleteRequest) {
        // Check if review exists
        Optional<ProductReview> existingReview = productReviewRepository.findById(reviewId);
        if (!existingReview.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        // Check if user exists and owns the review
        Optional<User> user = userRepository.findById(deleteRequest.getUserId());
        if (!user.isPresent() || !existingReview.get().getUser().getId().equals(deleteRequest.getUserId())) {
            return ResponseEntity.badRequest().build();
        }

        // Delete review
        productReviewRepository.deleteById(reviewId);
        return ResponseEntity.ok().build();
    }

    // Inner class for create/update review request
    public static class ProductReviewRequest {
        private Long userId;
        private int rating;
        private String comment;

        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }

        public int getRating() {
            return rating;
        }

        public void setRating(int rating) {
            this.rating = rating;
        }

        public String getComment() {
            return comment;
        }

        public void setComment(String comment) {
            this.comment = comment;
        }
    }

    // Inner class for delete review request
    public static class DeleteReviewRequest {
        private Long userId;

        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }
    }
}