package com.group_2.onlineshop.repository;

import com.group_2.onlineshop.entity.Cart;
import com.group_2.onlineshop.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Long> {
    Optional<Cart> findByUser(User user);
}