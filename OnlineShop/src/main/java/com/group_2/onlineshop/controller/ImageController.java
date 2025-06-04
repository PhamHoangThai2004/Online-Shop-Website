package com.group_2.onlineshop.controller;

import com.group_2.onlineshop.entity.Image;
import com.group_2.onlineshop.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/images")
public class ImageController {

    @Autowired
    private ProductRepository productRepository;

    @GetMapping("/product/{productId}")
    public ResponseEntity<Image> getFirstImageByProductId(@PathVariable Long productId) {
        return productRepository.findById(productId)
                .filter(product -> !product.getImages().isEmpty())
                .map(product -> product.getImages().get(0))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}