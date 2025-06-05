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

    // Tạo 1 đơn hàng từ danh sách sản phẩm đã chọn: http://localhost:8080/api/orders/create
    @PostMapping("/create")
    public ResponseEntity<?> createOrder(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody OrderRequest orderRequest) {
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
            return ResponseEntity.status(404).body("User not found");
        }

        if (orderRequest.getItems() == null || orderRequest.getItems().isEmpty()) {
            return ResponseEntity.badRequest().body("No items selected for the order");
        }

        // Kiểm tra số lượng tồn kho
        for (OrderRequest.OrderItemRequest item : orderRequest.getItems()) {
            Optional<Product> product = productRepository.findById(item.getProductId());
            if (!product.isPresent()) {
                return ResponseEntity.status(404).body("Product with ID " + item.getProductId() + " not found");
            }
            if (item.getQuantity() <= 0 || item.getQuantity() > product.get().getStock()) {
                return ResponseEntity.status(400).body("Invalid quantity for product with ID " + item.getProductId());
            }
        }

        Order order = new Order();
        order.setUser(user.get());
        order.setStatus("PENDING");
        order.setCreatedAt(LocalDateTime.now());
        double totalPrice = 0.0;

        Order savedOrder = orderRepository.save(order);

        for (OrderRequest.OrderItemRequest itemRequest : orderRequest.getItems()) {
            Optional<Product> product = productRepository.findById(itemRequest.getProductId());
            Product prod = product.get(); // Đã kiểm tra tồn tại ở trên

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(savedOrder);
            orderItem.setProduct(prod);
            orderItem.setQuantity(itemRequest.getQuantity());
            double price = prod.getSalePrice() != null ? prod.getSalePrice() : prod.getPrice();
            orderItem.setPrice(price);
            totalPrice += price * itemRequest.getQuantity();

            // Cập nhật tồn kho và số lượng đã bán
            prod.setStock(prod.getStock() - itemRequest.getQuantity());
            prod.setSoldQuantity(prod.getSoldQuantity() + itemRequest.getQuantity());
            productRepository.save(prod);

            orderItemRepository.save(orderItem);
        }

        order.setTotalPrice(totalPrice);
        savedOrder = orderRepository.save(order);

        // Xóa các sản phẩm đã đặt hàng khỏi giỏ hàng
        Optional<Cart> cartOpt = cartRepository.findByUser(user.get());
        if (cartOpt.isPresent()) {
            Cart cart = cartOpt.get();
            List<Long> orderedProductIds = orderRequest.getItems().stream()
                    .map(OrderRequest.OrderItemRequest::getProductId)
                    .collect(Collectors.toList());
            cart.getItems().removeIf(cartItem -> orderedProductIds.contains(cartItem.getProduct().getId()));
            cartRepository.save(cart);
        }

        return ResponseEntity.ok(convertToResponse(savedOrder));
    }

    @GetMapping
    public ResponseEntity<?> getAllOrders(@RequestHeader("Authorization") String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body("Invalid Authorization header");
        }

        String token = authorizationHeader.substring(7);
        String username = jwtUtil.extractUsername(token);

        if (!jwtUtil.validateToken(token, username)) {
            return ResponseEntity.status(401).body("Invalid or expired token");
        }
        List<OrderDTO> orders = orderRepository.findAll().stream().map(this::convertToResponse).collect(Collectors.toList());
        return ResponseEntity.ok(orders);
    }

    // Get đơn hàng bằng user: http://localhost:8080/api/orders/user
    @GetMapping("/user")
    public ResponseEntity<?> getOrdersByUser(@RequestHeader("Authorization") String authorizationHeader) {
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

    // Cập nhập status đơn hàng (chỉ dành cho ADMIN): http://localhost:8080/api/orders/2/status?status=SHIPPED
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

    // Hủy đơn hàng (user chỉ có thể hủy đơn hàng nếu status đang là PENDING)
    // http://localhost:8080/api/orders/2/cancel
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

class OrderRequest {
    private List<OrderItemRequest> items;

    public List<OrderItemRequest> getItems() {
        return items;
    }

    public void setItems(List<OrderItemRequest> items) {
        this.items = items;
    }

    static class OrderItemRequest {
        private Long productId;
        private int quantity;

        public Long getProductId() {
            return productId;
        }

        public void setProductId(Long productId) {
            this.productId = productId;
        }

        public int getQuantity() {
            return quantity;
        }

        public void setQuantity(int quantity) {
            this.quantity = quantity;
        }
    }
}