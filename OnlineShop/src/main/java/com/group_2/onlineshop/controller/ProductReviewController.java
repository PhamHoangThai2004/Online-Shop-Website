package com.group_2.onlineshop.controller;

import com.group_2.onlineshop.dto.ProductReviewDTO;
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
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class ProductReviewController {

    @Autowired
    private ProductReviewRepository productReviewRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    // Lấy tất cả các review của 1 sản phẩm
    @GetMapping("/products/{id}/reviews")
    public ResponseEntity<List<ProductReviewDTO>> getReviewsByProduct(@PathVariable Long id) {
        Optional<Product> product = productRepository.findById(id);
        if (!product.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        List<ProductReview> reviews = productReviewRepository.findAll().stream()
                .filter(review -> review.getProduct().getId().equals(id))
                .toList();

        List<ProductReviewDTO> reviewDTOs = reviews.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(reviewDTOs);
    }

    // Tạo 1 review mới
    @PostMapping("/products/{id}/reviews")
    public ResponseEntity<ProductReviewDTO> createReview(
            @PathVariable Long id,
            @RequestBody ProductReviewRequest reviewRequest) {
        Optional<Product> product = productRepository.findById(id);
        if (!product.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        Optional<User> user = userRepository.findById(reviewRequest.getUserId());
        if (!user.isPresent()) {
            return ResponseEntity.badRequest().build();
        }

        if (reviewRequest.getRating() < 1 || reviewRequest.getRating() > 5) {
            return ResponseEntity.badRequest().build();
        }

        ProductReview review = new ProductReview();
        review.setProduct(product.get());
        review.setUser(user.get());
        review.setRating(reviewRequest.getRating());
        review.setComment(reviewRequest.getComment());
        review.setCreatedAt(LocalDateTime.now());

        ProductReview savedReview = productReviewRepository.save(review);
        return ResponseEntity.ok(convertToDTO(savedReview));
    }

    // Cập nhập review
    @PutMapping("/reviews/{reviewId}")
    public ResponseEntity<ProductReviewDTO> updateReview(
            @PathVariable Long reviewId,
            @RequestBody ProductReviewRequest reviewRequest) {
        Optional<ProductReview> existingReview = productReviewRepository.findById(reviewId);
        if (!existingReview.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        Optional<User> user = userRepository.findById(reviewRequest.getUserId());
        if (!user.isPresent() || !existingReview.get().getUser().getId().equals(reviewRequest.getUserId())) {
            return ResponseEntity.badRequest().build();
        }

        if (reviewRequest.getRating() < 1 || reviewRequest.getRating() > 5) {
            return ResponseEntity.badRequest().build();
        }

        ProductReview review = existingReview.get();
        review.setRating(reviewRequest.getRating());
        review.setComment(reviewRequest.getComment());
        review.setCreatedAt(LocalDateTime.now());

        ProductReview updatedReview = productReviewRepository.save(review);
        return ResponseEntity.ok(convertToDTO(updatedReview));
    }

    // Xoá 1 review
    @DeleteMapping("/reviews/{reviewId}")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Long reviewId,
            @RequestBody DeleteReviewRequest deleteRequest) {
        Optional<ProductReview> existingReview = productReviewRepository.findById(reviewId);
        if (!existingReview.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        //Kiểm tra tồn tại của user
        Optional<User> user = userRepository.findById(deleteRequest.getUserId());
        if (!user.isPresent() || !existingReview.get().getUser().getId().equals(deleteRequest.getUserId())) {
            return ResponseEntity.badRequest().build();
        }

        productReviewRepository.deleteById(reviewId);
        return ResponseEntity.ok().build();
    }

    private ProductReviewDTO convertToDTO(ProductReview review) {
        ProductReviewDTO dto = new ProductReviewDTO();
        dto.setId(review.getId());
        dto.setProductId(review.getProduct().getId());
        dto.setUserId(review.getUser().getId());
        dto.setRating(review.getRating());
        dto.setComment(review.getComment());
        dto.setCreatedAt(review.getCreatedAt());
        return dto;
    }

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