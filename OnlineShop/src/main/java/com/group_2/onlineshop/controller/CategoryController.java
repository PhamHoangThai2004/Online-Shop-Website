package com.group_2.onlineshop.controller;

import com.group_2.onlineshop.dto.CategoryDTO;
import com.group_2.onlineshop.dto.ImageDTO;
import com.group_2.onlineshop.dto.ProductDTO;
import com.group_2.onlineshop.entity.Category;
import com.group_2.onlineshop.entity.Image;
import com.group_2.onlineshop.repository.CategoryRepository;
import com.group_2.onlineshop.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private JwtUtil jwtUtil;

    // Lấy tất cả các danh mục: http://localhost:8080/api/categories
    @GetMapping
    public List<CategoryDTO> getAllCategories() {
        return categoryRepository.findAll().stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    // Lấy danh mục bằng Id
    @GetMapping("/{id}")
    public ResponseEntity<CategoryDTO> getCategoryById(@PathVariable Long id) {
        Optional<Category> category = categoryRepository.findById(id);
        return category.map(this::convertToDTO)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Tạo 1 danh mục mới: http://localhost:8080/api/categories
    @PostMapping
    public ResponseEntity<?> createCategory(
            @RequestBody Category category,
            @RequestHeader("Authorization") String authorizationHeader
    ) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body("Invalid Authorization header");
        }

        String token = authorizationHeader.substring(7);
        String username = jwtUtil.extractUsername(token);

        if (!jwtUtil.validateToken(token, username)) {
            return ResponseEntity.status(401).body("Invalid or expired token");
        }
        Category savedCategory = categoryRepository.save(category);
        return ResponseEntity.ok(convertToDTO(savedCategory));
    }

    // Cập nhập danh mục: http://localhost:8080/api/categories/3
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCategory(
            @PathVariable Long id,
            @RequestBody Category updatedCategory,
            @RequestHeader("Authorization") String authorizationHeader
    ) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body("Invalid Authorization header");
        }

        String token = authorizationHeader.substring(7);
        String username = jwtUtil.extractUsername(token);

        if (!jwtUtil.validateToken(token, username)) {
            return ResponseEntity.status(401).body("Invalid or expired token");
        }

        Optional<Category> existingCategory = categoryRepository.findById(id);
        if (existingCategory.isPresent()) {
            updatedCategory.setId(id);
            Category savedCategory = categoryRepository.save(updatedCategory);
            return ResponseEntity.ok(convertToDTO(savedCategory));
        }
        return ResponseEntity.notFound().build();
    }

    // Xoá danh mục: http://localhost:8080/api/categories/5
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategory(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authorizationHeader
    ) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body("Invalid Authorization header");
        }

        String token = authorizationHeader.substring(7);
        String username = jwtUtil.extractUsername(token);

        if (!jwtUtil.validateToken(token, username)) {
            return ResponseEntity.status(401).body("Invalid or expired token");
        }

        if (categoryRepository.existsById(id)) {
            categoryRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    private CategoryDTO convertToDTO(Category category) {
        CategoryDTO categoryDTO = new CategoryDTO();
        categoryDTO.setId(category.getId());
        categoryDTO.setName(category.getName());
        if (category.getProducts() != null) {
            List<ProductDTO> productDTOs = category.getProducts().stream().map(product -> {
                ProductDTO productDTO = new ProductDTO();
                productDTO.setId(product.getId());
                productDTO.setName(product.getName());
                productDTO.setPrice(product.getPrice());
                productDTO.setSalePrice(product.getSalePrice());
                productDTO.setDescription(product.getDescription());
                productDTO.setStock(product.getStock());
                productDTO.setSoldQuantity(product.getSoldQuantity());
                productDTO.setCategoryName(category.getName());
                productDTO.setImages(product.getImages() != null ?
                        product.getImages().stream().map(this::convertToImageDTO).collect(Collectors.toList()) : null);
                return productDTO;
            }).toList();
            categoryDTO.setProducts(productDTOs);
        }
        return categoryDTO;
    }

    private ImageDTO convertToImageDTO(Image image) {
        ImageDTO imageDTO = new ImageDTO();
        imageDTO.setId(image.getId());
        imageDTO.setUrl(image.getUrl());
        imageDTO.setPublicId(image.getPublicId());
        return imageDTO;
    }
}