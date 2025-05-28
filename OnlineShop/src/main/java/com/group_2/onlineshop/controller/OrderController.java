package com.group_2.onlineshop.controller;

import com.group_2.onlineshop.dto.OrderItemDTO;
import com.group_2.onlineshop.dto.OrderDTO;
import com.group_2.onlineshop.entity.*;
import com.group_2.onlineshop.repository.*;
import com.group_2.onlineshop.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    // Tạo 1 đơn hàng từ giỏ hàng: http://localhost:8080/api/orders/create
    @PostMapping("/create")
    public ResponseEntity<?> createOrder(@RequestHeader("Authorization") String authorizationHeader) {
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
        if (!cartOpt.isPresent() || cartOpt.get().getItems().isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }

        Cart cart = cartOpt.get();
        for (CartItem item : cart.getItems()) {
            Product product = item.getProduct();
            if (item.getQuantity() > product.getStock()) {
                return ResponseEntity.badRequest().body(null);
            }
        }

        Order order = new Order();
        order.setUser(user.get());
        order.setStatus("PENDING");
        order.setCreatedAt(LocalDateTime.now());
        double totalPrice = 0.0;

        Order savedOrder = orderRepository.save(order);

        for (CartItem cartItem : cart.getItems()) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(savedOrder);
            orderItem.setProduct(cartItem.getProduct());
            orderItem.setQuantity(cartItem.getQuantity());
            double price = cartItem.getProduct().getSalePrice() != null ? cartItem.getProduct().getSalePrice() : cartItem.getProduct().getPrice();
            orderItem.setPrice(price);
            totalPrice += price * cartItem.getQuantity();

            Product product = cartItem.getProduct();
            product.setStock(product.getStock() - cartItem.getQuantity());
            product.setSoldQuantity(product.getSoldQuantity() + cartItem.getQuantity());
            productRepository.save(product);

            orderItemRepository.save(orderItem);
        }

        order.setTotalPrice(totalPrice);
        savedOrder = orderRepository.save(order);

        cart.getItems().clear();
        cartRepository.save(cart);

        return ResponseEntity.ok(convertToResponse(savedOrder));
    }

    // Get đơn hàng bằng user: http://localhost:8080/api/orders/user/1
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<OrderDTO>> getOrdersByUser(@PathVariable Long userId) {
        Optional<User> user = userRepository.findById(userId);
        if (!user.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        List<Order> orders = orderRepository.findByUser(user.get());
        return ResponseEntity.ok(orders.stream().map(this::convertToResponse).collect(Collectors.toList()));
    }

    // Get đơn hàng bằng Id: http://localhost:8080/api/orders/1
    @GetMapping("/{orderId}")
    public ResponseEntity<OrderDTO> getOrderById(@PathVariable Long orderId) {
        Optional<Order> order = orderRepository.findById(orderId);
        if (!order.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(convertToResponse(order.get()));
    }

    // Cập nhập status đơn hàng(chỉ dành cho ADMIN): http://localhost:8080/api/orders/2/status?status=SHIPPED
    @PutMapping("/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable Long orderId,
            @RequestParam String status) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body("Invalid Authorization header");
        }

        String token = authorizationHeader.substring(7);
        String username = jwtUtil.extractUsername(token);

        if (!jwtUtil.validateToken(token, username)) {
            return ResponseEntity.status(401).body("Invalid or expired token");
        }

        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (!orderOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        Order order = orderOpt.get();
        if (!isValidStatus(status)) {
            return ResponseEntity.badRequest().build();
        }
        order.setStatus(status);
        Order updatedOrder = orderRepository.save(order);
        return ResponseEntity.ok(convertToResponse(updatedOrder));
    }

    // Huỷ đơn hàng (user chỉ có thể huỷ đơn hàng nếu status đang là PENDING)
//    http://localhost:8080/api/orders/2/cancel
    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<?> cancelOrder(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable Long orderId) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body("Invalid Authorization header");
        }

        String token = authorizationHeader.substring(7);
        String username = jwtUtil.extractUsername(token);

        if (!jwtUtil.validateToken(token, username)) {
            return ResponseEntity.status(401).body("Invalid or expired token");
        }

        String userId = jwtUtil.extractId(token);

        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Order order = orderOpt.get();
        if (!order.getUser().getId().toString().equals(userId)) {
            return ResponseEntity.badRequest().build();
        }
        if (!order.getStatus().equals("PENDING")) {
            return ResponseEntity.badRequest().build();
        }

        List<OrderItem> items = orderItemRepository.findAll().stream()
                .filter(item -> item.getOrder().getId().equals(orderId))
                .toList();
        for (OrderItem item : items) {
            Product product = item.getProduct();
            product.setStock(product.getStock() + item.getQuantity());
            product.setSoldQuantity(product.getSoldQuantity() - item.getQuantity());
            productRepository.save(product);
        }

        order.setStatus("CANCELLED");
        Order updatedOrder = orderRepository.save(order);
        return ResponseEntity.ok(convertToResponse(updatedOrder));
    }

    private OrderDTO convertToResponse(Order order) {
        OrderDTO response = new OrderDTO();
        response.setId(order.getId());
        response.setUserId(order.getUser().getId());
        response.setTotalPrice(order.getTotalPrice());
        response.setStatus(order.getStatus());
        response.setCreatedAt(order.getCreatedAt());

        List<OrderItem> items = orderItemRepository.findAll().stream()
                .filter(item -> item.getOrder().getId().equals(order.getId()))
                .toList();
        response.setItems(items.stream().map(item -> {
            OrderItemDTO itemDto = new OrderItemDTO();
            itemDto.setProductId(item.getProduct().getId());
            itemDto.setProductName(item.getProduct().getName());
            itemDto.setPrice(item.getPrice());
            itemDto.setQuantity(item.getQuantity());
            return itemDto;
        }).collect(Collectors.toList()));

        return response;
    }

    private boolean isValidStatus(String status) {
        return status.equals("PENDING") || status.equals("SHIPPED") || status.equals("DELIVERED") || status.equals("CANCELLED");
    }
}