package com.group_2.onlineshop.controller;

import com.group_2.onlineshop.dto.CartDTO;
import com.group_2.onlineshop.dto.CartItemDTO;
import com.group_2.onlineshop.entity.Cart;
import com.group_2.onlineshop.entity.CartItem;
import com.group_2.onlineshop.entity.Product;
import com.group_2.onlineshop.entity.User;
import com.group_2.onlineshop.repository.CartRepository;
import com.group_2.onlineshop.repository.ProductRepository;
import com.group_2.onlineshop.repository.UserRepository;
import com.group_2.onlineshop.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    // Lấy danh sách sản phẩm trong giỏ hàng của User: http://localhost:8080/api/cart/user/1
    @GetMapping("/user/{userId}")
    public ResponseEntity<CartDTO> getCartByUserId(@PathVariable Long userId) {
        Optional<User> user = userRepository.findById(userId);
        if (!user.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        Optional<Cart> cartOpt = cartRepository.findByUser(user.get());
        return cartOpt.map(cart -> ResponseEntity.ok(convertToResponse(cart)))
                .orElseGet(() -> {
                    Cart newCart = new Cart();
                    newCart.setUser(user.get());
                    Cart savedCart = cartRepository.save(newCart);
                    return ResponseEntity.ok(convertToResponse(savedCart));
                });
    }

    // Thêm 1 sản phẩm vào giỏ hàng: http://localhost:8080/api/cart/add?productId=1&quantity=1
    @PostMapping("/add")
    public ResponseEntity<?> addProductToCart(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestParam Long productId,
            @RequestParam int quantity) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body("Invalid Authorization header");
        }

        String token = authorizationHeader.substring(7);
        String username = jwtUtil.extractUsername(token);

        if (!jwtUtil.validateToken(token, username)) {
            return ResponseEntity.status(401).body("Invalid or expired token");
        }

        long userId;
        try {
            userId = Long.parseLong(jwtUtil.extractId(token));
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Invalid or expired token");
        }

        Optional<User> user = userRepository.findById(userId);
        Optional<Product> product = productRepository.findById(productId);
        if (!user.isPresent() || !product.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        if (quantity <= 0 || quantity > product.get().getStock()) {
            return ResponseEntity.badRequest().build();
        }

        Optional<Cart> cartOpt = cartRepository.findByUser(user.get());
        Cart cart = cartOpt.orElseGet(() -> {
            Cart newCart = new Cart();
            newCart.setUser(user.get());
            return cartRepository.save(newCart);
        });

        Optional<CartItem> existingItem = cart.getItems().stream()
                .filter(item -> item.getProduct().getId().equals(productId))
                .findFirst();
        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            item.setQuantity(item.getQuantity() + quantity);
        } else {
            CartItem newItem = new CartItem();
            newItem.setCart(cart);
            newItem.setProduct(product.get());
            newItem.setQuantity(quantity);
            cart.getItems().add(newItem);
        }

        Cart savedCart = cartRepository.save(cart);
        return ResponseEntity.ok(convertToResponse(savedCart));
    }

    // Cập nhật số lượng sản phẩm trong giỏ hàng: http://localhost:8080/api/cart/update?productId=1&quantity=1
    @PutMapping("/update")
    public ResponseEntity<?> updateCartItem(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestParam Long productId,
            @RequestParam int quantity) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body("Invalid Authorization header");
        }

        String token = authorizationHeader.substring(7);
        String username = jwtUtil.extractUsername(token);

        if (!jwtUtil.validateToken(token, username)) {
            return ResponseEntity.status(401).body("Invalid or expired token");
        }

        long userId;
        try {
            userId = Long.parseLong(jwtUtil.extractId(token));
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Invalid or expired token");
        }

        Optional<User> user = userRepository.findById(userId);
        if (!user.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        Optional<Cart> cartOpt = cartRepository.findByUser(user.get());
        if (!cartOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        Cart cart = cartOpt.get();
        Optional<CartItem> itemOpt = cart.getItems().stream()
                .filter(item -> item.getProduct().getId().equals(productId))
                .findFirst();
        if (!itemOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        CartItem item = itemOpt.get();
        if (quantity <= 0 || quantity > item.getProduct().getStock()) {
            return ResponseEntity.badRequest().build();
        }
        item.setQuantity(quantity);
        Cart savedCart = cartRepository.save(cart);
        return ResponseEntity.ok(convertToResponse(savedCart));
    }

    // Xoá 1 sản phẩm khỏi giỏ hàng http://localhost:8080/api/cart/remove?productId=1
    @DeleteMapping("/remove")
    public ResponseEntity<?> removeProductFromCart(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestParam Long productId) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body("Invalid Authorization header");
        }

        String token = authorizationHeader.substring(7);
        String username = jwtUtil.extractUsername(token);

        if (!jwtUtil.validateToken(token, username)) {
            return ResponseEntity.status(401).body("Invalid or expired token");
        }

        long userId;
        try {
            userId = Long.parseLong(jwtUtil.extractId(token));
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Invalid or expired token");
        }

        Optional<User> user = userRepository.findById(userId);
        if (!user.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        Optional<Cart> cartOpt = cartRepository.findByUser(user.get());
        if (!cartOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        Cart cart = cartOpt.get();
        cart.getItems().removeIf(item -> item.getProduct().getId().equals(productId));
        Cart savedCart = cartRepository.save(cart);
        return ResponseEntity.ok(convertToResponse(savedCart));
    }

    private CartDTO convertToResponse(Cart cart) {
        CartDTO response = new CartDTO();
        response.setId(cart.getId());
        response.setUserId(cart.getUser().getId());
        response.setItems(cart.getItems().stream().map(item -> {
            CartItemDTO itemDto = new CartItemDTO();
            Product product = item.getProduct();
            itemDto.setProductId(product.getId());
            itemDto.setProductName(product.getName());
            itemDto.setProductPrice(product.getPrice());
            itemDto.setProductSalePrice(product.getSalePrice());
            itemDto.setQuantity(item.getQuantity());
            return itemDto;
        }).collect(Collectors.toList()));
        return response;
    }
}