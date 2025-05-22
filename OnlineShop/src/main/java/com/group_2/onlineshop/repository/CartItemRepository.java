package com.group_2.onlineshop.repository;

import com.group_2.onlineshop.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
}