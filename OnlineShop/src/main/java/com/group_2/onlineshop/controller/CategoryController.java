package com.group_2.onlineshop.controller;

import com.group_2.onlineshop.dto.CategoryDTO;
import com.group_2.onlineshop.dto.ImageDTO;
import com.group_2.onlineshop.dto.ProductDTO;
import com.group_2.onlineshop.entity.Category;
import com.group_2.onlineshop.entity.Image;
import com.group_2.onlineshop.repository.CategoryRepository;
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

    // Get all categories
    @GetMapping
    public List<CategoryDTO> getAllCategories() {
        return categoryRepository.findAll().stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    // Get category by ID
    @GetMapping("/{id}")
    public ResponseEntity<CategoryDTO> getCategoryById(@PathVariable Long id) {
        Optional<Category> category = categoryRepository.findById(id);
        return category.map(this::convertToDTO)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Create a new category
    @PostMapping
    public CategoryDTO createCategory(@RequestBody Category category) {
        Category savedCategory = categoryRepository.save(category);
        return convertToDTO(savedCategory);
    }

    // Update a category
    @PutMapping("/{id}")
    public ResponseEntity<CategoryDTO> updateCategory(@PathVariable Long id, @RequestBody Category updatedCategory) {
        Optional<Category> existingCategory = categoryRepository.findById(id);
        if (existingCategory.isPresent()) {
            updatedCategory.setId(id);
            Category savedCategory = categoryRepository.save(updatedCategory);
            return ResponseEntity.ok(convertToDTO(savedCategory));
        }
        return ResponseEntity.notFound().build();
    }

    // Delete a category
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        if (categoryRepository.existsById(id)) {
            categoryRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    // Helper method to convert Category to CategoryDTO
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
            }).collect(Collectors.toList());
            categoryDTO.setProducts(productDTOs);
        }
        return categoryDTO;
    }

    // Helper method to convert Image to ImageDTO
    private ImageDTO convertToImageDTO(Image image) {
        ImageDTO imageDTO = new ImageDTO();
        imageDTO.setId(image.getId());
        imageDTO.setUrl(image.getUrl());
        imageDTO.setPublicId(image.getPublicId());
        return imageDTO;
    }
}