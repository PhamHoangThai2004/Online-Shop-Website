package com.group_2.onlineshop.repository;

import com.group_2.onlineshop.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {
}