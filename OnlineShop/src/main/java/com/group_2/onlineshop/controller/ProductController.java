package com.group_2.onlineshop.controller;

import com.group_2.onlineshop.dto.ImageDTO;
import com.group_2.onlineshop.dto.ProductDTO;
import com.group_2.onlineshop.entity.Image;
import com.group_2.onlineshop.entity.Product;
import com.group_2.onlineshop.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    // Get all products
    @GetMapping
    public List<ProductDTO> getAllProducts() {
        return productRepository.findAll().stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    // Get product by ID
    @GetMapping("/{id}")
    public ResponseEntity<ProductDTO> getProductById(@PathVariable Long id) {
        Optional<Product> product = productRepository.findById(id);
        return product.map(this::convertToDTO)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Create a new product
    @PostMapping
    public ProductDTO createProduct(@RequestBody Product product) {
        Product savedProduct = productRepository.save(product);
        return convertToDTO(savedProduct);
    }

    // Update a product
    @PutMapping("/{id}")
    public ResponseEntity<ProductDTO> updateProduct(@PathVariable Long id, @RequestBody Product updatedProduct) {
        Optional<Product> existingProduct = productRepository.findById(id);
        if (existingProduct.isPresent()) {
            updatedProduct.setId(id);
            Product savedProduct = productRepository.save(updatedProduct);
            return ResponseEntity.ok(convertToDTO(savedProduct));
        }
        return ResponseEntity.notFound().build();
    }

    // Delete a product
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        if (productRepository.existsById(id)) {
            productRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    // Search and filter products with pagination and sorting
    @GetMapping("/search")
    public ResponseEntity<Page<ProductDTO>> searchAndFilterProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id,asc") String sort) {
        // Xử lý sắp xếp
        String[] sortParams = sort.split(",");
        String sortField = sortParams[0];
        Sort.Direction sortDirection = Sort.Direction.fromString(sortParams[1]);
        Sort sortBy = Sort.by(sortDirection, sortField);

        // Tạo Pageable cho phân trang
        Pageable pageable = PageRequest.of(page, size, sortBy);

        // Tìm kiếm và lọc sản phẩm
        Page<Product> productPage = productRepository.searchAndFilterProducts(keyword, categoryId, minPrice, maxPrice, inStock, pageable);

        // Chuyển đổi sang DTO
        Page<ProductDTO> productDTOPage = productPage.map(this::convertToDTO);
        return ResponseEntity.ok(productDTOPage);
    }

    // Search products by keyword (using findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase)
    @GetMapping("/search-by-keyword")
    public ResponseEntity<List<ProductDTO>> searchByKeyword(@RequestParam String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return ResponseEntity.ok(getAllProducts());
        }
        List<Product> products = productRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(keyword, keyword);
        return ResponseEntity.ok(products.stream().map(this::convertToDTO).collect(Collectors.toList()));
    }

    // Filter products by category (using findByCategoryId)
    @GetMapping("/filter-by-category")
    public ResponseEntity<List<ProductDTO>> filterByCategory(@RequestParam Long categoryId) {
        List<Product> products = productRepository.findByCategoryId(categoryId);
        return ResponseEntity.ok(products.stream().map(this::convertToDTO).collect(Collectors.toList()));
    }

    // Helper method to convert Product to ProductDTO
    private ProductDTO convertToDTO(Product product) {
        ProductDTO productDTO = new ProductDTO();
        productDTO.setId(product.getId());
        productDTO.setName(product.getName());
        productDTO.setPrice(product.getPrice());
        productDTO.setSalePrice(product.getSalePrice());
        productDTO.setDescription(product.getDescription());
        productDTO.setStock(product.getStock());
        productDTO.setSoldQuantity(product.getSoldQuantity());
        productDTO.setCategoryName(product.getCategory() != null ? product.getCategory().getName() : null);
        productDTO.setImages(product.getImages() != null ?
                product.getImages().stream().map(this::convertToImageDTO).collect(Collectors.toList()) : null);
        return productDTO;
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