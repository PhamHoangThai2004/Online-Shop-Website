package com.group_2.onlineshop.repository;

import com.group_2.onlineshop.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartRepository extends JpaRepository<Cart, Long> {
}